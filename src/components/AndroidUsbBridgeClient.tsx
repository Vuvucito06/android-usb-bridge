"use client";

import dynamic from "next/dynamic";

// WebUSB, WebCodecs and IndexedDB only exist in the browser, so skip prerendering.
const AndroidUsbBridge = dynamic(() => import("./AndroidUsbBridge"), {
  ssr: false,
});

export default AndroidUsbBridge;
