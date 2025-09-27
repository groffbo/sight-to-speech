"use client";

import { createContext, useContext, useState } from "react";
import { useSpeech, useVoices } from "react-text-to-speech";

const TTSContext = createContext();

export function TTSProvider({ children }) {
  const { languages, voices } = useVoices();
  const [lang, setLang] = useState("en-US");
  const [voiceURI, setVoiceURI] = useState("Google US English");
  const [text, setText] = useState("This library is awesome!");

  const { speechStatus, start, pause, stop } = useSpeech({
    text,
    lang,
    voiceURI,
  });

  return (
    <TTSContext.Provider
      value={{
        languages,
        voices,
        lang,
        setLang,
        voiceURI,
        setVoiceURI,
        text,
        setText,
        speechStatus,
        start,
        pause,
        stop,
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
