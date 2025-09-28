"use client";

import React, { useRef, useState, useEffect } from "react";
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";

// --- UTILS ---

// Distance between two landmarks
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Check if finger is extended
const isFingerExtended = (landmarks, tipIndex, baseIndex = 0) =>
  distance(landmarks[tipIndex], landmarks[0]) > distance(landmarks[baseIndex], landmarks[0]);

// Custom gesture checks
const isOGesture = (landmarks) => {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const palmSize = distance(landmarks[0], landmarks[9]);
  return distance(thumbTip, indexTip) < palmSize * 0.3;
};

const isPointingLeft = (landmarks) => {
  const indexTip = landmarks[8];
  const indexBase = landmarks[5];
  const indexExtended = isFingerExtended(landmarks, 8, 5);
  const middleFolded = !isFingerExtended(landmarks, 12, 9);
  const ringFolded = !isFingerExtended(landmarks, 16, 13);
  const pinkyFolded = !isFingerExtended(landmarks, 20, 17);
  const pointingLeft = indexTip.x + 0.05 < indexBase.x;
  return indexExtended && middleFolded && ringFolded && pinkyFolded && pointingLeft;
};

// Hand connections for drawing
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20]
];

// Drawing helpers
const drawConnectors = (ctx, landmarks, connections) => {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 4;
  connections.forEach(([startIdx, endIdx]) => {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];
    ctx.beginPath();
    ctx.moveTo(start.x * ctx.canvas.width, start.y * ctx.canvas.height);
    ctx.lineTo(end.x * ctx.canvas.width, end.y * ctx.canvas.height);
    ctx.stroke();
  });
};

const drawLandmarks = (ctx, landmarks) => {
  ctx.fillStyle = "#fff";
  landmarks.forEach((lm) => {
    ctx.beginPath();
    ctx.arc(lm.x * ctx.canvas.width, lm.y * ctx.canvas.height, 5, 0, 2 * Math.PI);
    ctx.fill();
  });
};

// --- COMPONENT ---

const GestureCamera = ({ videoRef: externalVideoRef, onGesture }) => {
  const internalVideoRef = useRef(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const canvasRef = useRef(null);

  const [gestureRecognizer, setGestureRecognizer] = useState(null);
  const [lastVideoTime, setLastVideoTime] = useState(-1);
  const [stableGesture, setStableGesture] = useState("No Gesture");
  const gestureBuffer = useRef([]);
  const BUFFER_SIZE = 20;

  // Initialize model
  useEffect(() => {
    const initModel = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });
      setGestureRecognizer(recognizer);
    };
    initModel();
  }, []);

  // Camera & recognition loop
  useEffect(() => {
    if (!gestureRecognizer) return;

    const startCamera = async () => {
      if (!videoRef.current.srcObject) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        } catch (err) {
          console.error("Camera error:", err);
        }
      }
      requestAnimationFrame(loop);
    };

    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!video || video.readyState < 2) {
        requestAnimationFrame(loop);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (video.currentTime !== lastVideoTime) {
        setLastVideoTime(video.currentTime);

        const offCanvas = document.createElement("canvas");
        offCanvas.width = video.videoWidth;
        offCanvas.height = video.videoHeight;
        const offCtx = offCanvas.getContext("2d");
        offCtx.save();
        offCtx.scale(-1, 1);
        offCtx.drawImage(video, -video.videoWidth, 0, video.videoWidth, video.videoHeight);
        offCtx.restore();

        const results = gestureRecognizer.recognizeForVideo(offCanvas, performance.now());

        ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.landmarks.length > 0) {
          results.landmarks.forEach((landmarks, index) => {
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS);
            drawLandmarks(ctx, landmarks);

            let detectedGesture = results.gestures[index][0]?.categoryName || "No Gesture";
            if (isOGesture(landmarks)) detectedGesture = "O";
            else if (isPointingLeft(landmarks)) detectedGesture = "Pointing_Left";

            // Buffer & stable detection
            gestureBuffer.current.push(detectedGesture);
            if (gestureBuffer.current.length > BUFFER_SIZE) gestureBuffer.current.shift();

            if (
              gestureBuffer.current.every((g) => g === detectedGesture) &&
              detectedGesture !== stableGesture
            ) {
              setStableGesture(detectedGesture);
              if (onGesture) onGesture(detectedGesture);
            }

            ctx.font = "24px Roboto";
            ctx.fillStyle = "black";
            ctx.fillText(`${detectedGesture}`, 50, 50 + index * 40);
          });
        }
      }

      requestAnimationFrame(loop);
    };

    startCamera();

    return () => {
      if (!externalVideoRef && videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [gestureRecognizer]);

  return (
    <div style={{ position: "relative", width: "640px", height: "480px", margin: "auto" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", height: "100%", transform: "scaleX(-1)" }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          transform: "scaleX(-1)",
        }}
      />
      {!gestureRecognizer && (
        <p
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            width: "100%",
            textAlign: "center",
            color: "white",
            background: "rgba(0,0,0,0.5)",
          }}
        >
          Loading Model...
        </p>
      )}
    </div>
  );
};

export default GestureCamera;
