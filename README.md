# SightSpeech / Sight-to-Speech

**A React app that reads words aloud from a camera feed, controlled by hand gestures from legally blind users.**  
Based on MediaPipe, OCR, and custom gesture detection, this tool empowers visually impaired users to access visual text in their environment.  

---

## 🧭 Table of Contents

- [Features](#✨Features)  
- [Architecture & Components](#architecture--components)  
- [Setup & Run](#setup--run)  
- [Gesture Mapping](#gesture-mapping)  
- [Usage](#usage)  
- [Limitations & Known Issues](#limitations--known-issues)  
- [Future Plans](#future-plans)  
- [Contributing](#contributing)  
- [License](#license)

---

## ✨ Features

- Real-time camera capture and processing  
- Hand gesture recognition (e.g. “point left”, “O”, open palm)  
- OCR (text recognition) on camera frames  
- Text-to-speech output to read recognized words aloud  
- Lightweight fallback and buffering to avoid flicker errors  

---

## 🏗 Architecture & Components

| Component | Responsibility |
|----------|-----------------|
| **Frontend (React / Next.js / “use client”)** | Captures video, draws landmarks, sends gestures |
| **Gesture Recognizer (MediaPipe Tasks–Vision)** | Detects hand landmarks & base gesture categories |
| **Custom Gesture Overrides** | Rules-based detection for “O”, “point left”, etc. |
| **Stable Gesture Buffering** | Avoids flicker by requiring consistent predictions |
| **Keypress Simulation** | Emits synthetic key events mapped to gestures |
| **Backend / OCR / TTS (Flask or similar)** | Processes camera frames, runs OCR, reads text aloud |

---

## 🛠️ Setup & Run

1. **Clone the repo**  
   ```bash
   git clone https://github.com/groffbo/sight-to-speech.git
   cd sight-to-speech
   ```
2. **Clone the repo**  
   ```bash
   python3 -m venv venv
   source venv/bin/activate   # On macOS/Linux
   venv\Scripts\activate      # On Windows PowerShell
   ```
3. **Clone the repo**  
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
4. **Clone the repo**  
   ```bash
   python3 app.py
   ```
5. **Clone the repo**  
   ```bash
   npm install
   npm run dev
   ```
   or `yarn dev` depending on your setup.
6. **Clone the repo**  
   Go to `http://localhost:3000` (or whatever port your frontend uses). Allow camera access.

---

## 🖐 Gesture Mapping (Default)

| Gesture         | Simulated Key | Description / Use |
| --------------- | ------------- | ----------------- |
| `Open_Palm`     | `c`           | (You logged “C”)  |
| `Closed_Fist`   | `s`           | (You logged “S”)  |
| `Pointing_Up`   | `n`           | (You logged “N”)  |
| `Pointing_Left` | `b`           | (You logged “B”)  |
| `O`             | `r`           | (You logged “R”)  |
| `Victory`       | `v`           | (You logged “V”)  |

You can adjust these mappings in the React `useEffect` that handles `stableGesture`.
