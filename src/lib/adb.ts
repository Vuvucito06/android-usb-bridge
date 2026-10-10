import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import {
  AdbDaemonWebUsbDevice,
  AdbDaemonWebUsbDeviceManager,
} from "@yume-chan/adb-daemon-webusb";

// The RSA key this browser uses to authenticate is stored in IndexedDB, so the
// phone only asks "Allow USB debugging?" once (if "Always allow" is ticked).
const credentialStore = new AdbWebCredentialStore("Android USB Bridge");

export type UnsupportedReason = "insecure-context" | "no-webusb";

/** Returns why WebUSB can't be used here, or `undefined` if it can. */
export function getUnsupportedReason(): UnsupportedReason | undefined {
  if (!window.isSecureContext) return "insecure-context";
  if (!AdbDaemonWebUsbDeviceManager.BROWSER) return "no-webusb";
  return undefined;
}

export interface DeviceInfo {
  serial: string;
  model: string;
  androidVersion: string;
}

/**
 * Opens Chrome's USB device picker, connects to the selected phone and
 * performs the ADB handshake. Resolves to `undefined` if the user closed the
 * picker without choosing a device.
 *
 * `onWaitingForApproval` fires when the handshake starts — that's when the
 * phone shows the "Allow USB debugging?" dialog for a new computer.
 */
export async function connectAdb(
  onWaitingForApproval?: () => void,
): Promise<Adb | undefined> {
  const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
  if (!manager) throw new Error("WebUSB is not available in this browser.");

  const device = await manager.requestDevice();
  if (!device) return undefined;

  let connection;
  try {
    connection = await device.connect();
  } catch (error) {
    // Chrome on Windows can only open interfaces bound to the WinUSB driver.
    const driverHint = navigator.userAgent.includes("Windows")
      ? " On Windows this can also mean the phone's ADB interface isn't using " +
        "the WinUSB driver: install the Google USB Driver (or use Zadig to " +
        "switch the \"ADB Interface\" to WinUSB), then replug the cable."
      : "";
    if (error instanceof AdbDaemonWebUsbDevice.DeviceBusyError) {
      throw new Error(
        "The phone is being used by another program. Run `adb kill-server` " +
          "and close Android Studio, scrcpy, or other WebADB tabs, then try again." +
          driverHint,
      );
    }
    if (error instanceof DOMException && error.name === "SecurityError") {
      throw new Error(`Access to the phone was denied.${driverHint}`);
    }
    throw error;
  }

  onWaitingForApproval?.();
  const transport = await AdbDaemonTransport.authenticate({
    serial: device.serial,
    connection,
    credentialStore,
  });
  return new Adb(transport);
}

export async function getDeviceInfo(adb: Adb): Promise<DeviceInfo> {
  const [model, androidVersion] = await Promise.all([
    adb.banner.model ?? adb.getProp("ro.product.model"),
    adb.getProp("ro.build.version.release"),
  ]);
  return { serial: adb.serial, model, androidVersion };
}

/** Runs a shell command on the phone and returns its combined output. */
export function runShell(adb: Adb, command: string): Promise<string> {
  return adb.subprocess.noneProtocol.spawnWaitText(command);
}
