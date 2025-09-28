"use client";

import GestureCamera from "./gestureCam";
import SpeechGestureToggle from "./components/SpeechGestureToggle";
import { useEffect, useState } from "react";
import SentenceWordToggle from "./components/SentenceWordToggle";

export default function Page() {
  const [useGestures, setUseGestures] = useState(true)

  return (
      <div className="min-h-screen animated-bg align-middle ">
        <h1 className="text-[#6fb7ff] font-extrabold xl:text-20xl lg:text-10xl md: text-7xl moirai-one-regular pt-15 pb-10 text-center">SightSpeech</h1>
        <main className="items-center justify-center z-1">
          <div className="flex m-20">
          {(useGestures) ? 
            <div className="mx-auto w-[45%] h-[40%] border-10 rounded-3xl m-5 items-center">
              <GestureCamera className="w-full h-full"/>
            </div>
          : <div/>}
            <div className="mx-auto w-[45%] h-[40%] border-10 rounded-3xl m-5 items-center">
              <GestureCamera className="w-full h-full"/>
            </div>
          </div>
          <SpeechGestureToggle className="absolute bottom-6 right-6 z-30 w-34 h-34" onClick={() => setUseGestures(!useGestures)} >
            <div className="mx-auto">{(useGestures) ? <img src="/gesture.png" className="h-26 w-26"/> : <img src="/speech.png" className="h-22 w-22"/>}</div>
          </SpeechGestureToggle>
          <SentenceWordToggle className={"absolute top-6 right-6"} onToggle={setUseGestures}/>
        </main>
      </div>
  )
}
