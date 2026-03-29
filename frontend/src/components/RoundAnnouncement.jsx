import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ROUND_META = {
  1: { icon: '📋', title: 'INITIAL POSITIONS',  sub: 'Each advisor stakes their ground' },
  2: { icon: '⚔️',  title: 'CROSS-EXAMINATION', sub: 'Assumptions get challenged' },
  3: { icon: '⚖️',  title: 'FINAL VERDICTS',    sub: 'Confidence levels locked in' },
};

export default function RoundAnnouncement({ round, onDismiss }) {
  const meta = ROUND_META[round];

  useEffect(() => {
    if (!round) return;
    const id = setTimeout(onDismiss, 2200);
    return () => clearTimeout(id);
  }, [round, onDismiss]);

  return (
    <AnimatePresence>
      {round && meta && (
        <motion.div
          key={round}
          initial={{ opacity: 0, scale: 0.88, y: -16 }}
          animate={{ opacity: 1, scale: 1,    y: 0 }}
          exit={{    opacity: 0, scale: 1.06, y: 16 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.3 }}
            className="relative z-10 text-center px-12 py-10 rounded-xl border"
            style={{
              backgroundColor: '#0d1219',
              borderColor: '#d4a853',
              boxShadow: '0 0 60px rgba(212,168,83,0.2), 0 0 120px rgba(212,168,83,0.08)',
            }}
          >
            <div className="text-5xl mb-4">{meta.icon}</div>
            <div
              className="font-orbitron text-xs tracking-[0.5em] mb-2"
              style={{ color: '#d4a853' }}
            >
              ROUND {round}
            </div>
            <div
              className="font-orbitron font-black text-3xl tracking-widest mb-3"
              style={{ color: '#e2e8f0' }}
            >
              {meta.title}
            </div>
            <div className="text-sm" style={{ color: '#64748b' }}>
              {meta.sub}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
