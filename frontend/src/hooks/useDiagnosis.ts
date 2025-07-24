'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

type Return = {
  loading: boolean;
  error: string | null;
  diagnosis: string;
  audioBlob: Blob | null;
  send: (audio: File, image?: File, text?: string) => void;
  reset: () => void;
};

export function useDiagnosis(): Return {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const reset = () => {
    setDiagnosis('');
    setAudioBlob(null);
    setError(null);
  };

  const send = (audio: File, image?: File, text?: string) => {
    reset();
    setLoading(true);
    toast.loading('Talking to AI Doctor…', { id: 'ws' });

    const ws = new WebSocket('ws://localhost:8001/ws/diagnosis');
    ws.binaryType = 'arraybuffer';

    ws.onopen = async () => {
      ws.send(await audio.arrayBuffer());
      ws.send(await image?.arrayBuffer() ?? new ArrayBuffer(0));
      ws.send(new TextEncoder().encode(text ?? ''));
    };

    const chunks: Blob[] = [];
    ws.onmessage = (e) => {
      if (typeof e.data === 'string') setDiagnosis((p) => p + e.data);
      else chunks.push(new Blob([e.data]));
    };

    ws.onclose = () => {
      setLoading(false);
      if (chunks.length) {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        setAudioBlob(blob);
        toast.success('Diagnosis complete!', { id: 'ws' });
      } else toast.error('No audio returned', { id: 'ws' });
    };

    ws.onerror = () => {
      setLoading(false);
      setError('Backend unreachable');
      toast.error('Backend unreachable', { id: 'ws' });
    };
  };

  return { loading, error, diagnosis, audioBlob, send, reset };
}