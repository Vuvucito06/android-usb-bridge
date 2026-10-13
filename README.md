# Bean & Brew: your website as an Android app over USB

A small café website built with Next.js (menu, cart, ordering) that opens on an Android phone **like a native app** as soon as you plug the phone into your computer with a USB cable.

- Runs on your computer (**macOS or Windows**). The phone shows it full screen in an app called **Bean & Brew**, with no browser bar. It works like Electron, but on the phone.
- Works through the **USB cable only**. No Wi-Fi, no hosting, no Play Store.
- Code changes show up on the phone live while you develop.
- Orders placed on the phone appear in the terminal on your computer.

```
 Computer (Mac / Windows)                         Android phone
┌──────────────────────────────┐   USB cable   ┌─────────────────────────────┐
│ Next.js website :3000        │◀─────────────▶│ "Bean & Brew" app           │
│ npm run phone                │  ADB tunnel   │ full-screen WebView showing │
│  • finds the phone           │               │ http://localhost:3000       │
│  • forwards localhost:3000   │               │                             │
│  • installs + opens the app  │               │                             │
└──────────────────────────────┘               └─────────────────────────────┘
```

There is also a bonus tool at **`/bridge`** that mirrors and controls the phone's screen in Chrome. See [Bonus: screen mirroring](#bonus-screen-mirroring-in-the-browser).

---

## Contents

