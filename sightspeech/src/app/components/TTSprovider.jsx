"use client";

import { createContext, useContext, useEffect, useState } from "react";

const TTSContext = createContext();

export function TTSProvider({ children }) {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Pick a nice-sounding default (Google voices are usually better)
      const googleVoice = availableVoices.find(v =>
        v.name.includes("Google US English")
      );
      setSelectedVoice(googleVoice || availableVoices[0] || null);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speakText = (newText) => {
    if (!newText) return;
    const utterance = new SpeechSynthesisUtterance(newText);
    utterance.lang = "en-US";
    if (selectedVoice) utterance.voice = selectedVoice;

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };

  return (
    <TTSContext.Provider value={{ speakText, voices, setSelectedVoice }}>
      {children}
    </TTSContext.Provider>
  );
}

export function useTTS() {
  const ctx = useContext(TTSContext);
  if (!ctx) throw new Error("useTTS must be used inside TTSProvider");
  return ctx;
}
