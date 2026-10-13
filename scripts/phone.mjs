// Opens this website on an Android phone as an app, over the USB cable.
//
//   npm run phone            -> install + open the "Café" app (a full-screen WebView)
//   npm run phone:browser    -> open the site in the phone's browser instead
//
// Whenever a phone with USB debugging is plugged in, this script:
//   1. connects to it over USB (ADB protocol, no Android SDK needed),
//   2. forwards the phone's localhost:PORT to this computer's localhost:PORT
//      through the cable (like `adb reverse`), so no Wi-Fi is needed,
//   3. installs android-app/cafe.apk if it's missing or outdated, and opens it.
// It also starts `next dev` if nothing is running on PORT yet.
import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import {
  AdbDaemonWebUsbDevice,
  AdbDefaultInterfaceFilter,
  findUsbInterface,
} from "@yume-chan/adb-daemon-webusb";
import { PackageManager } from "@yume-chan/android-bin";
import { execFile, spawn } from "node:child_process";
import { createPrivateKey, generateKeyPairSync } from "node:crypto";
import { once } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { connect } from "node:net";
import { homedir, hostname, userInfo } from "node:os";
import { dirname, join } from "node:path";
import { Duplex } from "node:stream";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { usb } from "usb";

const PORT = Number(process.env.PORT ?? 3000);
const SITE_URL = `http://localhost:${PORT}/`;
const OPEN_IN_BROWSER = process.argv.includes("--browser");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APK_PATH = join(ROOT, "android-app", "cafe.apk");
const MANIFEST_PATH = join(ROOT, "android-app", "AndroidManifest.xml");
const APP_ID = "com.example.cafe";
const APP_ACTIVITY = `${APP_ID}/.MainActivity`;

const log = (message) => console.log(`[phone] ${message}`);

/**
 * Stores this computer's ADB key in ~/.android-usb-bridge/adbkey. Also tries
 * Google ADB's key, so phones that already trust `adb` don't ask again.
 */
class FileCredentialStore {
  #file = join(homedir(), ".android-usb-bridge", "adbkey");
  #googleAdbKey = join(homedir(), ".android", "adbkey");
  #name = `${userInfo().username}@${hostname()}`;

  async generateKey() {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    await mkdir(dirname(this.#file), { recursive: true });
    await writeFile(this.#file, privateKey.export({ type: "pkcs8", format: "pem" }), {
      mode: 0o600,
    });
    return this.#toAdbKey(privateKey);
  }

  async *iterateKeys() {
    for (const file of [this.#file, this.#googleAdbKey]) {
      let pem;
      try {
        pem = await readFile(file, "utf8");
      } catch {
        continue;
      }
      yield this.#toAdbKey(createPrivateKey(pem));
    }
  }

  #toAdbKey(privateKey) {
    const der = privateKey.export({ type: "pkcs8", format: "der" });
    return { buffer: new Uint8Array(der), name: this.#name };
  }
}

const credentialStore = new FileCredentialStore();

/** Pipes one connection from the phone's localhost:PORT to this computer's. */
async function forwardToComputer(phoneSocket) {
  const tcp = connect({ host: "localhost", port: PORT });
  // If the website isn't running, throwing here closes the phone's connection.
  await once(tcp, "connect");
  const { readable, writable } = Duplex.toWeb(tcp);
  // Don't await: the phone's socket only starts flowing after this returns.
  readable.pipeTo(phoneSocket.writable).catch(() => {});
  phoneSocket.readable.pipeTo(writable).catch(() => {});
}

async function readApkVersionCode() {
  const manifest = await readFile(MANIFEST_PATH, "utf8");
  return Number(/android:versionCode="(\d+)"/.exec(manifest)?.[1] ?? 0);
}

async function installApp(packageManager) {
  const apk = await readFile(APK_PATH);
  await packageManager.installStream(
    apk.byteLength,
    new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(apk));
        controller.close();
      },
    }),
  );
}

/** Installs the app if it's missing or older than android-app/cafe.apk. */
async function ensureAppInstalled(adb) {
  const packageManager = new PackageManager(adb);
  let installed;
  for await (const pkg of packageManager.listPackages({
    filter: APP_ID,
    showVersionCode: true,
  })) {
    if (pkg.packageName === APP_ID) installed = pkg;
  }

  const apkVersion = await readApkVersionCode();
  if (installed && (installed.versionCode ?? 0) >= apkVersion) return;

  log(installed ? "Updating the app on the phone…" : "Installing the app on the phone…");
  try {
    await installApp(packageManager);
  } catch (error) {
    // The APK was rebuilt with a different signing key: replace the old app.
    if (!String(error?.message).includes("INSTALL_FAILED_UPDATE_INCOMPATIBLE")) throw error;
    await packageManager.uninstall(APP_ID);
    await installApp(packageManager);
  }
}

async function openOnPhone(adb) {
  const command = OPEN_IN_BROWSER
    ? ["am", "start", "-a", "android.intent.action.VIEW", "-d", SITE_URL]
    : ["am", "start", "-n", APP_ACTIVITY, "--es", "url", SITE_URL];
  const output = await adb.subprocess.noneProtocol.spawnWaitText(command);
  if (output.includes("Error")) throw new Error(output.trim());
}

const hex = (value, length) => value.toString(16).toUpperCase().padStart(length, "0");

/**
 * Windows only: asks Plug and Play which driver the phone's ADB interface
 * uses. Programs that talk to USB directly (this script, Chrome) need WinUSB.
 */
