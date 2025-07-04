"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import { Camera, UploadCloud, Stethoscope, Loader2, CheckCircle, Info, ArrowLeft, RefreshCw } from "lucide-react";
import aiDoctorLogo from "../../assets/ai_doctor.jpg";
import Head from "next/head";

const accent = "bg-blue-600 text-white";
const accentHover = "hover:bg-blue-700";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function App() {
  // UI state
  const [page, setPage] = useState<"home" | "upload" | "result">("home");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioResponse, setAudioResponse] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragover");
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // File select
  const handleFile = (file: File) => {
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Upload & analyze
  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setDiagnosis(null);
    setConfidence(null);
    setSolution(null);
    setAudioResponse(null);
    const formData = new FormData();
    formData.append("file", image);
    try {
      const res = await fetch("http://localhost:8000/predict/", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setDiagnosis(data.result || "Unknown");
      setConfidence(data.confidence || 95); // Placeholder
      setSolution(data.solution || data.result || "No solution provided.");
      if (data.audio) {
        const byteArray = new Uint8Array(
          data.audio.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16))
        );
        const audioBlob = new Blob([byteArray], { type: "audio/mp3" });
        setAudioResponse(URL.createObjectURL(audioBlob));
      }
      setPage("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Reset
  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setDiagnosis(null);
    setConfidence(null);
    setSolution(null);
    setAudioResponse(null);
    setError(null);
    setPage("upload");
  };

  // --- UI ---
  // Smooth scroll for nav links and highlight active
  React.useEffect(() => {
    const handleNavClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "A" && (target as HTMLAnchorElement).hash) {
        const hash = (target as HTMLAnchorElement).hash;
        const el = document.querySelector(hash);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    };
    document.addEventListener("click", handleNavClick);
    return () => {
      document.removeEventListener("click", handleNavClick);
    };
  }, []);

  // Audio recording state
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [userAudio, setUserAudio] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount or when leaving upload page
  React.useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (recordTimeoutRef.current) {
        clearTimeout(recordTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start recording
  const handleStartRecording = async () => {
    if (recording) return; // Prevent double start
    setRecordError(null);
    setUserAudio(null);
    setAudioChunks([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      let chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        setUserAudio(URL.createObjectURL(audioBlob));
        setAudioChunks([]);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        if (recordTimeoutRef.current) {
          clearTimeout(recordTimeoutRef.current);
        }
      };
      chunks = [];
      recorder.start();
      setRecording(true);
      // Auto-stop after 30 seconds
      recordTimeoutRef.current = setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          setRecording(false);
        }
      }, 30000);
    } catch {
      setRecordError("Microphone access denied or unavailable.");
    }
  };
  // Stop recording
  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setRecording(false);
      if (recordTimeoutRef.current) {
        clearTimeout(recordTimeoutRef.current);
      }
    }
  };
  // Reset audio
  const handleResetAudio = () => {
    setUserAudio(null);
    setAudioChunks([]);
    setRecordError(null);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recordTimeoutRef.current) {
      clearTimeout(recordTimeoutRef.current);
    }
  };

  return (
    <>
      <Head>
        <title>Aidoctor</title>
      </Head>
      <div className="font-sans min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100 text-gray-800 relative overflow-x-hidden">
        {/* Patterned background */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{backgroundImage: "url('/pattern-medical-cross.svg')", opacity: 0.12}} />
        <main className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-24 relative z-10">
          {/* Home Section Only */}
          <section id="home" className="flex flex-col-reverse md:flex-row items-center gap-10 bg-gradient-to-br from-blue-50/60 via-blue-100/80 to-cyan-100/40 rounded-3xl shadow-xl overflow-hidden relative p-8 mt-8">
            <div className="absolute inset-0 bg-[url('/pattern-medical-cross.svg')] bg-cover bg-center opacity-10 pointer-events-none" />
            <div className="flex-1 flex flex-col gap-6 items-start z-10">
              <h1 className="text-4xl md:text-5xl font-extrabold text-primary-dark mb-2 leading-tight drop-shadow-lg">
                Your Personal AI Health Companion
              </h1>
              <p className="text-lg text-gray-600 mb-4 max-w-xl">
                Instantly analyze your skin images and get AI-powered medical insights and solutions. Fast, private, and always available.
              </p>
              <button
                className={classNames(
                  "rounded-full px-8 py-3 text-lg font-semibold shadow transition-all duration-200 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary scale-100 hover:scale-105 hover:shadow-lg",
                )}
                onClick={() => setPage("upload")}
              >
                <UploadCloud className="inline-block mr-2 -mt-1" /> Start Diagnosis
              </button>
            </div>
            <div className="flex-1 flex justify-center z-10">
              <div className="bg-white rounded-2xl shadow-xl border border-primary-light p-4 flex items-center justify-center">
                <Image
                  src={aiDoctorLogo}
                  alt="AI Doctor Hero"
                  width={300}
                  height={300}
                  className="rounded-xl object-cover"
                  priority
                />
              </div>
            </div>
          </section>

          {/* Upload Section (modal style) */}
          {page === "upload" && (
            <section className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <div className="max-w-lg w-full bg-blue-50/95 rounded-2xl shadow-2xl p-8 flex flex-col gap-8 relative">
                <button
                  className="absolute top-4 right-4 text-blue-500 hover:text-blue-700 text-xl font-bold"
                  onClick={() => setPage("home")}
                  aria-label="Close"
                >
                  ×
                </button>
                <h2 className="text-2xl font-bold text-blue-700 mb-2 flex items-center gap-2">
                  <Camera className="w-6 h-6 text-blue-500" /> Upload Image for Diagnosis
                </h2>
                <p className="text-gray-600 mb-2">
                  Please upload a clear, well-lit image of the affected skin area. Supported formats: JPG, PNG. Max size: 5MB.
                </p>
                <div
                  className={classNames(
                    "flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition cursor-pointer relative",
                    dragActive ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-blue-50",
                    imagePreview ? "opacity-60 pointer-events-none" : ""
                  )}
                  onDragOver={imagePreview ? undefined : handleDrag}
                  onDragEnter={imagePreview ? undefined : handleDrag}
                  onDragLeave={imagePreview ? undefined : handleDrag}
                  onDrop={imagePreview ? undefined : handleDrop}
                  onClick={() => !imagePreview && fileInputRef.current?.click()}
                  style={{ minHeight: 180 }}
                >
                  <UploadCloud className="w-12 h-12 text-blue-400 mb-2" />
                  <span className="text-lg font-medium text-blue-700 mb-1">Drag & drop your image here</span>
                  <span className="text-gray-500 text-sm mb-2">or click to browse files</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={!!imagePreview}
                  />
                  {imagePreview && (
                    <div className="absolute top-2 right-2">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={64}
                        height={64}
                        className="rounded-lg border object-cover shadow"
                      />
                    </div>
                  )}
                </div>
                {/* Audio recording UI */}
                {imagePreview && (
                  <div className="flex flex-col gap-2 bg-blue-100/60 border border-blue-200 rounded-lg p-4 mt-2">
                    <span className="font-semibold text-blue-700 mb-1">Record Your Symptoms (optional)</span>
                    <div className="flex items-center gap-4">
                      {!recording && !userAudio && (
                        <button
                          className="rounded-full px-4 py-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                          onClick={handleStartRecording}
                        >
                          Start Recording
                        </button>
                      )}
                      {recording && (
                        <button
                          className="rounded-full px-4 py-2 bg-red-600 text-white font-semibold hover:bg-red-700 transition animate-pulse"
                          onClick={handleStopRecording}
                        >
                          Stop Recording
                        </button>
                      )}
                      {userAudio && !recording && (
                        <>
                          <audio controls src={userAudio} className="h-10" />
                          <button
                            className="rounded-full px-3 py-1 bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition ml-2"
                            onClick={handleResetAudio}
                          >
                            Reset
                          </button>
                        </>
                      )}
                    </div>
                    {recordError && <div className="text-red-600 text-sm mt-1">{recordError}</div>}
                    <span className="text-xs text-gray-500">You can record a short description of your symptoms for a more accurate diagnosis.</span>
                  </div>
                )}
                {error && <div className="text-red-600 text-center font-medium">{error}</div>}
                <button
                  className={classNames(
                    "w-full rounded-full py-3 text-lg font-semibold mt-2 flex items-center justify-center gap-2",
                    accent,
                    accentHover,
                    !image ? "opacity-60 cursor-not-allowed" : ""
                  )}
                  onClick={handleAnalyze}
                  disabled={!image || loading}
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-6 h-6 mr-2" />
                  ) : (
                    <Stethoscope className="w-6 h-6 mr-2" />
                  )}
                  {loading ? "Analyzing..." : "Get Diagnosis"}
                </button>
              </div>
            </section>
          )}

          {/* Result Section (modal style) */}
          {page === "result" && (
            <section className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <div className="max-w-lg w-full bg-blue-50/95 rounded-2xl shadow-2xl p-6 flex flex-col gap-6 relative overflow-y-auto max-h-[90vh]">
                <button
                  className="absolute top-4 right-4 text-blue-500 hover:text-blue-700 text-xl font-bold"
                  onClick={() => setPage("home")}
                  aria-label="Close"
                >
                  ×
                </button>
                <div className="flex items-center gap-4 mb-2">
                  <Image
                    src={imagePreview || "/doctor-hero.png"}
                    alt="Uploaded"
                    width={72}
                    height={72}
                    className="rounded-lg border object-cover shadow"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-blue-700 mb-1 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" /> Diagnosis Result
                    </h2>
                    <div className="text-gray-700 text-base font-semibold">
                      {diagnosis || "Unknown"}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      Confidence: <span className="font-bold text-green-600">{confidence ? `${confidence}%` : "-"}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 flex flex-col gap-2">
                  <h3 className="font-bold text-blue-700 mb-1">Comprehensive Solution</h3>
                  <div className="text-gray-700 whitespace-pre-line leading-relaxed text-sm max-h-40 overflow-y-auto">
                    {solution || "No solution provided."}
                  </div>
                  {audioResponse && (
                    <audio controls src={audioResponse} className="mt-2 w-full">
                      Your browser does not support the audio element.
                    </audio>
                  )}
                  {/* User's own audio playback */}
                  {userAudio && (
                    <div className="mt-2">
                      <span className="text-xs text-blue-700 font-semibold block mb-1">Your Recorded Symptoms</span>
                      <audio controls src={userAudio} className="w-full">
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 mt-2">
                  <button
                    className={classNames(
                      "rounded-full px-6 py-2 font-semibold border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 transition",
                      "flex items-center gap-2"
                    )}
                    onClick={handleReset}
                  >
                    <ArrowLeft className="w-5 h-5" /> Upload New Image
                  </button>
                  <button
                    className={classNames(
                      "rounded-full px-6 py-2 font-semibold border border-green-200 text-green-700 bg-white hover:bg-green-50 transition",
                      "flex items-center gap-2"
                    )}
                    onClick={() => setPage("home")}
                  >
                    <RefreshCw className="w-5 h-5" /> Go Home
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>
                    Disclaimer: This AI diagnosis is for informational purposes only and does not replace professional medical advice.
                  </span>
                </div>
              </div>
            </section>
          )}
        </main>
        <footer className="w-full text-center text-gray-400 text-xs py-6 mt-10">
          &copy; {new Date().getFullYear()} AI Doctor. All rights reserved.
        </footer>
      </div>
    </>
  );
}
