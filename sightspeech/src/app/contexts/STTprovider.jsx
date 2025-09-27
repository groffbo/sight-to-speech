"use client";

import { createContext, useContext } from "react";
import useSpeechToText from "react-hook-speech-to-text";
// import dynamic from "next/dynamic";

// const useSpeechToText = dynamic(
//   () => import("react-hook-speech-to-text").then(mod => mod.default),
//   { ssr: false }
// );

const STTContext = createContext();

export function STTProvider({ children }) {
  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false
  });

  return (
    <STTContext.Provider
      value={{
        results,
        error,
        interimResult,
        isRecording,
        startSpeechToText,
        stopSpeechToText
      }}
    >
      {children}
    </STTContext.Provider>
  );
}

export function useSTT() {
  const ctx = useContext(STTContext);
  if (!ctx) throw new Error("useSTT must be used inside STTProvider");
  return ctx;
}
