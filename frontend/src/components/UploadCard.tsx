'use client';
import { motion } from 'framer-motion';
import { FC, useCallback, ReactNode } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  label: string;
  description?: string;
  icon?: ReactNode;
  accept?: string;
  onFile: (file: File) => void;
}

export const UploadCard: FC<Props> = ({ label, description, icon, accept, onFile }) => {
  const onDrop = useCallback((files: File[]) => {
    if (files.length > 0) onFile(files[0]);
  }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept === 'audio/*' ? { 'audio/*': [] } : { 'image/*': [] },
    maxFiles: 1,
  });

  return (
    <motion.div
      {...getRootProps()}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`relative w-full p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300
        ${isDragActive ? 'bg-blue-50/50' : 'bg-transparent'}`}
    >
      <input {...getInputProps()} />
      {icon}
      <div className="space-y-1">
        <span className="block text-sm font-bold text-slate-800">{label}</span>
        {description && (
          <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            {description}
          </span>
        )}
      </div>
      {isDragActive && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-blue-500/10 backdrop-blur-[2px] flex items-center justify-center rounded-[1.5rem]"
        >
          <span className="text-blue-600 font-bold text-sm">Drop file here</span>
        </motion.div>
      )}
    </motion.div>
  );
};