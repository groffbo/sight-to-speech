"use client";

import GestureCamera from "./gestureCam";
import { TTSProvider } from "./components/TTSprovider";

export default function Page() {
  return (
    <TTSProvider>
      <main style={{ padding: "20px" }}>
        <h1>Simple Backend TTS Demo</h1>
        <GestureCamera />
      </main>
    </TTSProvider>
  );
}
