"use client";
import React, { useRef, useEffect, useState } from 'react';
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';

// --- DRAWING UTILITIES START ---
// Define the connections for the hand landmarks (from MediaPipe documentation)
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [0, 9], [9, 10], [10, 11], [11, 12], // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
];

// Helper to draw lines between connected landmarks
const drawConnectors = (ctx, landmarks, connections) => {
    ctx.strokeStyle = '#000000'; // Cyan color for connections
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
    ctx.fillStyle = '#FFFFFF';
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

const GestureCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gestureRecognizer, setGestureRecognizer] = useState(null);
  const [lastVideoTime, setLastVideoTime] = useState(-1);

  // Initialize GestureRecognizer Model
  useEffect(() => {
    const initializeModel = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task`,
          delegate: "GPU" 
        },
        runningMode: 'VIDEO',
        numHands: 1
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
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      const { videoWidth, videoHeight } = video;
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      
      // Only perform recognition if the video is ready and not at the same time stamp
      if (video.currentTime !== lastVideoTime) {
        setLastVideoTime(video.currentTime);

        
        // Run Recognition
        // const results = gestureRecognizer.recognizeForVideo(video, performance.now());
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = video.videoWidth;
        offscreenCanvas.height = video.videoHeight;
        const offscreenCtx = offscreenCanvas.getContext('2d');

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
            
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS);
            drawLandmarks(ctx, landmarks);
            
            // Display the recognized gesture label
            const gesture = results.gestures[index][0]?.categoryName || 'No Gesture';
            const handedness = results.handednesses[index][0]?.categoryName || 'Unknown';

            ctx.font = '24px Roboto';
            ctx.fillStyle = 'magenta';
            ctx.fillText(
                `${handedness}: ${gesture} : ${index}`,
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
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [gestureRecognizer]);


  return (
    <div style={{ position: 'relative', width: '640px', height: '480px', margin: 'auto' }}>
      {/* Video element will be the base layer */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', transform: 'scaleX(-1)' }} // Flipped for mirror effect
      />
      {/* Canvas element will overlay the video for drawing */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} // Flipped to match video
      />
      
      {!gestureRecognizer && <p style={{ position: 'absolute', top: '50%', left: 0, width: '100%', textAlign: 'center', color: 'white', background: 'rgba(0,0,0,0.5)' }}>Loading Hand Gesture Model...</p>}
      
    </div>
  );
};

export default GestureCamera;