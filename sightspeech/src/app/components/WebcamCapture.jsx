// components/WebcamSnapshot.jsx
"use client";

import React, { useRef, useState, useEffect } from "react";

export default function WebcamSnapshot( captureInterval ) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const [imgData, setImgData] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch (err) {
        console.error("Camera error:", err);
      }
    }
    startCamera();

    return () => {
      mounted = false;
      const stream = videoRef.current?.srcObject;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => captureFrame(), captureInterval * 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);

    // Get a Base64 PNG data URL of the captured frame
    const dataUrl = canvas.toDataURL("image/png");
    setImgData(dataUrl);
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: 320, height: 240, background: "#000", borderRadius: 6 }}
        />
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* {imgData && (
        <div style={{ marginTop: 12 }}>
          <strong>Captured frame</strong>
          <div style={{ marginTop: 8 }}>
            <img src={imgData} alt="Captured" style={{ maxWidth: "100%", borderRadius: 6 }} />
          </div>
        </div>
      )} */}
    </div>
  );
}