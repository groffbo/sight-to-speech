// import Image from "next/image";
import GestureCamera from "./gestureCam";

export default function Home() {
  return (
    <main style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Hand Gesture Recognition Demo</h1>
      <GestureCamera />
    </main>
  );
}