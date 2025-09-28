"use client";

import GestureCamera from "./gestureCam";
import SpeechGestureToggle from "./components/SpeechGestureToggle";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
const SpeechController = dynamic(() => import("./components/SpeechController"), {
  ssr: false
});


export default function Page() {
  const [useGestures, setUseGestures] = useState(true)
  const [textRead, setTextRead] = useState("This is dummy data")
  const speechRef = useRef(null);
  const [latestFinal, setLatestFinal] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // When the "useGestures" flag flips, ask controller to start/stop (imperative)
  useEffect(() => {
    if (!speechRef.current) return;
    // original behavior: start recording when NOT using gestures
    if (!useGestures) {
      console.log("Starting Recording!");
      setIsRecording(true)
      speechRef.current.start();
    } else {
      console.log("Stopping Recording");
      setIsRecording(false)
      speechRef.current.stop();
    }
  }, [useGestures]);

  const handleResult = ({ lastWord, lastTranscript }) => {
    setLatestFinal(lastWord);
  };

  const handleStateChange = (recording) => {
    setIsRecording(!!recording);
  };

  return (
      <div className="min-h-screen flex flex-col animated-bg">
        <h1 className="text-black font-extrabold xl:text-3xl lg:text-2xl md: text-xl">SightSense</h1>
        
        {/* Render speech controller (dynamically loaded) */}
        <SpeechController ref={speechRef} onResult={handleResult} onStateChange={handleStateChange} />

        
        <div className="flex flex-shrink-0 text-black">
          <p>Last word: {latestFinal || "—"}</p>
        </div>
      <main className="flex-1 flex flex-wrap items-center justify-center">
        <div className="w-[80%] h-[80%] max-w-5xl border-6 border-black-700 m-5">
          <GestureCamera/>
        </div>
        <SpeechGestureToggle onClick={() => setUseGestures(!useGestures)} className="flex flex-shrink-0">
          <div className="text-3xl">{(useGestures) ? "🗣️" : "👋" }</div>
        </SpeechGestureToggle>
      </main>
      </div>
    
  )
}
