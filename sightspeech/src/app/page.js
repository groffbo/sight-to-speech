"use client";

import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, Video, Loader2, Disc3 } from "lucide-react";
import { useTTS } from "./components/TTSprovider"; // ✅ bring in your TTS context

// --- HOOKS ---
const useCamera = (videoRef, setError, setIsCameraActive) => {
  React.useEffect(() => {
    const startCamera = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      } catch (err) {
        setError("Camera access denied or failed. Please ensure permissions are granted.");
      }
    };

    startCamera();
    return () => {
      videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    };
  }, [videoRef, setError, setIsCameraActive]);
};

// --- COMPONENTS ---
const CameraView = ({ videoRef, isCameraActive }) => (
  <div className="relative w-full md:w-1/2 bg-gray-800 rounded-xl overflow-hidden shadow-inner aspect-video">
    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
    {!isCameraActive && (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white">
        <Video className="w-10 h-10 mb-2" />
        <p className="text-sm">Initializing camera...</p>
      </div>
    )}
  </div>
);

const ReaderControls = ({ chunks, currentIndex, isLoading, sendFrameToGemini, handleNavigation, isCameraActive, error }) => (
  <div className="w-full md:w-1/2 flex flex-col space-y-4">
    <button
      onClick={sendFrameToGemini}
      disabled={isLoading || !isCameraActive}
      className={`flex items-center justify-center px-6 py-3 font-semibold rounded-xl transition duration-300 transform 
        ${isLoading ? "bg-indigo-300" : "bg-indigo-600 hover:bg-indigo-700"} text-white`}
    >
      {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Disc3 className="w-5 h-5 mr-2" />}
      {isLoading ? "Scanning..." : "Scan Frame for Text"}
    </button>

    {error && <div className="p-3 bg-red-100 text-red-700 rounded-xl">{error}</div>}

    {chunks.length > 0 && (
      <div className="mt-4 border-t pt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Volume2 className="w-5 h-5 mr-2 text-indigo-600" />
          Reading Text ({currentIndex + 1} / {chunks.length})
        </h2>
        <div className="min-h-24 p-5 bg-indigo-50 border-2 border-indigo-200 rounded-xl shadow-inner mb-6 flex items-center justify-center">
          <p className="text-xl text-gray-800 font-medium text-center">{chunks[currentIndex]}</p>
        </div>
        <div className="flex justify-center space-x-4">
          <button onClick={() => handleNavigation("prev")} className="px-4 py-2 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center">
            <ChevronLeft className="w-5 h-5 mr-1" /> Previous
          </button>
          <button onClick={() => handleNavigation("next")} className="px-4 py-2 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center">
            Next <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    )}
  </div>
);

// --- MAIN APP ---
const App = () => {
  const videoRef = useRef(null);
  const [chunks, setChunks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const { speakText } = useTTS(); // ✅ use your TTS provider

  useCamera(videoRef, setError, setIsCameraActive);

  // Gemini OCR
  const sendFrameToGemini = async () => {
    if (!videoRef.current || isLoading) return;
    setIsLoading(true);
    setError(null);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Data = canvas.toDataURL("image/jpeg").split(",")[1];
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`;
    const payload = {
      contents: [{ role: "user", parts: [{ text: "Extract text as JSON array." }, { inlineData: { mimeType: "image/jpeg", data: base64Data } }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: { type: "ARRAY", items: { type: "STRING" } } },
    };

    try {
      const res = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      const parsed = JSON.parse(json.candidates?.[0]?.content?.parts?.[0]?.text || "[]");
      if (parsed.length > 0) {
        setChunks(parsed);
        setCurrentIndex(0);
        speakText(parsed[0]); // ✅ speak immediately
      } else {
        setError("No readable text found.");
      }
    } catch (err) {
      setError(`Error scanning frame: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation
  const handleNavigation = (dir) => {
    if (chunks.length === 0) return;
    setCurrentIndex((prev) => {
      const nextIndex = dir === "next" ? (prev + 1) % chunks.length : (prev - 1 + chunks.length) % chunks.length;
      speakText(chunks[nextIndex]); // ✅ speak when navigating
      return nextIndex;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <h1 className="text-3xl font-extrabold text-indigo-700 mt-4 mb-6">Gemini Vision Reader</h1>
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <CameraView videoRef={videoRef} isCameraActive={isCameraActive} />
          <ReaderControls chunks={chunks} currentIndex={currentIndex} isLoading={isLoading} sendFrameToGemini={sendFrameToGemini} handleNavigation={handleNavigation} isCameraActive={isCameraActive} error={error} />
        </div>
      </div>
    </div>
  );
};

export default App;
