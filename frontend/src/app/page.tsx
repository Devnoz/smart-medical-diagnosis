'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Mic, Pause, Square, Play, ArrowRight, ShieldCheck, 
  Zap, Activity, Clock, Upload, ChevronDown, 
  Database, FileText, Download, MapPin, 
  CheckCircle2, SquareSquare, Stethoscope, Search, History, LineChart, X
} from 'lucide-react';
import Image from 'next/image';

import { Navbar, Footer, UploadCard, Loader } from '@/components';

type Step = 'hero' | 'intake' | 'processing' | 'results';
type Tab = 'Dashboard' | 'Consultations' | 'History' | 'Insights';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [step, setStep] = useState<Step>('hero');
  
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
  const [progress, setProgress] = useState(0);
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorAudio, setDoctorAudio] = useState<Blob | null>(null);

  /* ---------- audio playback ---------- */
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    let animationFrame: number;
    const updateProgress = () => {
      if (audioRef.current && isPlaying) {
        const duration = audioRef.current.duration;
        if (duration > 0) {
          setAudioProgress(audioRef.current.currentTime / duration);
        }
        animationFrame = requestAnimationFrame(updateProgress);
      }
    };
    if (isPlaying) {
      animationFrame = requestAnimationFrame(updateProgress);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying]);

  const toggleAudio = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current && doctorAudio) {
        audioRef.current = new Audio(URL.createObjectURL(doctorAudio));
        audioRef.current.onended = () => {
           setIsPlaying(false);
           setAudioProgress(1);
        };
      }
      if (audioRef.current) {
         if (audioProgress >= 1) {
            audioRef.current.currentTime = 0;
         }
         audioRef.current.play();
         setIsPlaying(true);
      }
    }
  };

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

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecState('idle');
  };

  const onImage = (f: File) => {
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const removeImage = () => {
    setImageFile(null);
    setPreview(null);
  }

  const handleSubmit = async () => {
    if (!audioBlob && !imageFile) return toast.error('Please provide symptoms or an image');
    
    setStep('processing');
    setLoading(true);
    setProgress(0);
    setDiagnosis('');
    setDoctorAudio(null);
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
    }

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    const ws = new WebSocket('ws://localhost:8001/ws/diagnosis');
    ws.binaryType = 'arraybuffer';

    const audioChunks: Blob[] = [];
    let textReceived = '';

    ws.onopen = async () => {
      ws.send(await audioBlob?.arrayBuffer() ?? new ArrayBuffer(0));
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
      clearInterval(interval);
      setProgress(100);
      setLoading(false);
      
      setTimeout(() => {
        setStep('results');
        if (audioChunks.length) {
          setDoctorAudio(new Blob(audioChunks, { type: 'audio/mp3' }));
        }
      }, 1000);
    };

    ws.onerror = () => {
      clearInterval(interval);
      setLoading(false);
      setStep('intake');
      toast.error('Backend unreachable');
    };
  };

  const renderMarkdown = (text: string, isHighlight: boolean = false) => {
    const textColor = isHighlight ? 'text-blue-700' : 'text-slate-600';
    const strongColor = isHighlight ? 'text-blue-900 font-bold' : 'text-slate-800 font-bold';
    
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h4 key={i} className={`text-lg font-bold mt-4 mb-2 ${isHighlight ? 'text-blue-800' : ''}`}>{line.replace('### ', '')}</h4>;
      if (line.startsWith('## ')) return <h3 key={i} className={`text-xl font-bold mt-5 mb-2 ${isHighlight ? 'text-blue-800' : ''}`}>{line.replace('## ', '')}</h3>;
      if (line.startsWith('# ')) return <h2 key={i} className={`text-2xl font-bold mt-6 mb-3 ${isHighlight ? 'text-blue-900' : ''}`}>{line.replace('# ', '')}</h2>;
      if (line.startsWith('- ')) return <li key={i} className={`ml-4 list-disc mb-1 ${textColor}`}>{line.replace('- ', '')}</li>;
      if (line.match(/^\d+\.\s/)) return <li key={i} className={`ml-4 list-decimal mb-1 ${textColor}`}>{line.replace(/^\d+\.\s/, '')}</li>;
      
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className={`mb-2 leading-relaxed ${textColor}`}>
          {parts.map((part, j) => 
            part.startsWith('**') && part.endsWith('**') 
              ? <strong key={j} className={strongColor}>{part.slice(2, -2)}</strong> 
              : part
          )}
        </p>
      );
    });
  };

  const renderTabContent = () => {
    if (activeTab === 'Consultations') {
      return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-4xl w-full mx-auto premium-card p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Stethoscope size={28} /></div>
            <div><h2 className="text-3xl font-bold">Active Consultations</h2><p className="text-slate-500">Manage your ongoing dermatologist reviews.</p></div>
          </div>
          <div className="space-y-4">
             <div className="p-6 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                  <h4 className="font-bold text-lg">Dr. Sarah Jenkins</h4>
                  <p className="text-slate-500 text-sm">Follow-up on recent mole scan • Scheduled for Tomorrow, 10:00 AM</p>
                </div>
                <button className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg text-sm">Join Call</button>
             </div>
             <div className="p-6 border border-slate-100 rounded-2xl flex items-center justify-between opacity-60">
                <div>
                  <h4 className="font-bold text-lg">Dr. Marcus Webb</h4>
                  <p className="text-slate-500 text-sm">General Skin Check • Completed Jan 12</p>
                </div>
                <button className="px-4 py-2 bg-slate-100 text-slate-500 font-bold rounded-lg text-sm">View Notes</button>
             </div>
          </div>
        </motion.div>
      );
    }
    if (activeTab === 'History') {
      return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-4xl w-full mx-auto premium-card p-12">
           <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><History size={28} /></div>
            <div><h2 className="text-3xl font-bold">Scan History</h2><p className="text-slate-500">Your past dermal analysis records.</p></div>
          </div>
          <div className="space-y-4">
            {['Suspicious Lesion - Left Arm', 'Rash Analysis - Back', 'Routine Check - Face'].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl">
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center"><Search className="text-slate-400" /></div>
                <div className="flex-grow">
                   <h4 className="font-bold">{item}</h4>
                   <p className="text-xs text-slate-400">Scan date: {new Date(Date.now() - i * 864000000).toLocaleDateString()}</p>
                </div>
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><ArrowRight size={20}/></button>
              </div>
            ))}
          </div>
        </motion.div>
      );
    }
    if (activeTab === 'Insights') {
      return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-4xl w-full mx-auto premium-card p-12">
           <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><LineChart size={28} /></div>
            <div><h2 className="text-3xl font-bold">Health Insights</h2><p className="text-slate-500">Trends based on your dermal data.</p></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
             <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-bold mb-2">Sun Exposure Risk</h4>
                <div className="text-3xl font-bold text-orange-500">Moderate</div>
                <p className="text-sm text-slate-500 mt-2">Based on your recent scans, increased freckling indicates higher UV exposure.</p>
             </div>
             <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-bold mb-2">Skin Hydration</h4>
                <div className="text-3xl font-bold text-green-500">Optimal</div>
                <p className="text-sm text-slate-500 mt-2">Texture analysis shows excellent moisture retention.</p>
             </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <Toaster position="top-center" />

      <main className="flex-grow flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {activeTab !== 'Dashboard' ? (
             <motion.div key="tabs" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full">
                {renderTabContent()}
             </motion.div>
          ) : step === 'hero' && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider animate-pulse-slow">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  Live Dermal Processing Enabled
                </div>
                
                <h1 className="text-6xl md:text-7xl font-bold leading-[1.1] tracking-tight">
                  AI-Powered <br />
                  <span className="gradient-text">Smart Skin Diagnosis</span> in Seconds
                </h1>
                
                <p className="text-lg text-slate-500 max-w-lg leading-relaxed">
                  Experience the next generation of dermatology. Our advanced dermal engine 
                  analyzes skin imaging and symptoms with 99.8% clinical precision.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <button 
                    onClick={() => setStep('intake')}
                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 hover:scale-105 transition-transform"
                  >
                    Start Free Scan <ArrowRight size={20} />
                  </button>
                  <button className="flex items-center gap-2 px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl shadow-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <Play size={14} className="fill-slate-700 ml-0.5" />
                    </div>
                    Watch Demo
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-8">
                  {[
                    { icon: <ShieldCheck size={20} />, label: 'HIPAA Compliant' },
                    { icon: <Search size={20} />, label: 'AI Powered' },
                    { icon: <Clock size={20} />, label: '24/7 Monitoring' },
                    { icon: <Zap size={20} />, label: 'Fast Analysis' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-400 font-bold text-xs uppercase tracking-widest">
                      <div className="text-slate-300">{item.icon}</div>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="premium-card p-4 aspect-square flex items-center justify-center overflow-hidden">
                  <Image 
                    src="/skin_hero.png" 
                    alt="Dermal Scan" 
                    width={600} 
                    height={600} 
                    className="object-cover rounded-[1.5rem]"
                  />
                  
                  {/* Floating Confidence Card */}
                  <div className="absolute bottom-12 left-12 right-12 premium-card p-6 border-white/60">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-blue-500 uppercase tracking-widest">Active Analysis</span>
                      <span className="text-sm font-bold text-blue-600">98.4% Confidence</span>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2.5 w-full bg-blue-50 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-blue-600 to-cyan-500"
                          initial={{ width: 0 }}
                          animate={{ width: '98.4%' }}
                          transition={{ duration: 2, delay: 1 }}
                        />
                      </div>
                      <div className="h-2 w-3/4 bg-slate-100 rounded-full" />
                      <div className="h-2 w-1/2 bg-slate-100 rounded-full opacity-50" />
                    </div>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-cyan-100/50 rounded-full blur-3xl -z-10" />
                <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-blue-100/50 rounded-full blur-3xl -z-10" />
              </div>
            </motion.div>
          )}

          {activeTab === 'Dashboard' && step === 'intake' && (
            <motion.div
              key="intake"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-6xl w-full premium-card overflow-hidden grid grid-cols-1 lg:grid-cols-2"
            >
              {/* Left Side: Inputs */}
              <div className="p-12 space-y-10 border-r border-slate-100">
                <div>
                  <h2 className="text-4xl font-bold mb-2">Diagnostic Intake</h2>
                  <p className="text-slate-500">Upload data to begin dermal cross-referencing.</p>
                </div>

                <div className="space-y-6">
                  {/* Image Upload or Preview */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />
                    <div className="relative">
                      {preview ? (
                        <div className="relative rounded-[2rem] overflow-hidden border-2 border-blue-200 bg-slate-50/50 flex items-center justify-center p-2 group/img min-h-[200px]">
                          <img src={preview} alt="Upload preview" className="max-w-full max-h-[300px] object-contain rounded-[1.5rem]" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]">
                             <button onClick={removeImage} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg">
                               <X size={24} />
                             </button>
                          </div>
                        </div>
                      ) : (
                        <div className="premium-card p-1 bg-slate-50 border-dashed border-2 border-slate-200">
                           <UploadCard 
                            onFile={onImage}
                            label="Skin Image Scan"
                            description="JPG, PNG, or WEBP up to 50MB"
                            icon={<Upload className="text-blue-500 mb-2" size={32} />}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="premium-card p-6 flex flex-col items-center gap-3 bg-slate-50 border-none">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${recState === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'}`}>
                        {recState === 'idle' ? (
                          <Mic size={24} onClick={startRecording} className="cursor-pointer" />
                        ) : (
                          <Square size={24} onClick={stopRecording} className="cursor-pointer" />
                        )}
                      </div>
                      <div className="text-center">
                        <span className="block text-sm font-bold text-slate-800">Describe Symptoms</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Voice / Audio</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Primary Symptom</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Red Rash, Itching"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Duration</label>
                        <div className="relative">
                          <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                            <option>Less than 24h</option>
                            <option>1-3 days</option>
                            <option>1 week+</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSubmit}
                  className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-colors"
                >
                  Initialize Analysis <Zap size={18} className="fill-white" />
                </button>
              </div>

              {/* Right Side: Visual/Stats */}
              <div className="bg-slate-50/50 p-12 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl" />
                  <div className="w-32 h-32 rounded-full bg-white shadow-2xl flex items-center justify-center relative z-10">
                    <Search size={48} className="text-blue-500" />
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-blue-200 rounded-full animate-[spin_10s_linear_infinite] border-dashed" />
                </div>

                <div className="space-y-4 max-w-xs">
                  <h3 className="text-2xl font-bold">Ready to Analyze</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Complete the patient profile on the left to start the DermoMed AI engine. 
                    Our system cross-references against 4.2M clinical records.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="premium-card p-6 text-left border-none bg-white">
                    <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Latency</span>
                    <span className="text-xl font-bold">~1.2s</span>
                  </div>
                  <div className="premium-card p-6 text-left border-none bg-white">
                    <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Confidence</span>
                    <span className="text-xl font-bold">99.8%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Dashboard' && step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-12"
            >
              <div className="max-w-md w-full premium-card p-12 text-center space-y-10">
                <div className="relative mx-auto w-32 h-32">
                   <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                   <div className="relative w-full h-full rounded-full border-4 border-slate-50 flex items-center justify-center overflow-hidden bg-slate-900">
                      <Image 
                        src="/skin_processing.png" 
                        alt="Processing" 
                        fill 
                        className="object-cover opacity-80"
                      />
                   </div>
                   {/* Spinning Ring */}
                   <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="50%"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-blue-500"
                        strokeDasharray="400"
                        strokeDashoffset={400 - (400 * progress) / 100}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                   </svg>
                </div>

                <div className="space-y-4">
                  <h2 className="text-3xl font-bold">AI Engine Processing</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Please wait while our dermal network synthesizes your medical profile against global diagnostic standards.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                    <span>Cross-checking database...</span>
                    <span>{Math.round(progress)}% Complete</span>
                  </div>
                  <div className="h-2 w-full bg-blue-50 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
                  <ShieldCheck size={12} className="text-blue-500" />
                  End-to-end HIPAA Encrypted Analysis
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
                {[
                  { icon: <Activity className="text-blue-600" />, title: 'Symptom Mapping', desc: 'Analyzing clinical data points relative to your inputs.' },
                  { icon: <Database className="text-blue-600" />, title: 'Database Sync', desc: 'Cross-referencing latest peer-reviewed dermatology journals.' },
                  { icon: <FileText className="text-blue-600" />, title: 'Report Draft', desc: 'Structuring insights for practitioner-ready documentation.' },
                ].map((card, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 * i }}
                    className="premium-card p-8 space-y-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                      {card.icon}
                    </div>
                    <h4 className="font-bold">{card.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'Dashboard' && step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Main Results */}
              <div className="lg:col-span-2 space-y-8">
                <div className="premium-card p-12 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">Preliminary Assessment</span>
                      <h2 className="text-4xl font-bold tracking-tight">
                         Diagnostic Report
                      </h2>
                    </div>
                    <div className="px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-xs font-bold uppercase tracking-widest border border-orange-100">
                      Requires Review
                    </div>
                  </div>

                  <div className="flex items-center gap-10 border-b border-slate-100 pb-8">
                    <div className="text-6xl font-bold flex items-baseline">
                      94<span className="text-3xl text-blue-300 ml-1">%</span>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                      Analysis confidence based on dermal imaging and symptomatic pattern matching.
                    </p>
                  </div>

                  <div className={`space-y-4 transition-all duration-300 ${isPlaying ? 'bg-blue-50/50 p-6 rounded-2xl border border-blue-100' : ''}`}>
                     {renderMarkdown(diagnosis)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-3 py-5 bg-white border border-slate-100 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-colors">
                    <FileText size={20} className="text-blue-600" /> Download PDF Report
                  </button>
                  <button className="flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/25 hover:scale-[1.02] transition-transform">
                    <MapPin size={20} /> Nearby Dermatologists
                  </button>
                </div>
              </div>

              {/* Sidebar: AI Health Assistant */}
              <div className="space-y-8">
                <div className="premium-card p-10 flex flex-col items-center text-center space-y-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50" />
                    <Image 
                      src="/doctor.jpg" 
                      alt="Assistant" 
                      width={120} 
                      height={120} 
                      className="rounded-full shadow-2xl relative z-10 border-4 border-white object-cover" 
                    />
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full z-20" />
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-lg">AI Dermatologist</h4>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                       {isPlaying ? 'Speaking now...' : 'Ready to explain findings'}
                    </p>
                  </div>

                  <div className="w-full space-y-6">
                    <div className="bg-blue-50/50 rounded-2xl p-6 space-y-4 border border-blue-100">
                      {/* Audio Visualizer Mock */}
                      <div className="flex items-center justify-center gap-1.5 h-8">
                        {[40, 70, 45, 90, 60, 80, 50, 65, 55, 75, 40, 60].map((h, i) => (
                          <motion.div 
                            key={i}
                            className={`w-1 rounded-full ${isPlaying ? 'bg-gradient-to-t from-blue-600 to-cyan-500' : 'bg-blue-200'}`}
                            animate={isPlaying ? { height: [`${h}%`, `${Math.max(20, h - 30)}%`, `${h}%`] } : { height: '20%' }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                          />
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={toggleAudio}
                          disabled={!doctorAudio}
                          className="w-12 h-12 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-110 transition-transform disabled:bg-slate-300 disabled:shadow-none disabled:hover:scale-100"
                        >
                          {isPlaying ? <Square size={18} className="fill-white" /> : <Play size={20} className="fill-white ml-1" />}
                        </button>
                        <div className="flex-grow h-1.5 bg-blue-100 rounded-full overflow-hidden">
                           <motion.div 
                             className="h-full bg-blue-600 rounded-full" 
                             initial={{ width: 0 }}
                             animate={isPlaying ? { width: '100%' } : { width: '0%' }}
                             transition={{ duration: 10, ease: 'linear' }}
                           />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="premium-card p-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scan Quality</h5>
                    <div className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded">4K Volumetric</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-400">Dermal resolution</span>
                      <span className="text-blue-600">Excellent</span>
                    </div>
                    <div className="h-2 bg-blue-50 rounded-full overflow-hidden">
                      <div className="h-full w-[92%] bg-gradient-to-r from-blue-600 to-cyan-500" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}