"use client";
import React, { useEffect, useState } from "react";
import { useTTS } from "./TTSprovider";
import SentenceWordToggle from "./SentenceWordToggle";

const Reader = ({ gesture }) => {
  const [useSentences, setUseSentences] = useState(false); // "words" | "sentences"
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { speakText } = useTTS();

  useEffect(() => {
    if (!gesture) return;

    const fetchItems = async () => {
  try {
    const endpoint =
      !useSentences
        ? "http://localhost:5000/data/words"
        : "http://localhost:5000/data/sentences";

    const res = await fetch(endpoint);
    const data = await res.json();

    if (Array.isArray(data.words)) {
      const withBlank = ["", ...data.words, ""];

      // try to preserve position
      const oldItem = items[currentIndex];
      let newIndex = 0;
      if (oldItem) {
        const foundIdx = withBlank.indexOf(oldItem);
        if (foundIdx !== -1) {
          newIndex = foundIdx;
        }
      }

      setItems(withBlank);
      setCurrentIndex(newIndex);
      speakText(withBlank[newIndex] || "");
    }
  } catch (err) {
    console.error("Failed to fetch items:", err);
  }
};

    if (gesture === "Open_Palm") {
      fetchItems();
    }
  }, [gesture, useSentences, speakText]);

  // Navigation gestures (same as before)...
  useEffect(() => {
    if (!gesture || items.length === 0) return;

    if (gesture === "Pointing_Up") {
      setCurrentIndex((prev) => {
        if (prev < items.length - 1) {
          const newIndex = prev + 1;
          speakText(items[newIndex]);
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
          speakText(items[newIndex]);
          return newIndex;
        } else {
          speakText("Beginning of text");
          return prev;
        }
      });
    } else if (gesture === "O-Shape") {
      speakText(items[currentIndex]);
    }
  }, [gesture, items, speakText]);

  return (
    <div style={{ textAlign: "center", marginTop: "12px", position: "absolute" }} className="text-black">
      <SentenceWordToggle onToggle={setUseSentences} />
      <p>
        Current:{" "}
        <strong>{items[currentIndex] === "" ? "—" : items[currentIndex]}</strong>
      </p>
    </div>
  );
};

export default Reader;