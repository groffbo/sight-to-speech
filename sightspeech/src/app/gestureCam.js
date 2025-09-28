"use client";
import React, { useRef, useEffect, useState } from "react";
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";
import Reader from "./components/Reader";

// Distance between two landmarks
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Check if finger is extended (tip farther from palm than base joint)
const isFingerExtended = (landmarks, tipIndex, baseIndex = 0) => {
  return distance(landmarks[tipIndex], landmarks[0]) > distance(landmarks[baseIndex], landmarks[0]);
};

const FLASK_API_URL = "http://localhost:5000/data";

function sendCommand(commandKey) {
  fetch(FLASK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: commandKey,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Command sent successfully. Server response:", data);
    })
    .catch((error) => {
      console.error("Error connecting to Flask API:", error);
    });
}

// Example: Call this function when the user presses a button
// sendCommand('c');

const isOGesture = (landmarks) => {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const palmBase = landmarks[0];
  
    const palmSize = distance(palmBase, landmarks[9]); // rough scale
    const thumbIndexDist = distance(thumbTip, indexTip);
    const thumbPalmDist = distance(thumbTip, landmarks[9]) * 0.75
  
    return thumbIndexDist < palmSize * 0.3 && thumbPalmDist > palmSize * 0.39 && thumbPalmDist < palmSize * 0.52; // tuned threshold to reduce error
  };

const isPointingLeft = (landmarks) => {
  const indexTip = landmarks[8];
  const indexBase = landmarks[5];

  // 1. Index finger extended
  const indexExtended = isFingerExtended(landmarks, 8, 5);

  // 2. Other fingers curled
  const middleFolded = !isFingerExtended(landmarks, 12, 9);
  const ringFolded = !isFingerExtended(landmarks, 16, 13);
  const pinkyFolded = !isFingerExtended(landmarks, 20, 17);

  // 3. Index points left (tip.x significantly < base.x)
  const pointingLeft = indexTip.x + 0.05 < indexBase.x;

  return indexExtended && middleFolded && ringFolded && pinkyFolded && pointingLeft;
};

const sendKeyPress = (key) => {
  const event = new KeyboardEvent("keydown", {
    key,
    code: key,
    keyCode: key.charCodeAt(0),
    bubbles: true,
  });
  document.dispatchEvent(event);
};

const sendKeyRelease = (key) => {
  const event = new KeyboardEvent("keyup", {
    key,
    code: key,
    keyCode: key.charCodeAt(0),
    bubbles: true,
  });
  document.dispatchEvent(event);
};

// --- DRAWING UTILITIES START ---
// Define the connections for the hand landmarks (from MediaPipe documentation)
const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // Thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // Index
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12], // Middle
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16], // Ring
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20], // Pinky
];

// Helper to draw lines between connected landmarks
const drawConnectors = (ctx, landmarks, connections) => {
  ctx.strokeStyle = "#b1e2fc";
  ctx.lineWidth = 4;
  for (const connection of connections) {
    const start = landmarks[connection[0]];
    const end = landmarks[connection[1]];

    ctx.beginPath();
    // Landmarks are normalized (0.0 to 1.0), so we multiply by canvas dimensions
    ctx.moveTo(start.x * ctx.canvas.width, start.y * ctx.canvas.height);
    ctx.lineTo(end.x * ctx.canvas.width, end.y * ctx.canvas.height);
    ctx.stroke();
  }
};

