# Android USB Bridge

A Next.js web app that connects to an Android phone over a USB cable, straight from the browser. Nothing needs to be installed on the phone.

Once connected you can:

- see the phone's **model, Android version and serial number**
- run **`adb shell` commands** from a text box
- **mirror the phone's screen** and control it with the mouse: tap, swipe, Back, Home, Recents

It works from **macOS → Android** and **Windows → Android** in Chrome, Edge, Opera or Brave. A **USB-A to USB-C cable** works fine, as long as it is a *data* cable and not a charge-only one.

---

## Contents

1. [What you need](#what-you-need)
2. [Install on macOS](#install-on-macos)
3. [Install on Windows](#install-on-windows)
4. [Prepare your Android phone (once)](#prepare-your-android-phone-once)
5. [Connect and use the app](#connect-and-use-the-app)
6. [Troubleshooting](#troubleshooting)
7. [Deploying online](#deploying-online)
8. [How it works](#how-it-works)
9. [Limitations](#limitations)

---

## What you need

| | |
| --- | --- |
| Computer | macOS or Windows 10/11 |
| Browser | **Google Chrome** or **Microsoft Edge**. Opera and Brave also work. **Safari and Firefox do not.** |
| Node.js | Version **20.9 or newer**. The steps below show how to install it. |
| Phone | Any Android phone with **USB debugging** turned on |
| Cable | USB-A → USB-C (or USB-C → USB-C) that carries **data** |
| Internet | Needed during `npm install`, which downloads the packages and the screen-mirroring server |

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
4. **Close Terminal and open it again** so it picks up Node.js.

**Option B, Homebrew (if you already use it):**

```bash
brew install node
```

Then check that it worked:

```bash
node -v
npm -v
```

`node -v` must print **v20.9.0 or higher**, for example `v22.11.0`.

### Step 3: Install Git

Check whether Git is already installed:

```bash
git --version
```

If macOS shows a pop-up asking to install the **Command Line Developer Tools**, click **Install**, wait for it to finish, then run `git --version` again.

> No Git? You can skip it. On the GitHub page, click **Code → Download ZIP** and double-click the ZIP to unpack it.

### Step 4: Install Google Chrome

If you don't have it yet, download it from <https://www.google.com/chrome/> and drag it into **Applications**. Microsoft Edge works too. **Safari will not work.**

### Step 5: Download the project

```bash
cd ~/Desktop
git clone https://github.com/Vuvucito06/android-usb-bridge.git
cd android-usb-bridge
```

If you used **Download ZIP** instead, run `cd ~/Downloads/android-usb-bridge-main`, or wherever you unpacked it.

### Step 6: Install the dependencies

```bash
npm install
```

This takes a minute. At the end you should see a line like:

```
Copied scrcpy server to .../public/scrcpy-server.bin
```

### Step 7: Start the app

```bash
npm run dev
```

Wait until you see `Ready`, then open **<http://localhost:3000>** in **Chrome**.

> Keep the Terminal window open while you use the app. Press **Ctrl + C** in it to stop the app.

### Step 8: Drivers

**None are needed on macOS.** Continue with [Prepare your Android phone](#prepare-your-android-phone-once).

---

## Install on Windows

### Step 1: Install Node.js

1. Go to <https://nodejs.org>.
2. Download the **LTS** version for Windows (the `.msi` file).
3. Run the installer. Click **Next** through the screens and keep the default options. **Add to PATH** must stay selected; it is by default.
4. You can leave the **"Automatically install the necessary tools"** checkbox **unticked**; it isn't needed.
5. Click **Install**, then **Finish**.

### Step 2: Install Git

1. Go to <https://git-scm.com/download/win> and download **Git for Windows**.
2. Run the installer and click **Next** through all screens. The default options are fine.

> No Git? You can skip it. On the GitHub page, click **Code → Download ZIP**, then right-click the ZIP and choose **Extract All**.

### Step 3: Install Google Chrome

Microsoft Edge is already on Windows and works. If you prefer Chrome, download it from <https://www.google.com/chrome/>.

### Step 4: Open a terminal

Press the **Windows key**, type **cmd**, and press **Enter** to open **Command Prompt**.

> Using **PowerShell** instead? If `npm` fails with *"running scripts is disabled on this system"*, either use Command Prompt or run this once in PowerShell:
>
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

Check that Node.js is installed:

```bat
node -v
npm -v
```

`node -v` must print **v20.9.0 or higher**. If you see *"'node' is not recognized"*, close the terminal, open a new one, and try again. Restart Windows if it still fails.

### Step 5: Download the project

```bat
cd %USERPROFILE%\Desktop
git clone https://github.com/Vuvucito06/android-usb-bridge.git
cd android-usb-bridge
```

If you used **Download ZIP** instead, `cd` into the extracted folder, for example `cd %USERPROFILE%\Downloads\android-usb-bridge-main\android-usb-bridge-main`.

### Step 6: Install the dependencies

```bat
npm install
```

At the end you should see a line like:

```
Copied scrcpy server to ...\public\scrcpy-server.bin
```

### Step 7: Start the app

```bat
npm run dev
```

Wait until you see `Ready`, then open **<http://localhost:3000>** in **Chrome** or **Edge**.

> Keep the terminal open while you use the app. Press **Ctrl + C** in it to stop the app. Answer `Y` if it asks *"Terminate batch job?"*.

### Step 8: USB driver (only if the phone doesn't appear)

Chrome and Edge on Windows can only talk to the phone if its **ADB interface uses the WinUSB driver**. Most recent phones get it automatically, so **first skip this step**: do [Prepare your Android phone](#prepare-your-android-phone-once) and try to connect.

Come back here **only if** the phone doesn't show up in the browser's device list, or you get **"Access denied"**. This happens most often on Samsung phones and on PCs with an OEM driver installed.

**Install the Google USB Driver:**

1. Download the driver from <https://developer.android.com/studio/run/win-usb>. Accept the license and download the ZIP.
2. Right-click the ZIP → **Extract All** → **Extract**. You get a folder named `usb_driver`.
3. Plug in the phone, unlock it, and make sure **USB debugging** is on.
4. Right-click the **Start** button → **Device Manager**.
5. Find your phone. It's usually under **Other devices**, where it may show as **ADB Interface** with a yellow ⚠ icon, or under **Portable Devices** or **Universal Serial Bus devices**.
6. Right-click it → **Update driver** → **Browse my computer for drivers**.
7. Click **Browse**, select the extracted **`usb_driver`** folder, and click **Next**.
8. If Windows says *"The best drivers for your device are already installed"*, do this instead:
   1. **Update driver** → **Browse my computer for drivers** → **Let me pick from a list of available drivers on my computer**.
   2. Click **Have Disk… → Browse**, open the `usb_driver` folder, select **`android_winusb.inf`**, and click **OK**.
   3. Choose **Android ADB Interface** → **Next**. Click **Yes** on the warning.
9. Unplug the phone, plug it back in, and **reload the web page**.

**Alternative: Zadig.** Only use this if the Google driver didn't help.

1. Download Zadig from <https://zadig.akeo.ie> and run it.
2. Click **Options → List All Devices**.
3. In the dropdown, select the entry for your phone's **ADB Interface**. Do **not** pick the MTP or file-transfer entry; changing that one breaks file transfer.
4. Make sure the driver on the right is **WinUSB** and click **Replace Driver** (or **Install Driver**).
5. Replug the phone and reload the page.

Then continue with [Prepare your Android phone](#prepare-your-android-phone-once).

---

## Prepare your Android phone (once)

These steps are the same for Mac and Windows users.

### 1. Turn on Developer options

1. Open **Settings → About phone**.
2. Tap **Build number** **7 times** until you see *"You are now a developer!"*. Enter your PIN if asked.
   - **Samsung:** Settings → About phone → **Software information** → Build number
   - **Xiaomi / Redmi / POCO:** Settings → About phone → **MIUI version** or **OS version**
   - **OnePlus / Oppo / Realme:** Settings → About device → **Version** → Build number

### 2. Turn on USB debugging

1. Go back to **Settings → System → Developer options**. On some phones, *Developer options* is directly in Settings.
2. Turn on **USB debugging** and confirm with **OK**.
3. **Xiaomi / Redmi / POCO only:** also turn on **USB debugging (Security settings)**. Without it, the screen mirror is visible but taps don't work.

### 3. Plug in the cable

Connect the phone to the computer. If the phone shows a *"Use USB for"* notification, either option is fine. If the phone isn't detected later, try switching it to **File transfer**.

---

## Connect and use the app

1. Open **<http://localhost:3000>** in Chrome or Edge.
2. Click **Connect phone**.
3. A browser pop-up lists USB devices. Select your phone and click **Connect**.
4. **Unlock the phone.** It shows *"Allow USB debugging?"*. Tick **Always allow from this computer** and tap **Allow**.
5. The page now shows your phone's model and Android version.

Now you can:

- **Screen → Start mirroring:** the phone's screen appears in the page. Click to tap, drag to swipe, and use the **Back / Home / Recents** buttons. Click **Stop mirroring** to end it.
- **Shell:** type a command and click **Run**. Some to try:
  - `getprop ro.product.model`: phone model
  - `pm list packages`: installed apps
  - `dumpsys battery`: battery info
- **Disconnect:** releases the phone.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| *"This browser has no WebUSB"* | Use Chrome or Edge. Safari and Firefox are not supported. |
| *"WebUSB only works on https:// or http://localhost"* | Open `http://localhost:3000`, not an IP address like `http://192.168.x.x:3000`. |
| The phone isn't in the browser's device list | Check that **USB debugging** is on and the phone is unlocked. Try another cable, since many are charge-only, or another USB port. Switch the phone's USB mode to **File transfer**. On **Windows**, do [Step 8](#step-8-usb-driver-only-if-the-phone-doesnt-appear). |
| *"The phone is being used by another program"* | Only one program can use the phone at a time. Run `adb kill-server` if you have ADB installed, and close **Android Studio**, **scrcpy**, **Vysor**, and any other tab with this app open. On Windows, also end **adb.exe** in Task Manager. |
| *"Access denied"* (Windows) | The ADB interface isn't using WinUSB. See [Step 8](#step-8-usb-driver-only-if-the-phone-doesnt-appear). |
| Stuck on *"Unlock your phone and tap “Allow”…"* | Unlock the phone and look for the dialog. If it doesn't appear, unplug the phone, go to Developer options → **Revoke USB debugging authorizations**, plug it back in, and connect again. |
| Mirror shows but taps don't work (Xiaomi) | Turn on **USB debugging (Security settings)** in Developer options. |
| *"public/scrcpy-server.bin is missing"* | Run `npm install` again while connected to the internet. |
| `npm` errors in PowerShell on Windows | Use Command Prompt, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once. |
| `node` is not recognized | Close and reopen the terminal after installing Node.js. Restart the computer if needed. |

---

## Deploying online

WebUSB needs a secure page: **`https://`** or **`http://localhost`**. A site deployed with HTTPS, for example on Vercel, works. People open it in Chrome or Edge and connect their own phone to their own computer.

The USB connection always runs **in the browser** of the computer the phone is plugged into. The Next.js server never touches USB.

---

## How it works

| File | Purpose |
| --- | --- |
| `src/lib/adb.ts` | WebUSB device picker → ADB handshake (RSA key kept in IndexedDB) → shell commands |
| `src/lib/scrcpy.ts` | Pushes `public/scrcpy-server.bin` to the phone, starts it, decodes H.264 video with WebCodecs into a `<canvas>`, and sends touch and key events back |
| `src/components/AndroidUsbBridge.tsx` | The user interface |
| `src/components/AndroidUsbBridgeClient.tsx` | Loads the UI with `ssr: false`, because WebUSB only exists in the browser |
| `scripts/copy-scrcpy-server.mjs` | Runs after `npm install` and copies the downloaded scrcpy server into `public/` |

It is built on [Tango ADB](https://github.com/yume-chan/ya-webadb) (the `@yume-chan/*` packages) and [scrcpy](https://github.com/Genymobile/scrcpy).

The scrcpy server version (`3.3.3`) is set in the `postinstall` script in `package.json`, and it must be a version that `@yume-chan/scrcpy` supports. To upgrade, change it there and update all `@yume-chan/*` packages together.

---

## Limitations

- **Android only.** iPhones don't support ADB, and iOS has no equivalent browser API.
- **Chromium browsers only** (Chrome, Edge, Opera, Brave). Safari and Firefox don't support WebUSB.
- **No audio** forwarding. scrcpy supports it, but this demo turns it off to stay simple.
