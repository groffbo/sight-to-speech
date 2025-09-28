"use client";
import React, { useEffect, useState } from "react";
import { useTTS } from "./TTSprovider";

const Reader = ({ gesture }) => {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { speakText } = useTTS();

  // 1. Grab words from Flask /data endpoint
    useEffect(() => {
    fetch("http://localhost:5000/data")
        .then((res) => res.json())
        .then((data) => {
        console.log("Fetched data from backend:", data); // 👀 Debug

        const wordsArray = Array.isArray(data.words) ? data.words : data;
        console.log("Processed words array:", wordsArray); // 👀 Debug

        if (Array.isArray(wordsArray)) {
            setWords(wordsArray);
            setCurrentIndex(0);
            if (wordsArray.length > 0) speakText(wordsArray[0]);
        }
        })
        .catch((err) => console.error("Error fetching words:", err));
    }, []);


  // 4. Respond to gesture changes
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
    }

    if (gesture === "backward") {
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
    }

    if (gesture === "repeat") {
      speakText(words[currentIndex]);
    }
  }, [gesture]);

  return (
    <div style={{ textAlign: "center", marginTop: "12px" }}>
      <p>Current word: <strong>{words[currentIndex] || "—"}</strong></p>
    </div>
  );
};

export default Reader;
