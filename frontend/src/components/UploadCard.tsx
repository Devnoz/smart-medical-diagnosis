'use client';
import { UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { FC, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  label: string;
  accept: string;
  onFile: (file: File) => void;
}

export const UploadCard: FC<Props> = ({ label, accept, onFile }) => {
  const onDrop = useCallback((files: File[]) => onFile(files[0]), [onFile]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept === 'audio/*' ? { 'audio/*': [] } : { 'image/*': [] },
    maxFiles: 1,
  });

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative w-full h-36 rounded-2xl border-2 border-dashed transition-colors cursor-pointer
        ${isDragActive ? 'bg-sky-200 border-sky-400' : 'bg-white/30 backdrop-blur-sm border-sky-300'}`}
    >
      {/* spread dropzone props on the inner div */}
      <div {...getRootProps({ className: 'flex flex-col items-center justify-center h-full' })}>
        <input {...getInputProps()} />
        <UploadCloud className="h-8 w-8 text-sky-600" />
        <span className="mt-2 text-sm font-medium text-slate-700">{label}</span>
        {isDragActive && <span className="text-xs text-sky-600">Drop here!</span>}
      </div>
    </motion.div>
  );
};