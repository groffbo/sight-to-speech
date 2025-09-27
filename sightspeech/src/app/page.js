// import Image from "next/image";
import GestureCamera from "./gestureCam";
import TestAPI from "./components/TestAPI";

export default function Page() {
  return (
    <main style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Hand Gesture Recognition Demo</h1>
      <GestureCamera />
      <TestAPI />
    </main>
  );
}