1. [What you need](#what-you-need)
2. [Install on macOS](#install-on-macos)
3. [Install on Windows](#install-on-windows)
4. [Prepare your Android phone (once)](#prepare-your-android-phone-once)
5. [Open the website on the phone](#open-the-website-on-the-phone)
6. [Change the website](#change-the-website)
7. [Change the Android app (name, icon, colours)](#change-the-android-app-name-icon-colours)
8. [Bonus: screen mirroring in the browser](#bonus-screen-mirroring-in-the-browser)
9. [Troubleshooting](#troubleshooting)
10. [How it works](#how-it-works)
11. [Limitations](#limitations)

---

## What you need

| | |
| --- | --- |
| Computer | macOS, or Windows 10/11 |
| Node.js | Version **20.9 or newer**. The steps below show how to install it. |
| Phone | Any Android phone running **Android 8.0 or newer**, with **USB debugging** turned on |
| Cable | USB-A → USB-C (or USB-C → USB-C) that carries **data**, not a charge-only cable |
| Internet | Only needed during `npm install` |

You **don't** need Android Studio, the Android SDK or `adb`. Everything comes with `npm install`.

---

## Install on macOS

### Step 1: Open Terminal

Press **⌘ Cmd + Space**, type **Terminal**, and press **Enter**. Run every command below in this window.

### Step 2: Install Node.js

Pick **one** of these options.

**Option A, the installer (easiest):**

1. Go to <https://nodejs.org>.
2. Download the **LTS** version for macOS (the `.pkg` file).
3. Open the downloaded file and click **Continue → Agree → Install**. Enter your Mac password when asked.
4. **Close Terminal and open it again.**

**Option B, Homebrew:**

```bash
brew install node
```

Check that it worked:

```bash
node -v
npm -v
```

`node -v` must print **v20.9.0 or higher**.

### Step 3: Install Git

```bash
git --version
```

If macOS shows a pop-up about **Command Line Developer Tools**, click **Install**, wait, then run `git --version` again.

> No Git? On the GitHub page click **Code → Download ZIP** and double-click the ZIP to unpack it.

### Step 4: Download the project

```bash
cd ~/Desktop
git clone https://github.com/Vuvucito06/android-usb-bridge.git
cd android-usb-bridge
```

If you used **Download ZIP**, `cd` into the unpacked folder instead.

### Step 5: Install the dependencies

```bash
npm install
```

This takes a minute or two.

### Step 6: Drivers

**None are needed on macOS.** Continue with [Prepare your Android phone](#prepare-your-android-phone-once).

---

## Install on Windows

### Step 1: Install Node.js

1. Go to <https://nodejs.org>.
2. Download the **LTS** version for Windows (the `.msi` file).
3. Run it and click **Next** through the screens, keeping the defaults. **Add to PATH** must stay selected.
4. Leave **"Automatically install the necessary tools"** unticked; it isn't needed.
5. Click **Install**, then **Finish**.

### Step 2: Install Git

1. Download **Git for Windows** from <https://git-scm.com/download/win>.
2. Run the installer and click **Next** through all screens. The defaults are fine.

> No Git? On the GitHub page click **Code → Download ZIP**, then right-click the ZIP → **Extract All**.

### Step 3: Open a terminal

Press the **Windows key**, type **cmd**, and press **Enter** to open **Command Prompt**.

> Using **PowerShell** instead? If `npm` fails with *"running scripts is disabled on this system"*, use Command Prompt, or run this once in PowerShell:
>
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

Check Node.js:

```bat
node -v
npm -v
```

`node -v` must print **v20.9.0 or higher**. If you see *"'node' is not recognized"*, open a new terminal, and restart Windows if it still fails.

### Step 4: Download the project

```bat
cd %USERPROFILE%\Desktop
git clone https://github.com/Vuvucito06/android-usb-bridge.git
cd android-usb-bridge
```

If you used **Download ZIP**, `cd` into the extracted folder instead.

### Step 5: Install the dependencies

```bat
npm install
```

### Step 6: USB driver (only if the phone isn't found)

Programs on Windows can only talk to the phone if its **ADB interface uses the WinUSB driver**. Most recent phones get it automatically, so **skip this step at first**: do [Prepare your Android phone](#prepare-your-android-phone-once) and try `npm run phone`.

Come back here **only if** the terminal keeps saying *"Waiting for an Android phone…"* while the phone is plugged in, or shows *"Can't open the phone over USB"*. This is most common with Samsung phones and PCs that have an OEM driver installed.

**If the error says *"incompatible driver is installed for this interface"*:** Windows has put a different driver (not WinUSB) on the phone's ADB interface. `npm run phone` prints which driver it is and the **USB ID** to pick in Zadig. Go straight to **Zadig** below. This can start happening on a PC where everything used to work, when:

- a phone tool or driver pack is installed, for example Xiaomi Mi PC Suite or MiFlash, Samsung drivers, a "Universal ADB driver" or an ADB installer;
- Zadig was used earlier with **libusbK** or **libusb-win32** selected instead of **WinUSB**;
- Windows Update swaps the driver;
- the phone's **USB mode** changes (File transfer / PTP / charging only). Windows treats each mode as a separate device, so switch back to the mode that worked, or fix the driver in each mode.

**Install the Google USB Driver:**

1. Download it from <https://developer.android.com/studio/run/win-usb>. Accept the license and download the ZIP.
2. Right-click the ZIP → **Extract All** → **Extract**. You get a folder named `usb_driver`.
3. Plug in the phone, unlock it, and make sure **USB debugging** is on.
4. Right-click the **Start** button → **Device Manager**.
5. Find your phone. It's usually under **Other devices**, where it may show as **ADB Interface** with a yellow ⚠, or under **Portable Devices** or **Universal Serial Bus devices**.
6. Right-click it → **Update driver** → **Browse my computer for drivers**.
7. Click **Browse**, pick the **`usb_driver`** folder, and click **Next**.
8. If Windows says *"The best drivers for your device are already installed"*:
   1. **Update driver** → **Browse my computer for drivers** → **Let me pick from a list of available drivers on my computer**.
   2. **Have Disk… → Browse**, select **`usb_driver\android_winusb.inf`**, and click **OK**.
   3. Choose **Android ADB Interface** → **Next**, then click **Yes** on the warning.
9. Unplug and replug the phone.

**Zadig.** Use this for *"incompatible driver"*, or if the Google driver didn't help.

1. Download and run Zadig from <https://zadig.akeo.ie>.
2. Click **Options → List All Devices**.
3. In the dropdown, pick the entry whose **USB ID** matches the one `npm run phone` printed, for example `2717 FF48 01`. That is the phone's **ADB Interface**. Do **not** pick the MTP or file-transfer entry, which has a different last number.
4. The box left of the arrow shows the current driver. In the box on the right, choose **WinUSB** and click **Replace Driver**.
5. Unplug and replug the phone, then run `npm run phone` again.

---

## Prepare your Android phone (once)

The same for Mac and Windows users.

### 1. Turn on Developer options

1. Open **Settings → About phone**.
2. Tap **Build number** **7 times** until you see *"You are now a developer!"*.
   - **Samsung:** Settings → About phone → **Software information** → Build number
   - **Xiaomi / Redmi / POCO:** Settings → About phone → tap **MIUI version** or **OS version**
   - **OnePlus / Oppo / Realme:** Settings → About device → **Version** → Build number

### 2. Turn on USB debugging

1. Go to **Settings → System → Developer options**. On some phones it's directly in Settings.
2. Turn on **USB debugging** and tap **OK**.
3. **Xiaomi / Redmi / POCO only:** also turn on **Install via USB** and **USB debugging (Security settings)**. Without them the app can't be installed.

### 3. Plug in the cable

If the phone asks what to *"Use USB for"*, either option is fine. If the phone isn't detected, try **File transfer**.

---

## Open the website on the phone

In the project folder, on Mac or Windows:

```bash
npm run phone
```

This starts the website and waits for the phone. If the website is already running with `npm run dev`, it uses that instead. You will see:

```
[phone] Nothing is running on port 3000, starting the website (next dev)…
[phone] Waiting for an Android phone with USB debugging… (opens http://localhost:3000/ as an app).
```

Now plug in the phone:

1. **Unlock the phone.** It asks *"Allow USB debugging?"*. Tick **Always allow from this computer** and tap **Allow**.
2. **The first time**, the script installs the **Bean & Brew** app:
   - Some phones ask *"Install via USB?"*. Tap **Install**.
   - Google Play Protect may warn about an unknown app. Tap **More details → Install anyway**. The app is built from `android-app/` in this project.
3. The app opens full screen with the café. The terminal shows:

   ```
   [phone] ✅ Pixel 7 is showing http://localhost:3000/
   ```

4. Order something on the phone. The order appears in the terminal:

   ```
   🧾 Order #1: 2× Cappuccino, 1× Butter Croissant ($10.20)
   ```

**What happens when…**

| You… | Result |
| --- | --- |
| unplug the cable | The app shows *"Waiting for the computer…"* |
| plug it back in | The script reconnects and the app reloads the site by itself |
| tap the app icon on the phone later | It opens the café if `npm run phone` is running and the cable is in, otherwise it waits |
| press **Ctrl + C** in the terminal | Everything stops |

**Other options:**

- `npm run phone:browser` opens the site in the phone's normal browser instead of the app.
- Use a different port. On Mac: `PORT=4000 npm run phone`. On Windows: `set PORT=4000 && npm run phone`.
- For the production version, run `npm run build`, then `npm start` in one terminal and `npm run phone` in another.

---

## Change the website

The café is a normal Next.js app:

| File | What it is |
| --- | --- |
| `src/lib/menu.ts` | Café name, menu items, prices, currency |
| `src/components/cafe/CafeApp.tsx` | The screens: menu, cart, order confirmation |
| `src/components/cafe/CafeApp.module.css` | Colours and layout |
| `src/app/api/orders/route.ts` | Receives orders and prints them in the terminal |

Save a file and the phone updates within a second while `npm run phone` is running.

---

## Change the Android app (name, icon, colours)

**You don't need this to use the project.** A ready-made `android-app/cafe.apk` is included. Only rebuild it if you want a different app name, icon or colours.

| File | What it is |
| --- | --- |
| `android-app/res/values/values.xml` | App name, *"Waiting…"* text, colours |
| `android-app/res/drawable/ic_launcher_foreground.xml` | App icon (coffee cup) |
| `android-app/src/com/example/cafe/MainActivity.java` | The full-screen WebView |
| `android-app/AndroidManifest.xml` | Package name and **versionCode** |

To rebuild, use macOS or Linux. On Windows, use [WSL](https://learn.microsoft.com/windows/wsl/install), because the script needs `bash` and `zip`.

1. Install **JDK 17** (<https://adoptium.net>) and **Android Studio**. Then open **Settings → Languages & Frameworks → Android SDK** and install **SDK Platform 34** and, under SDK Tools, **Build-Tools 34.0.0**.
2. Bump `android:versionCode` in `android-app/AndroidManifest.xml`, for example from `1` to `2`, so `npm run phone` knows to update the app.
3. Run:

   ```bash
   export ANDROID_HOME=~/Library/Android/sdk   # macOS default; on Linux usually ~/Android/Sdk
   ./android-app/build.sh
   ```

4. Run `npm run phone`. It installs the new version automatically.

---

## Bonus: screen mirroring in the browser

Open **<http://localhost:3000/bridge>** in **Chrome or Edge** (not Safari or Firefox) to connect the phone from the browser and see device info, run shell commands, or mirror and control its screen.

> Only one program can use the phone's USB connection at a time. **Stop `npm run phone` (Ctrl + C) before using `/bridge`**, and the other way round.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Stuck on *"Waiting for an Android phone…"* | Check that **USB debugging** is on and the phone is unlocked. Try another cable, since many are charge-only, or another USB port. Switch USB mode to **File transfer**. On **Windows**, do [Step 6](#step-6-usb-driver-only-if-the-phone-isnt-found). |
| *"incompatible driver is installed for this interface"* (Windows) | The phone's ADB interface isn't using WinUSB. Use **Zadig** with the USB ID that `npm run phone` prints. See [Step 6](#step-6-usb-driver-only-if-the-phone-isnt-found). |
| *"Can't open the phone over USB"* | Another program is using the phone. Run `adb kill-server` if you have ADB, and close **Android Studio**, **scrcpy**, **Vysor** and the **/bridge** page. On Windows also end **adb.exe** in Task Manager, and check [Step 6](#step-6-usb-driver-only-if-the-phone-isnt-found). |
| Stuck after *"tap Allow"* | Unlock the phone and look for the dialog. If it never appears: Developer options → **Revoke USB debugging authorizations**, then replug. |
| `INSTALL_FAILED_USER_RESTRICTED` | Xiaomi: turn on **Install via USB** in Developer options. Other phones: tap **Install** on the phone's prompt. |
| Play Protect blocks the app | Tap **More details → Install anyway**. |
| App shows *"Waiting for the computer…"* | Make sure the cable is plugged in and `npm run phone` is running. The app retries every 2 seconds. |
| The phone opens the browser instead of the app | You ran `npm run phone:browser`. Use `npm run phone`. |
| `npm` errors in PowerShell | Use Command Prompt, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once. |
| `node` is not recognized | Reopen the terminal after installing Node.js, and restart if needed. |
| Port 3000 is already used | Run on another port: `PORT=4000 npm run phone` (Mac) or `set PORT=4000 && npm run phone` (Windows). |

---

## How it works

1. **`scripts/phone.mjs`** (`npm run phone`) talks to the phone over USB with the ADB protocol, using [Tango ADB](https://github.com/yume-chan/ya-webadb) and the [`usb`](https://github.com/node-usb/node-usb) package, so Google's `adb` isn't needed. The first time, the phone asks you to trust this computer. The key is stored in `~/.android-usb-bridge/adbkey`, and an existing `~/.android/adbkey` from Google ADB is also accepted.
2. It sets up a **reverse tunnel**: when an app on the phone opens `localhost:3000`, the connection travels through the cable to `localhost:3000` on the computer. This is what `adb reverse tcp:3000 tcp:3000` does.
3. It installs **`android-app/cafe.apk`** if it's missing or older than `android:versionCode` in the manifest. The APK is a 17 KB app with one full-screen WebView.
4. It starts the app with the URL to open. The app keeps retrying while the computer can't be reached.

| Folder / file | Purpose |
| --- | --- |
| `src/app/page.tsx`, `src/components/cafe/` | The café website |
| `src/app/api/orders/route.ts` | Order API (prints orders on the computer) |
| `scripts/phone.mjs` | USB watcher, reverse tunnel, app install and launch |
| `android-app/` | Source of the Android shell app, plus the prebuilt `cafe.apk` |
| `src/app/bridge/`, `src/lib/adb.ts`, `src/lib/scrcpy.ts` | Bonus browser tool: WebUSB connection, shell, screen mirroring |
| `scripts/copy-scrcpy-server.mjs` | Copies the scrcpy server into `public/` after `npm install` (for `/bridge`) |

---

## Limitations

- **Android only.** iPhones don't allow this kind of USB access.
- **The phone must stay plugged in.** The website is served from your computer, so the app can't show the site without the cable and `npm run phone`.
- **Not for the Play Store as-is.** For an app that works without the computer, host the site online and point the app at that URL, for example with [Capacitor](https://capacitorjs.com).
- `npm run phone` and the `/bridge` page can't use the phone at the same time.