// Helper to draw circles for each landmark point
const drawLandmarks = (ctx, landmarks) => {
  ctx.fillStyle = "#FFFFFF";
  for (const landmark of landmarks) {
    ctx.beginPath();
    // Landmarks are normalized (0.0 to 1.0)
    ctx.arc(
      landmark.x * ctx.canvas.width,
      landmark.y * ctx.canvas.height,
      5, // Radius of the landmark point
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
};
// --- DRAWING UTILITIES END ---

const GestureCamera = ({ speechCommand }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gestureRecognizer, setGestureRecognizer] = useState(null);
  const [lastVideoTime, setLastVideoTime] = useState(-1);

  // gesture buffer state
  const [stableGesture, setStableGesture] = useState("No Gesture");
  const gestureBuffer = useRef([]);
  const BUFFER_SIZE = 100;

  // Initialize GestureRecognizer Model
  useEffect(() => {
    const initializeModel = async () => {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");

      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task`,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });
      setGestureRecognizer(recognizer);
    };
    initializeModel();
  }, []);

  // Start Camera and Recognition Loop
  useEffect(() => {
    if (!gestureRecognizer) return;

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera API not supported.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          videoRef.current.play();
          requestAnimationFrame(predictAndDrawLoop);
        };
      } catch (err) {
        console.error("Error accessing camera: ", err);
      }
    };

    const predictAndDrawLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set canvas dimensions to match video
      const { videoWidth, videoHeight } = video;
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Only perform recognition if the video is ready and not at the same time stamp
      if (video.currentTime !== lastVideoTime) {
        setLastVideoTime(video.currentTime);

        // Run Recognition
        // const results = gestureRecognizer.recognizeForVideo(video, performance.now());
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = video.videoWidth;
        offscreenCanvas.height = video.videoHeight;
        const offscreenCtx = offscreenCanvas.getContext("2d");

        // Mirror the video frame
        offscreenCtx.save();
        offscreenCtx.scale(-1, 1);
        offscreenCtx.drawImage(video, -video.videoWidth, 0, video.videoWidth, video.videoHeight);
        offscreenCtx.restore();

        // Run recognition on the mirrored frame
        const results = gestureRecognizer.recognizeForVideo(offscreenCanvas, performance.now());

        ctx.transform(-1, 0, 0, 1, canvas.width, 0);

        // Draw Results on Canvas
        ctx.clearRect(0, 0, videoWidth, videoHeight);

        if (results.landmarks.length > 0) {
          results.landmarks.forEach((landmarks, index) => {
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, "#000000");
            drawLandmarks(ctx, landmarks);

            // Display the recognized gesture label
            let detectedGesture = results.gestures[index][0]?.categoryName || "No Gesture";
            // const gesture = results.gestures[index][0]?.categoryName || 'No Gesture';
            const handedness = results.handednesses[index][0]?.categoryName || "Unknown";

            if (isOGesture(landmarks)) detectedGesture = "O_Shape";
            else if (isPointingLeft(landmarks)) detectedGesture = "Pointing_Left";

            // update gesture buffer
            gestureBuffer.current.push(detectedGesture);
            if (gestureBuffer.current.length > BUFFER_SIZE) {
              gestureBuffer.current.shift();
            }
            const allSame = gestureBuffer.current.every((g) => g === detectedGesture);
            if (allSame && detectedGesture !== stableGesture) {
              setStableGesture(detectedGesture);
            }

            ctx.font = "24px Roboto";
            ctx.fillStyle = "black";
            ctx.fillText(
              `${handedness}: ${detectedGesture}`,
              50,
              50 + index * 40 // Offset based on hand index
            );
          });
        }
      }

      // Continue the loop
      requestAnimationFrame(predictAndDrawLoop);
    };

    startCamera();

    // 5. Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [gestureRecognizer]);

  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (stableGesture === "No Gesture") return;
  
    let key;
    switch (stableGesture) {
      case "Open_Palm": // start
        key = "c";
        break;
      case "Closed_Fist": // stop
        key = "v";
        break;
      case "Victory": // capture current words
        key = "s";
        break;
      case "Pointing_Up": // forward
        key = "n";
        break;
      case "Pointing_Left": // backward
        key = "p";
        break;
      case "O_Shape":
        key = "o";
        break;
      default:
        key = null;
    }
  
    if (!key) return;
  
    // repeating gestures (15s pulse)
    if (["Pointing_Up"].includes(stableGesture)) {
      // call once immediately
      sendCommand(key);
      console.log("Hitting the letter", key);
  
      // then repeat every 15s
      const interval = setInterval(() => {
        sendCommand(key);
        console.log("Hitting the letter", key);
      }, 1500); // 15s interval
  
      return () => clearInterval(interval);
    }
    // one-shot gestures
    else if (["Open_Palm", "Closed_Fist", "Victory"].includes(stableGesture)) {
      sendCommand(key);
      console.log("Hitting the letter", key);
  
      setBlink(true);
      setTimeout(() => setBlink(false), 300);
    }
    else {
      sendCommand(key);
    }
  }, [stableGesture]);
  
  

  return (
    <div
    className={`relative w-full h-full mx-auto rounded-xl 
      ${blink ? "ring-blink" : ""}
    `}>
    {/* Video base layer */}
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full transform scale-x-[-1] rounded-xl"
    />
  
    {/* Canvas overlay */}
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none transform scale-x-[-1] rounded-xl"
    />
  
      <Reader gesture={stableGesture} command={speechCommand}/>

    {!gestureRecognizer && (
      <p className="absolute left-0 top-1/2 w-full -translate-y-1/2 text-center text-white bg-black/50 py-2">
        Loading Hand Gesture Model...
      </p>
    )}
  </div>
  );
};

export default GestureCamera;
