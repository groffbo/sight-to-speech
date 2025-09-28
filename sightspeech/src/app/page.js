"use client";

import GestureCamera from "./gestureCam";
import SpeechGestureToggle from "./components/SpeechGestureToggle";
import { useEffect, useState } from "react";

export default function Page() {
  const [useGestures, setUseGestures] = useState(true)

  return (
      <div className="min-h-screen animated-bg align-middle ">
        <h1 className="text-[#6fb7ff] font-extrabold xl:text-20xl lg:text-10xl md: text-7xl moirai-one-regular pt-15 pb-5 text-center">SightSpeech</h1>
        <main className="items-center justify-center z-1">
          <div className="mx-auto w-[80%] h-[80%] max-w-5xl border-8 m-5 items-center">
            <GestureCamera className="w-full h-full"/>
          </div>
          <SpeechGestureToggle className="absolute bottom-6 right-6 z-30 w-24 h-24" onClick={() => setUseGestures(!useGestures)} >
            <div className="mx-auto">{(useGestures) ? <img src="/speech.png" className="h-14 w-14"/> : <img src="/gesture.png" className="h-18 w-18"/>}</div>
          </SpeechGestureToggle>
        </main>
      </div>
  )
}
