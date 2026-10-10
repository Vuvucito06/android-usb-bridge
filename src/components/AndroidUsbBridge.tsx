"use client";

import type { Adb } from "@yume-chan/adb";
import { ScrcpyPointerId } from "@yume-chan/scrcpy";
import { useRef, useState, type FormEvent, type PointerEvent } from "react";

import {
  connectAdb,
  getDeviceInfo,
  getUnsupportedReason,
  runShell,
  type DeviceInfo,
} from "@/lib/adb";
import { ScreenMirror, type NavKey } from "@/lib/scrcpy";

import styles from "./AndroidUsbBridge.module.css";

type Status = "idle" | "connecting" | "approve" | "connected";
type MirrorState = "off" | "starting" | "on";

const UNSUPPORTED_MESSAGES = {
  "insecure-context":
    "WebUSB only works on https:// or http://localhost. Open the app through localhost, or serve it over HTTPS.",
  "no-webusb":
    "This browser has no WebUSB. Use Chrome, Edge, Opera or Brave. Safari and Firefox don't support it.",
} as const;

const NAV_BUTTONS: { key: NavKey; label: string }[] = [
  { key: "back", label: "◀ Back" },
  { key: "home", label: "● Home" },
  { key: "recents", label: "■ Recents" },
];

export default function AndroidUsbBridge() {
  const [unsupported] = useState(getUnsupportedReason);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<DeviceInfo>();
  const adbRef = useRef<Adb>(undefined);

  const [command, setCommand] = useState("getprop ro.product.manufacturer");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mirrorRef = useRef<ScreenMirror>(undefined);
  const [mirrorState, setMirrorState] = useState<MirrorState>("off");

  function reset() {
    adbRef.current = undefined;
    mirrorRef.current = undefined;
    setMirrorState("off");
    setInfo(undefined);
    setOutput("");
    setStatus("idle");
  }

  async function connect() {
    setError(undefined);
    setStatus("connecting");
    try {
      const adb = await connectAdb(() => setStatus("approve"));
      if (!adb) {
        setStatus("idle");
        return;
      }
      adbRef.current = adb;
      setInfo(await getDeviceInfo(adb));
      setStatus("connected");

      void adb.disconnected.then(() => {
        // Skip if we closed it ourselves via the Disconnect button.
        if (adbRef.current !== adb) return;
        reset();
        setError("Phone disconnected (cable unplugged or USB debugging turned off).");
      });
    } catch (e) {
      setStatus("idle");
      setError(toMessage(e));
    }
  }

  async function disconnect() {
    const adb = adbRef.current;
    const mirror = mirrorRef.current;
    reset();
    await mirror?.close().catch(() => {});
    await adb?.close();
  }

  async function submitShell(event: FormEvent) {
    event.preventDefault();
    if (!adbRef.current || !command.trim()) return;
    setRunning(true);
    try {
      setOutput((await runShell(adbRef.current, command)) || "(no output)");
    } catch (e) {
      setOutput(toMessage(e));
    } finally {
      setRunning(false);
    }
  }

  async function toggleMirror() {
    if (mirrorRef.current) {
      const mirror = mirrorRef.current;
      mirrorRef.current = undefined;
      setMirrorState("off");
      await mirror.close().catch(() => {});
      return;
    }
    if (!adbRef.current || !canvasRef.current) return;

    setError(undefined);
    setMirrorState("starting");
    try {
      mirrorRef.current = await ScreenMirror.start(adbRef.current, canvasRef.current);
      setMirrorState("on");
    } catch (e) {
      setMirrorState("off");
      setError(toMessage(e));
    }
  }

  function handlePointer(phase: "down" | "move" | "up", event: PointerEvent<HTMLCanvasElement>) {
    const mirror = mirrorRef.current;
    if (!mirror) return;
    // Mouse moves without a pressed button are hovers, not drags.
    if (phase === "move" && event.pointerType === "mouse" && event.buttons === 0) return;

    event.preventDefault();
    if (phase === "down") event.currentTarget.setPointerCapture(event.pointerId);

    const rect = event.currentTarget.getBoundingClientRect();
    // A mouse click acts as a finger tap; real touches keep their own ids for multi-touch.
    const pointerId =
      event.pointerType === "mouse" ? ScrcpyPointerId.Finger : BigInt(event.pointerId);
    void mirror.touch(
      phase,
      (event.clientX - rect.left) / rect.width,
      (event.clientY - rect.top) / rect.height,
      pointerId,
    );
  }

  if (unsupported) {
    return (
      <main className={styles.main}>
        <h1>Android USB Bridge</h1>
        <p className={styles.error}>{UNSUPPORTED_MESSAGES[unsupported]}</p>
      </main>
    );
  }

  const connected = status === "connected";

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1>Android USB Bridge</h1>
        <p className={styles.muted}>
          Connect an Android phone with a USB data cable, then click Connect.
        </p>
      </header>

      <section className={styles.card}>
        {connected && info ? (
          <div className={styles.row}>
            <div>
              <strong>{info.model}</strong>
              <div className={styles.muted}>
                Android {info.androidVersion} · {info.serial}
              </div>
            </div>
            <button onClick={disconnect}>Disconnect</button>
          </div>
        ) : (
          <div className={styles.row}>
            <span className={styles.muted}>
              {status === "connecting" && "Choose your phone in the browser dialog…"}
              {status === "approve" &&
                "Unlock your phone and tap “Allow” on the USB debugging prompt."}
              {status === "idle" && "No phone connected."}
            </span>
            <button className={styles.primary} onClick={connect} disabled={status !== "idle"}>
              Connect phone
            </button>
          </div>
        )}
        {error && <p className={styles.error}>{error}</p>}
      </section>

      {connected && (
        <>
          <section className={styles.card}>
            <h2>Screen</h2>
            <div className={styles.row}>
              <button onClick={toggleMirror} disabled={mirrorState === "starting"}>
                {mirrorState === "off" && "Start mirroring"}
                {mirrorState === "starting" && "Starting…"}
                {mirrorState === "on" && "Stop mirroring"}
              </button>
              {mirrorState === "on" &&
                NAV_BUTTONS.map(({ key, label }) => (
                  <button key={key} onClick={() => mirrorRef.current?.pressKey(key)}>
                    {label}
                  </button>
                ))}
            </div>
            {/* Mounted before mirroring starts so the renderer can attach to it. */}
            <canvas
              ref={canvasRef}
              className={styles.screen}
              hidden={mirrorState !== "on"}
              onPointerDown={(e) => handlePointer("down", e)}
              onPointerMove={(e) => handlePointer("move", e)}
              onPointerUp={(e) => handlePointer("up", e)}
              onPointerCancel={(e) => handlePointer("up", e)}
              onContextMenu={(e) => e.preventDefault()}
            />
          </section>

          <section className={styles.card}>
            <h2>Shell</h2>
            <form className={styles.row} onSubmit={submitShell}>
              <input
                className={styles.input}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="e.g. pm list packages"
                spellCheck={false}
              />
              <button type="submit" disabled={running}>
                {running ? "Running…" : "Run"}
              </button>
            </form>
            {output && <pre className={styles.output}>{output}</pre>}
          </section>
        </>
      )}

      <details className={styles.card}>
        <summary>Troubleshooting</summary>
        <ul>
          <li>
            On the phone, enable <b>Developer options → USB debugging</b>, and use a cable
            that carries data, not one that only charges.
          </li>
          <li>
            Only one program can talk to the phone at a time. Run <code>adb kill-server</code>{" "}
            and close Android Studio, scrcpy, and other WebADB tabs.
          </li>
          <li>
            <b>Windows:</b> if the phone doesn&apos;t appear or access is denied, install the{" "}
            <a href="https://developer.android.com/studio/run/win-usb" target="_blank" rel="noreferrer">
              Google USB Driver
            </a>{" "}
            (or switch the &quot;ADB Interface&quot; to WinUSB with Zadig) and replug.
          </li>
          <li>
            <b>macOS:</b> no driver is needed. Use Chrome or Edge, not Safari.
          </li>
        </ul>
      </details>
    </main>
  );
}

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
