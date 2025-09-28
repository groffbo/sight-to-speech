"use client";
import React, { useEffect, useState } from "react";
import { useTTS } from "./TTSprovider";

const Reader = ({ gesture }) => {
  const [mode, setMode] = useState("words"); // "words" | "sentences"
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { speakText } = useTTS();

  useEffect(() => {
    if (!gesture) return;

    const fetchItems = async () => {
      try {
        const endpoint =
          mode === "words"
            ? "http://localhost:5000/data/words"
            : "http://localhost:5000/data/sentences";

        const res = await fetch(endpoint);
        const data = await res.json();

        if (Array.isArray(data.words)) {
          const withBlank = ["", ...data.words];
          setItems(withBlank);
          setCurrentIndex(0);
          speakText("");
        }
      } catch (err) {
        console.error("Failed to fetch items:", err);
      }
    };

    if (gesture === "Open_Palm") {
      fetchItems();
    }
  }, [gesture, mode, speakText]);

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
    <div style={{ textAlign: "center", marginTop: "12px" }}>
      <div style={{ marginBottom: "8px" }}>
        <button onClick={() => setMode("words")} disabled={mode === "words"}>
          Words
        </button>
        <button onClick={() => setMode("sentences")} disabled={mode === "sentences"}>
          Sentences
        </button>
      </div>

      <p>
        Current:{" "}
        <strong>{items[currentIndex] === "" ? "—" : items[currentIndex]}</strong>
      </p>
    </div>
  );
};

export default Reader;
