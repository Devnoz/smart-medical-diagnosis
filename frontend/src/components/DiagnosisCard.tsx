'use client';
import { motion } from 'framer-motion';

interface Props {
  text: string;
}
export const DiagnosisCard = ({ text }: Props) =>
  text ? (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/30 backdrop-blur-md rounded-2xl p-5 shadow-lg"
    >
      <h3 className="text-lg font-bold text-sky-800 mb-2">Diagnosis</h3>
      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{text}</p>
    </motion.div>
  ) : null;