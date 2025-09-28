"use client";
import React, { useEffect, useState } from "react";
import { useTTS } from "./TTSprovider";

const Reader = ({ gesture, command }) => {
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

        if (
          Array.isArray(data.words) &&
          JSON.stringify(data.words) !== JSON.stringify(words.slice(1))
        ) {
          const withBlank = ["", ...data.words]; // prepend blank
          setWords(withBlank);
          setCurrentIndex(0); // start at blank
          speakText(""); // say nothing for blank
        }
      } catch (err) {
        console.error("Failed to fetch words:", err);
      }
    };

    if (gesture === "Open_Palm") {
      fetchWords();
    }
  }, [gesture]);

  // -----------------------------
  // 2. Respond to navigation gestures
  // -----------------------------
  useEffect(() => {
    if (!gesture || words.length === 0) return;

    if (gesture === "Pointing_Up") {
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
    } else if (gesture === "Pointing_Left") {
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
    } else if (gesture === "O-Shape") {
      speakText(words[currentIndex]);
    }
  }, [gesture, words]);

  useEffect(() => {
     if (!command || words.length === 0) return;

    if (command === 'play') {
      console.log("Play words")
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
    } else if (command === 'back') {
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
    } else if (command = 'repeat') {
      speakText(words[currentIndex]);
    }

  }, [words, command])

  return (
    <div style={{ textAlign: "center", marginTop: "12px" }} className="text-black text-2xl">
      <p>
        Current word:{" "}
        <strong>{words[currentIndex] === "" ? "—" : words[currentIndex]}</strong>
      </p>
    </div>
  );
};

export default Reader;