"use client";

import { createContext, useContext, useState } from "react";
import { useSpeech, useVoices } from "react-text-to-speech";

const TTSContext = createContext();

export function TTSProvider({ children }) {
  const { languages, voices } = useVoices();
  const [lang, setLang] = useState("en-US");
  const [voiceURI, setVoiceURI] = useState("Google US English");
  const [text, setText] = useState("");

  const { start } = useSpeech({ text, lang, voiceURI });

  // Function to update text AND speak immediately
  const speakText = (newText) => {
    setText(newText);
    start();
  };

  return (
    <TTSContext.Provider
      value={{
        speakText,
      }}
    >
      {children}
    </TTSContext.Provider>
  );
}

export function useTTS() {
  const ctx = useContext(TTSContext);
  if (!ctx) throw new Error("useTTS must be used inside TTSProvider");
  return ctx;
}
