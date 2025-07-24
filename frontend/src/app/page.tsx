'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Mic, Pause, Square, Play } from 'lucide-react';
import Image from 'next/image';

import { UploadCard, DiagnosisCard, Loader } from '@/components';

export default function Home() {
  /* ---------- recorder ---------- */
  const [recState, setRecState] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  /* ---------- image ---------- */
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  /* ---------- diagnosis ---------- */
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorAudio, setDoctorAudio] = useState<Blob | null>(null);

  /* ---------- recorder helpers ---------- */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorderRef.current.onstop = () =>
        setAudioBlob(new Blob(audioChunks.current, { type: 'audio/wav' }));
      mediaRecorderRef.current.start();
      setRecState('recording');
    } catch (e) {
      toast.error('Microphone permission denied');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecState('paused');
    } else {
      mediaRecorderRef.current?.resume();
      setRecState('recording');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecState('idle');
  };

  const onImage = (f: File) => {
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!audioBlob) return toast.error('Please record your symptoms');
    setLoading(true);
    setDiagnosis('');
    setDoctorAudio(null);
    toast.loading('Talking to AI Doctor…', { id: 'ws' });

    const ws = new WebSocket('ws://localhost:8001/ws/diagnosis');
    ws.binaryType = 'arraybuffer';

    const audioChunks: Blob[] = [];
    let textReceived = '';

    ws.onopen = async () => {
      ws.send(await audioBlob.arrayBuffer());
      ws.send(await imageFile?.arrayBuffer() ?? new ArrayBuffer(0));
      ws.send(new ArrayBuffer(0));
    };

    ws.onmessage = (e) => {
      if (typeof e.data === 'string') {
        const msg = JSON.parse(e.data);
        if (msg.type === 'diagnosis') {
          textReceived += msg.text;
          setDiagnosis(textReceived);
        } else if (msg.type === 'error') {
          toast.error(msg.msg);
        }
      } else {
        audioChunks.push(new Blob([e.data]));
      }
    };

    ws.onclose = () => {
      setLoading(false);
      if (audioChunks.length) {
        setDoctorAudio(new Blob(audioChunks, { type: 'audio/mp3' }));
      } else if (textReceived) {
        // fallback: browser TTS
        const utter = new SpeechSynthesisUtterance(textReceived);
        speechSynthesis.speak(utter);
      }
      toast.success('Done!', { id: 'ws' });
    };

    ws.onerror = () => {
      setLoading(false);
      toast.error('Backend unreachable', { id: 'ws' });
    };
  };

  return (
    <>
      <Toaster position="top-center" />
      <main className="min-h-screen bg-gradient-to-br from-white to-sky-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col items-center">
            <Image src="/doctor.jpg" alt="" width={120} height={120} className="rounded-full shadow-lg mb-3" />
          </div>

          {/* Image */}
          <div className="glass-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-sky-800">Upload Image</h2>
            <UploadCard label="Drag or click to upload" accept="image/*" onFile={onImage} />
            {preview && (
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={preview}
                alt="preview"
                className="mt-4 w-full h-auto object-cover rounded-xl"
              />
            )}
          </div>

          {/* Recorder */}
          <div className="glass-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-sky-800">Record Symptoms</h2>
            <div className="flex items-center justify-center space-x-3">
              {recState === 'idle' && (
                <button
                  onClick={startRecording}
                  className="flex items-center space-x-2 px-6 py-3 rounded-full bg-red-500 text-white font-semibold shadow hover:bg-red-600"
                >
                  <Mic size={18} />
                  <span>Start</span>
                </button>
              )}
              {recState !== 'idle' && (
                <>
                  <button
                    onClick={pauseRecording}
                    className="flex items-center space-x-2 px-6 py-3 rounded-full bg-amber-500 text-white font-semibold shadow"
                  >
                    <Pause size={18} />
                    <span>{recState === 'paused' ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={stopRecording}
                    className="flex items-center space-x-2 px-6 py-3 rounded-full bg-green-500 text-white font-semibold shadow"
                  >
                    <Square size={18} />
                    <span>Stop</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <button
            disabled={loading || !audioBlob}
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-sky-600 text-white font-semibold shadow hover:bg-sky-700 disabled:bg-slate-300"
          >
            {loading ? <Loader /> : 'Get Diagnosis'}
          </button>

          {diagnosis && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <DiagnosisCard text={diagnosis} />
            </motion.div>
          )}

          {/* Playback buttons */}
          <div className="flex justify-center gap-4">
            {audioBlob && (
              <button onClick={() => new Audio(URL.createObjectURL(audioBlob)).play()} className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white text-sm">
                <Play size={18} /> My Recording
              </button>
            )}
            {doctorAudio && (
              <button onClick={() => new Audio(URL.createObjectURL(doctorAudio)).play()} className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500 text-white text-sm">
                <Play size={18} /> Doctor Reply
              </button>
            )}
          </div>
        </motion.div>
      </main>
    </>
  );
}