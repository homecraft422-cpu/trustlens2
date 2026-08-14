"use client";

import { useState, useRef } from "react";

export default function TestUpload() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload() {
    const file = input.current?.files?.[0];
    if (!file) {
      setError("No file selected");
      return;
    }

    setStatus("uploading");
    setError("");
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      console.log("Uploading:", file.name, file.type, file.size);

      const res = await fetch("/api/v1/mock-analysis", {
        method: "POST",
        body: fd,
      });

      console.log("Response:", res.status, res.statusText);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log("Data:", data);
      setStatus("processing");

      // Get result
      await new Promise(r => setTimeout(r, 2000));
      const resultRes = await fetch(`/api/v1/mock-analysis?id=${data.id}`);
      const resultData = await resultRes.json();
      console.log("Result:", resultData);
      
      setResult(resultData);
      setStatus("done");
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message);
      setStatus("error");
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: "monospace" }}>
      <h1>Upload Test</h1>
      <input ref={input} type="file" accept="image/*,video/*,audio/*" />
      <br /><br />
      <button onClick={upload} disabled={status === "uploading"} style={{ padding: 10, fontSize: 16 }}>
        {status === "uploading" ? "Uploading..." : "Upload"}
      </button>
      
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {result && (
        <pre style={{ background: "#f0f0f0", padding: 20, marginTop: 20 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
