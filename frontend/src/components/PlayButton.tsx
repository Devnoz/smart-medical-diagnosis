'use client';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { FC } from 'react';

interface Props {
  blob: Blob | null;
}
export const PlayButton: FC<Props> = ({ blob }) => {
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => new Audio(url).play()}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg flex items-center justify-center"
    >
      <Play size={24} />
    </motion.button>
  );
};