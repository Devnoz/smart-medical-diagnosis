// app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { CheckCircle, XCircle } from "lucide-react";

export default function HomePage() {
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Audio recording and playback states
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [doctorAudioUrl, setDoctorAudioUrl] = useState<string | null>(null);
  const [doctorAudioBlob, setDoctorAudioBlob] = useState<Blob | null>(null);
  const doctorAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const [doctorAudioPlaying, setDoctorAudioPlaying] = useState(false);

  // Accent and semantic color palette (for reference, use Tailwind custom classes or inline styles if needed):
  // Primary: #2563eb (blue-600), #1e40af (blue-800), #60a5fa (blue-400)
  // Secondary: #fbbf24 (amber-400), #f59e42 (orange-400), #fef3c7 (amber-100)
  // Success: #22c55e (green-500), #bbf7d0 (green-100)
  // Warning/Info: #f59e42 (orange-400), #fef3c7 (amber-100)
  // Error: #ef4444 (red-500), #fee2e2 (red-100)

  // Example micro-interaction: bounce on success icon
  const [showSuccessBounce, setShowSuccessBounce] = useState(false);
  useEffect(() => {
    if (diagnosis) {
      setShowSuccessBounce(true);
      const timeout = setTimeout(() => setShowSuccessBounce(false), 700);
      return () => clearTimeout(timeout);
    }
  }, [diagnosis]);

  // Example handler for file input (simulate upload/diagnosis)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setDiagnosis(null);
      setError(null);
      // Show preview
      const url = URL.createObjectURL(e.target.files[0]);
      setPreviewUrl(url);
    }
  };

  const handleDiagnose = async () => {
    if (!selectedFile) {
      setError("Please select an image to diagnose.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setDiagnosis(null);
    setSolution(null);
    setConfidence(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch("http://localhost:8000/predict/", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to get diagnosis from backend.");
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setDiagnosis(data.result || "No diagnosis returned.");
      setConfidence(data.confidence || null);
      setSolution(data.solution || "");
      // Play audio from hex string
      if (data.audio) {
        const audioBytes = new Uint8Array(
          data.audio.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16))
        );
        const audioBlob = new Blob([audioBytes], { type: "audio/mp3" });
        setDoctorAudioBlob(audioBlob);
        setDoctorAudioUrl(URL.createObjectURL(audioBlob));
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred during diagnosis.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // User voice recording handlers
  const handleStartRecording = async () => {
    if (!navigator.mediaDevices) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      setUserAudioUrl(URL.createObjectURL(blob));
    };
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };
  const handleStopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  // Update doctor audio url when diagnosis changes
  useEffect(() => {
    if (diagnosis && doctorAudioBlob) {
      setDoctorAudioUrl(URL.createObjectURL(doctorAudioBlob));
    }
  }, [diagnosis, doctorAudioBlob]);

  return (
    <>
      {/* App background: soft blue gradient with subtle pattern overlay */}
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 relative overflow-hidden">
        {/* Subtle pattern overlay (SVG medical cross grid) */}
        <div className="absolute inset-0 pointer-events-none opacity-10 z-0">
          <Image src="/pattern-medical-cross.svg" alt="pattern" fill style={{objectFit:'cover'}} />
        </div>

        {/* Centered Card */}
        <main className="min-h-screen flex items-center justify-center w-full px-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-blue-100 max-w-5xl w-full mx-auto p-8 flex flex-col items-center transition-all duration-500 hover:shadow-blue-200 hover:border-blue-200 hover:scale-[1.01] min-h-[700px]">            {/* Card Header */}
            <div className="w-full rounded-t-3xl bg-gradient-to-r from-blue-100 via-blue-50 to-blue-200 p-8 flex flex-col items-center border-b border-blue-100 relative">
              {/* Company Logo Top Left Inside Card */}
              <div className="absolute top-4 left-6 flex items-center gap-2 select-none">
                <Image src="/assets/logo.png" alt="Company Logo" width={95} height={95} className="object-contain drop-shadow-lg" priority />
              </div>
              <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight mb-2 drop-shadow-sm">AI Doctor</h1>
              <p className="text-gray-700 text-center text-base font-medium drop-shadow-sm">Upload a diagnostic image and let AI Doctor provide a professional medical suggestion.</p>
            </div>
            {/* Card Body */}
            <div className="w-full p-6 flex flex-col md:flex-row items-center gap-4">
              {/* Left: Upload & Diagnosis Section */}
              <div className="flex-1 flex flex-col items-center gap-4 w-full">
                {/* Upload Section */}
                <label htmlFor="file-upload" className="w-full flex items-center gap-3 border border-blue-200 bg-blue-50/60 p-3 rounded-lg focus-within:ring-2 focus-within:ring-blue-400 focus:outline-none transition-all duration-300 shadow-sm hover:border-blue-400 hover:bg-blue-100/80 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-blue-400 placeholder:font-semibold text-blue-700 font-semibold text-base">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
                  {selectedFile ? selectedFile.name : 'Choose an image to diagnose...'}
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={!!selectedFile}
                    className="hidden"
                  />
                </label>
                {/* Show preview if uploaded */}
                {previewUrl && (
                  <div className="w-full flex flex-col items-center">
                    <Image src={previewUrl} alt="Preview" width={320} height={224} className="rounded-xl border border-blue-100 shadow-md max-h-56 object-contain mb-2 bg-white" />
                    <button
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); setDiagnosis(null); setSolution(null); setConfidence(null); }}
                      className="text-xs text-blue-600 underline hover:text-blue-800 transition-colors duration-200 mb-2 font-semibold"
                    >Remove</button>
                  </div>
                )}
                {/* User Voice Recording Section */}
                <div className="w-full flex flex-col items-center gap-2 mb-2">
                  <div className="flex gap-2 w-full justify-center">
                    <button
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      className={`px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-200 ${isRecording ? 'bg-red-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-700'}`}
                    >
                      {isRecording ? 'Stop Recording' : 'Record Your Voice'}
                    </button>
                    <button
                      onClick={() => setUserAudioUrl(null)}
                      disabled={!userAudioUrl}
                      className="px-4 py-2 rounded-lg font-semibold shadow-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset Recording
                    </button>
                  </div>
                  {userAudioUrl && (
                    <audio controls src={userAudioUrl} className="mt-2" />
                  )}
                </div>
                {/* Error Message */}
                {error && (
                  <div className="mt-2 w-full p-4 rounded-xl bg-red-100/80 text-red-700 flex items-center border border-red-200 shadow animate-fadeIn">
                    <XCircle className="mr-2" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  onClick={handleDiagnose}
                  disabled={isLoading || !selectedFile || !!diagnosis}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transform hover:scale-105 transition-all duration-300 focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden text-lg tracking-wide mt-4"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2 animate-pulse">
                      <svg className="w-5 h-5 animate-spin text-blue-200" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                      Diagnosing...
                    </span>
                  ) : (
                    <span>Diagnose</span>
                  )}
                  <span className="absolute inset-0 pointer-events-none" />
                </button>
              </div>
              {/* Right: Doctor Image and Diagnosis Result */}
              <div className={`flex flex-col items-center justify-start ml-6 transition-all duration-700 w-[420px]`} style={{position:'relative'}}>
                <div className="overflow-hidden rounded-2xl w-[180px] h-[220px] bg-gradient-to-br from-blue-100 via-blue-50 to-blue-200 mb-4">
                  <Image src="/assets/ai_doctor.jpg" alt="AI Doctor" width={180} height={220} className="object-cover w-full h-full transition-transform duration-300 hover:scale-105" priority />
                </div>
                {/* Doctor Response Audio */}
                {doctorAudioUrl && (
                  <div className="flex flex-col items-center gap-2 w-full mb-4">
                    <button
                      onClick={() => {
                        if (doctorAudioUrl) {
                          if (doctorAudioRef.current?.paused || doctorAudioRef.current?.ended) {
                            doctorAudioRef.current?.play();
                          } else {
                            doctorAudioRef.current?.pause();
                          }
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 font-semibold transition-all duration-200 w-full"
                    >
                      {doctorAudioPlaying ? '⏸ Pause' : '▶️ Play'} Doctor Response
                    </button>
                    <audio
                      ref={doctorAudioRef}
                      src={doctorAudioUrl}
                      onPlay={() => setDoctorAudioPlaying(true)}
                      onPause={() => setDoctorAudioPlaying(false)}
                      onEnded={() => setDoctorAudioPlaying(false)}
                      className="hidden"
                    />
                  </div>
                )}
                {diagnosis && (
                  <div className="w-full px-4 pb-4 flex flex-col gap-2">
                    <div className="flex items-center text-green-700 mb-2">
                      <CheckCircle className={`mr-2 ${showSuccessBounce ? 'animate-bounce' : ''}`} />
                      <h3 className="text-lg font-semibold drop-shadow-sm">Diagnosis Result</h3>
                    </div>
                    <p className="mt-1 text-gray-900 text-base font-semibold leading-relaxed drop-shadow-sm">{diagnosis}</p>
                    <p className="text-sm text-blue-800 mt-1 font-medium">Confidence: {confidence}%</p>
                    <p className="mt-2 italic text-green-900 font-medium drop-shadow-sm">Suggested Solution: {solution}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 text-center bg-gradient-to-br from-blue-100 via-blue-50 to-blue-200 text-gray-600 border-t border-blue-100/60 shadow-inner mt-10">
          <p>&copy; {new Date().getFullYear()} <span className="text-blue-600 font-semibold">AI Doctor</span>. All rights reserved.</p>
        </footer>
      </div>

      {/* Page fade-in transition */}
      <style jsx global>{`
        body {
          animation: fadeIn 0.7s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.7s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </>
  );
}
