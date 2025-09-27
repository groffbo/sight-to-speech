"use client";

import { useTTS } from "./TTSprovider";

export default function ReadBackend() {
  const { speakText } = useTTS();

  const fetchAndSpeak = async () => {
    try {
      const res = await fetch("api/get-text-to-read");
      const data = await res.json();
      if (data.text) {
        speakText(data.text); // immediately read the string
      }
    } catch (err) {
      console.error("Failed to fetch text:", err);
    }
  };

  return (
    <div>
      <button onClick={fetchAndSpeak}>Read Text from Backend</button>
    </div>
  );
}
