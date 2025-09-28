"use client";

import GestureCamera from "./gestureCam";
import SpeechGestureToggle from "./components/SpeechGestureToggle";
import { useEffect, useState } from "react";
import { useSTT } from "./components/STTprovider";

export default function Page() {
  const [useGestures, setUseGestures] = useState(true)
  const [textRead, setTextRead] = useState("This is dummy data")
  const [command, setCommand] = useState("")
  const { getLastCommand, startSpeechToText, stopSpeechToText, results } = useSTT()
  
  // useEffect(() => {
  //   if (!useGestures && window) {
  //     startSpeechToText()
  //   } else {
  //     stopSpeechToText()
  //   }
  // }, [useGestures, window])

  // useEffect(() => {
  //   setCommand(getLastCommand())
  // }, [results])

  return (
      <div className="min-h-screen flex flex-col animated-bg">
        <h1 className="text-black font-extrabold xl:text-3xl lg:text-2xl md: text-xl">SightSense</h1>
        <div className="flex flex-shrink-0 text-black">
          <p>{textRead}</p>
          <p>Command: {command}</p>
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
