"use client";
import React, { useEffect, useState } from "react";
import { useTTS } from "./TTSprovider";

const Reader = ({ gesture }) => {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { speakText } = useTTS();

  // -----------------------------
  // 1. Fetch words when open palm gesture is detected
  // -----------------------------
  useEffect(() => {
    if (!gesture) return;

    const fetchWords = async () => {
      try {
        const res = await fetch("http://localhost:5000/data");
        const data = await res.json();

        if (Array.isArray(data.words) && JSON.stringify(data.words) !== JSON.stringify(words)) {
          setWords(data.words);
          setCurrentIndex(0);        // reset to first word
          if (data.words.length > 0) speakText(data.words[0]);
        }
      } catch (err) {
        console.error("Failed to fetch words:", err);
      }
    };

    if (gesture === "Open_Palm") {
      fetchWords();
    }
  }, [gesture]); // triggers only when gesture changes

  // -----------------------------
  // 2. Respond to navigation gestures
  // -----------------------------
  useEffect(() => {
    if (!gesture || words.length === 0) return;

    if (gesture === "forward") {
      setCurrentIndex((prev) => {
        if (prev < words.length - 1) {
          const newIndex = prev + 1;
          speakText(words[newIndex]);
          return newIndex;
        } else {
          speakText("End of text");
          return prev;
        }
      });
    } else if (gesture === "backward") {
      setCurrentIndex((prev) => {
        if (prev > 0) {
          const newIndex = prev - 1;
          speakText(words[newIndex]);
          return newIndex;
        } else {
          speakText("Beginning of text");
          return prev;
        }
      });
    } else if (gesture === "repeat") {
      speakText(words[currentIndex]);
    }
  }, [gesture, words]);

  return (
    <div style={{ textAlign: "center", marginTop: "12px" }}>
      <p>Current word: <strong>{words[currentIndex] || "—"}</strong></p>
    </div>
  );
};

export default Reader;
