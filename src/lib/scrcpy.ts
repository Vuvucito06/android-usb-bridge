import type { Adb } from "@yume-chan/adb";
import {
  AdbScrcpyClient,
  AdbScrcpyExitedError,
  AdbScrcpyOptionsLatest,
} from "@yume-chan/adb-scrcpy";
// Written by `fetch-scrcpy-server` in postinstall; always matches public/scrcpy-server.bin
import { VERSION } from "@yume-chan/fetch-scrcpy-server/version.js";
import {
  AndroidKeyCode,
  AndroidKeyEventAction,
  AndroidKeyEventMeta,
  AndroidMotionEventAction,
  DefaultServerPath,
} from "@yume-chan/scrcpy";
import {
  BitmapVideoFrameRenderer,
  WebCodecsVideoDecoder,
  WebGLVideoFrameRenderer,
} from "@yume-chan/scrcpy-decoder-webcodecs";
import { ReadableStream, WritableStream } from "@yume-chan/stream-extra";

export type NavKey = "back" | "home" | "recents";

const NAV_KEY_CODES = {
  back: AndroidKeyCode.AndroidBack,
  home: AndroidKeyCode.AndroidHome,
  recents: AndroidKeyCode.AndroidAppSwitch,
} as const;

const TOUCH_ACTIONS = {
  down: AndroidMotionEventAction.Down,
  move: AndroidMotionEventAction.Move,
  up: AndroidMotionEventAction.Up,
} as const;

/**
 * Mirrors the phone's screen into a <canvas> and forwards touches/keys back,
 * using the scrcpy server (pushed to the phone over ADB on every start).
 */
export class ScreenMirror {
  readonly #client: AdbScrcpyClient<AdbScrcpyOptionsLatest<true>>;
  readonly #decoder: WebCodecsVideoDecoder;

  private constructor(
    client: AdbScrcpyClient<AdbScrcpyOptionsLatest<true>>,
    decoder: WebCodecsVideoDecoder,
  ) {
    this.#client = client;
    this.#decoder = decoder;
  }

  static async start(adb: Adb, canvas: HTMLCanvasElement) {
    if (!WebCodecsVideoDecoder.isSupported) {
      throw new Error("This browser doesn't support WebCodecs video decoding.");
    }

    const response = await fetch("/scrcpy-server.bin");
    if (!response.ok) {
      throw new Error(
        "public/scrcpy-server.bin is missing. Run `npm install` to download it.",
      );
    }
    const server = new Uint8Array(await response.arrayBuffer());
    await AdbScrcpyClient.pushServer(
      adb,
      new ReadableStream({
        start(controller) {
          controller.enqueue(server);
          controller.close();
        },
      }),
    );

    const options = new AdbScrcpyOptionsLatest(
      {
        video: true,
        audio: false,
        control: true,
        maxSize: 1280,
        videoBitRate: 8_000_000,
        stayAwake: true,
      },
      { version: VERSION },
    );

    let client: AdbScrcpyClient<AdbScrcpyOptionsLatest<true>>;
    try {
      client = await AdbScrcpyClient.start(adb, DefaultServerPath, options);
    } catch (error) {
      if (error instanceof AdbScrcpyExitedError) {
        throw new Error(`scrcpy server exited:\n${error.output.join("\n")}`);
      }
      throw error;
    }

    // ADB multiplexes every stream over one USB pipe, so the server log must
    // be drained or the video stream stalls.
    void client.output
      .pipeTo(
        new WritableStream({
          write(line) {
            console.debug("[scrcpy]", line);
          },
        }),
      )
      .catch(() => {});

    const { metadata, stream } = await client.videoStream;
    const renderer = WebGLVideoFrameRenderer.isSupported
      ? new WebGLVideoFrameRenderer(canvas)
      : new BitmapVideoFrameRenderer(canvas);
    const decoder = new WebCodecsVideoDecoder({
      codec: metadata.codec,
      renderer,
    });
    // Rejects when the mirror is closed or the cable is pulled; nothing to do.
    void stream.pipeTo(decoder.writable).catch(() => {});

    return new ScreenMirror(client, decoder);
  }

  /**
   * Sends a touch event. `x` and `y` are 0–1 fractions of the mirrored
   * screen, so the caller doesn't need to know the phone's resolution.
   */
  async touch(
    phase: keyof typeof TOUCH_ACTIONS,
    x: number,
    y: number,
    pointerId: bigint,
  ) {
    const { width, height } = this.#decoder;
    if (!this.#client.controller || !width || !height) return;

    await this.#client.controller.injectTouch({
      action: TOUCH_ACTIONS[phase],
      pointerId,
      pointerX: clamp(x) * width,
      pointerY: clamp(y) * height,
      videoWidth: width,
      videoHeight: height,
      pressure: phase === "up" ? 0 : 1,
      actionButton: 0,
      buttons: 0,
    });
  }

  async pressKey(key: NavKey) {
    const controller = this.#client.controller;
    if (!controller) return;

    for (const action of [AndroidKeyEventAction.Down, AndroidKeyEventAction.Up]) {
      await controller.injectKeyCode({
        action,
        keyCode: NAV_KEY_CODES[key],
        repeat: 0,
        metaState: AndroidKeyEventMeta.None,
      });
    }
  }

  async close() {
    await this.#client.close();
    this.#decoder.dispose();
  }
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}
