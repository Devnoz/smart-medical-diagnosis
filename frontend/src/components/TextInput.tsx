'use client';
import { motion } from 'framer-motion';

interface Props {
  value: string;
  onChange: (val: string) => void;
}
export const TextInput = ({ value, onChange }: Props) => (
  <motion.textarea
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    rows={3}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder="Additional notes…"
    className="w-full p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-slate-300 placeholder-slate-500 focus:ring-2 focus:ring-sky-500"
  />
);