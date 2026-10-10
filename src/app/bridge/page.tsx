import type { Metadata } from "next";

import AndroidUsbBridge from "@/components/AndroidUsbBridgeClient";

export const metadata: Metadata = {
  title: "Android USB Bridge",
};

export default function BridgePage() {
  return <AndroidUsbBridge />;
}
