"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef
} from "react";
import useSpeechToText from "react-hook-speech-to-text";

/**
 * SpeechController (no UI)
 * - wraps react-hook-speech-to-text
 * - exposes start/stop/toggle/getLatest via ref
 * - calls callbacks when results or recording state change
 *
 * Parent should dynamically import this with ssr:false (done in Page below)
 */

const SpeechController = forwardRef(({ onResult, onStateChange }, ref) => {
  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false
  });

  // inform parent about recording state changes
  useEffect(() => {
    onStateChange?.(isRecording);
  }, [isRecording, onStateChange]);

  // when results update, extract last word and call parent callback
  useEffect(() => {
    if (!results || results.length === 0) return;
    const lastTranscript = results[results.length - 1] || "";
    const words = lastTranscript.transcript.trim().split(/\s+/);
    const lastWord = words.length ? words[words.length - 1] : "";
    onResult?.({ lastWord, lastTranscript });
  }, [results, onResult]);

  // expose imperative API
  useImperativeHandle(
    ref,
    () => ({
      start: () => startSpeechToText(),
      stop: () => stopSpeechToText(),
      toggle: () => {
        if (isRecording) stopSpeechToText();
        else startSpeechToText();
      },
      getLatest: () => {
        const lastTranscript = results && results.length ? results[results.length - 1] : "";
        const words = (lastTranscript || "").trim().split(/\s+/);
        return words.length ? words[words.length - 1] : "";
      },
      isRecording: () => !!isRecording
    }),
    // include dependencies used inside the returned object
    [isRecording, results, startSpeechToText, stopSpeechToText]
  );

  // this component renders nothing visible; it's a controller
  return null;
});

export default SpeechController;