async function findWindowsAdbDriver(device) {
  const { vendorId, productId } = device.raw;
  const adbInterface = findUsbInterface(device.raw, AdbDefaultInterfaceFilter);
  const deviceId = `USB\\VID_${hex(vendorId, 4)}&PID_${hex(productId, 4)}`;
  const interfaceId = `${deviceId}&MI_${hex(adbInterface.interface_.interfaceNumber, 2)}`;
  // Composite phones (MTP + ADB) have one node per interface; ADB-only phones have one node.
  const script = `
    $d = Get-PnpDevice -PresentOnly | Where-Object InstanceId -like '${interfaceId}\\*' | Select-Object -First 1
    if (-not $d) { $d = Get-PnpDevice -PresentOnly | Where-Object InstanceId -like '${deviceId}\\*' | Select-Object -First 1 }
    if ($d) {
      $keys = 'DEVPKEY_Device_Service', 'DEVPKEY_Device_DriverProvider', 'DEVPKEY_Device_DriverInfPath'
      $values = $keys | ForEach-Object { (Get-PnpDeviceProperty -InstanceId $d.InstanceId -KeyName $_).Data }
      (@($d.InstanceId, $d.FriendlyName) + $values) -join '|'
    }`;
  const { stdout } = await promisify(execFile)(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")],
    { timeout: 15_000 },
  );
  const [instanceId = "", name, service, provider, inf] = stdout.trim().split("|");
  // Zadig shows "VID PID MI" for an interface of a composite device, "VID PID" otherwise.
  let zadigUsbId = `${hex(vendorId, 4)} ${hex(productId, 4)}`;
  if (instanceId.includes("&MI_")) zadigUsbId += ` ${hex(adbInterface.interface_.interfaceNumber, 2)}`;
  return { name, service, provider, inf, zadigUsbId };
}

async function explainUsbError(device, error) {
  const reason = `Can't open the phone over USB (${error.message}).`;

  if (process.platform === "win32" && /driver|winusb/i.test(error.message)) {
    const driver = await findWindowsAdbDriver(device).catch(() => undefined);
    const current = driver?.service
      ? `Right now Windows uses the "${driver.service}" driver` +
        (driver.provider ? ` from ${driver.provider}` : "") +
        (driver.inf ? ` (${driver.inf})` : "") +
        ` for "${driver.name}".`
      : "Right now Windows uses a different driver.";
    return [
      reason,
      `The phone's ADB interface must use the WinUSB driver. ${current}`,
      "Fix: open Zadig (https://zadig.akeo.ie) → Options → List All Devices → pick the entry with " +
        `USB ID ${driver?.zadigUsbId ?? "of your phone's ADB Interface"} → choose WinUSB → Replace Driver, ` +
        "then unplug and replug the phone. Details: README → Install on Windows → Step 6.",
    ].join("\n          ");
  }

  return (
    `${reason} Close other programs using it (run \`adb kill-server\`, close ` +
    "Android Studio, scrcpy or the /bridge page)."
  );
}

const activeSerials = new Set();

async function handlePhone(device) {
  if (activeSerials.has(device.serial)) return;
  activeSerials.add(device.serial);

  try {
    log(`Found ${device.name} (${device.serial})`);
    let connection;
    try {
      connection = await device.connect();
    } catch (error) {
      throw new Error(await explainUsbError(device, error));
    }

    log("Connecting… if the phone asks “Allow USB debugging?”, tap Allow.");
    const transport = await AdbDaemonTransport.authenticate({
      serial: device.serial,
      connection,
      credentialStore,
    });
    const adb = new Adb(transport);

    await adb.reverse.add(`tcp:${PORT}`, forwardToComputer);
    if (!OPEN_IN_BROWSER) await ensureAppInstalled(adb);
    await openOnPhone(adb);
    log(`✅ ${adb.banner.model ?? device.name} is showing ${SITE_URL}`);

    await adb.disconnected;
    log(`Phone disconnected (${device.serial})`);
  } catch (error) {
    log(`❌ ${error?.message ?? error}`);
  } finally {
    activeSerials.delete(device.serial);
  }
}

async function isWebsiteRunning() {
  const socket = connect({ host: "localhost", port: PORT });
  try {
    await once(socket, "connect");
    return true;
  } catch {
    return false;
  } finally {
    socket.destroy();
  }
}

if (!(await isWebsiteRunning())) {
  log(`Nothing is running on port ${PORT}, starting the website (next dev)…`);
  const next = createRequire(import.meta.url).resolve("next/dist/bin/next");
  const server = spawn(process.execPath, [next, "dev", "-p", String(PORT)], {
    cwd: ROOT,
    stdio: "inherit",
  });
  server.on("exit", (code) => process.exit(code ?? 0));
  process.on("exit", () => server.kill());
}

/** Wraps a USB device if it has an ADB interface (i.e. USB debugging is on). */
function toAdbDevice(rawDevice) {
  try {
    const adbInterface = findUsbInterface(rawDevice, AdbDefaultInterfaceFilter);
    return adbInterface && new AdbDaemonWebUsbDevice(rawDevice, adbInterface, usb);
  } catch {
    // Some USB devices (hubs, keyboards…) can't be inspected without extra permissions.
    return undefined;
  }
}

function checkDevice(rawDevice) {
  const device = toAdbDevice(rawDevice);
  if (device) void handlePhone(device);
}

usb.addEventListener("connect", (event) => checkDevice(event.device));
for (const rawDevice of await usb.getDevices()) checkDevice(rawDevice);

log(
  `Waiting for an Android phone with USB debugging… (opens ${SITE_URL} ` +
    `${OPEN_IN_BROWSER ? "in the browser" : "as an app"}). Press Ctrl+C to stop.`,
);
