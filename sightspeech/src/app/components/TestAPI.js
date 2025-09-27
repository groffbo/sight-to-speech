"use client";
import { useState } from "react";

export default function TestAPI() {
  const [getData, setGetData] = useState(null);
  const [postData, setPostData] = useState(null);

  const handleGet = async () => {
    const res = await fetch("/api/gemini-data"); // gets proxied to Flask
    const data = await res.json();
    setGetData(data);
  };

  const handlePost = async () => {
    const formData = new FormData();
    const blob = new Blob(["dummy"], { type: "text/plain" });
    formData.append("image", blob, "dummy.txt");

    const res = await fetch("/api/process-frame", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setPostData(data);
};

  return (
    <div style={{ padding: "20px" }}>
      <h1>Minimal API Test</h1>
      <button onClick={handleGet}>Test GET</button>
      {getData && <pre>{JSON.stringify(getData, null, 2)}</pre>}
      <button onClick={handlePost} style={{ marginTop: "20px" }}>Test POST</button>
      {postData && <pre>{JSON.stringify(postData, null, 2)}</pre>}
    </div>
  );
}
