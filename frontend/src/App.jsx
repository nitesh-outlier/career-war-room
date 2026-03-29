import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DebateView from './components/DebateView.jsx';

const AGENTS = [
  { name: 'The Strategist', emoji: '🎯', color: '#3b82f6', role: 'McKinsey Partner' },
  { name: 'The Contrarian', emoji: '😈', color: '#ef4444', role: "Devil's Advocate" },
  { name: 'The Mentor',     emoji: '👴', color: '#a855f7', role: 'Seasoned Executive' },
  { name: 'The Data Sci',   emoji: '📊', color: '#22c55e', role: 'Quant Analyst' },
  { name: 'The Coach',      emoji: '💚', color: '#f59e0b', role: 'Executive Coach' },
];

const HOW_IT_WORKS = [
  {
    step: '01', icon: '📋', title: 'Submit Your Decision',
    desc: "Describe the career move you're considering. Add context: comp, timeline, risk tolerance.",
  },
  {
    step: '02', icon: '⚔️', title: '3 Rounds of Debate',
    desc: '5 AI advisors argue, challenge, and cross-examine each other across 3 structured rounds.',
  },
  {
    step: '03', icon: '📄', title: 'War Room Brief',
    desc: 'Receive a synthesis of consensus, tensions, and a decision framework tailored to your situation.',
  },
];

const MIN_CHARS = 20;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' },
  }),
};

export default function App() {
  const [decision, setDecision]   = useState('');
  const [role, setRole]           = useState('');
  const [experience, setExperience] = useState('');
  const [priorities, setPriorities] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched]     = useState(false); // show validation after first attempt

  const context = [
    role        && `Current role: ${role}`,
    experience  && `Years of experience: ${experience}`,
    priorities  && `Key priorities: ${priorities}`,
  ].filter(Boolean).join('. ');

  const trimmed    = decision.trim();
  const charCount  = trimmed.length;
  const isValid    = charCount >= MIN_CHARS;
  const remaining  = MIN_CHARS - charCount;
  const showError  = touched && !isValid;

  const handleSubmit = () => {
    setTouched(true);
    if (isValid) setSubmitted(true);
  };

  if (submitted) {
    return (
      <AnimatePresence>
        <motion.div
          key="debate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <DebateView
            decision={trimmed}
            context={context}
            onReset={() => { setSubmitted(false); setTouched(false); }}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div
      className="min-h-screen font-mono text-war-text overflow-x-hidden"
      style={{ backgroundColor: '#0a0e17' }}
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
        }}
      />

      {/* Top bar */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="visible" custom={0}
        className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 border-b"
        style={{ borderColor: '#1e293b' }}
      >
        <span className="font-orbitron text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] text-war-amber opacity-80 hidden sm:block">
          CLASSIFIED // CAREER INTELLIGENCE
        </span>
        <span className="font-orbitron text-[10px] tracking-[0.2em] text-war-amber opacity-80 sm:hidden">
          AI WAR ROOM
        </span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs tracking-widest hidden sm:block" style={{ color: '#64748b' }}>SYSTEM ONLINE</span>
        </div>
      </motion.div>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center justify-center px-4 pt-12 sm:pt-20 pb-10 sm:pb-12 text-center">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="mb-3 text-xs tracking-[0.5em] font-mono"
          style={{ color: '#d4a853', opacity: 0.7 }}
        >
          ▸ ADVISORY SYSTEM v3.0
        </motion.div>

        <motion.h1
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="font-orbitron font-black text-4xl sm:text-5xl md:text-7xl leading-none tracking-tight mb-5 sm:mb-6"
          style={{ color: '#e2e8f0', textShadow: '0 0 40px rgba(212,168,83,0.25)' }}
        >
          AI CAREER
          <br />
          <span style={{ color: '#d4a853' }}>WAR ROOM</span>
        </motion.h1>

        <motion.p
          variants={fadeUp} initial="hidden" animate="visible" custom={3}
          className="text-sm sm:text-base md:text-lg max-w-lg leading-relaxed"
          style={{ color: '#94a3b8' }}
        >
          5 AI advisors. 3 rounds of debate.
          <br />
          Your career, stress-tested.
        </motion.p>

        {/* Agent chips — hide 2 on smallest screens */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={4}
          className="flex flex-wrap justify-center gap-2 mt-6 sm:mt-8"
        >
          {AGENTS.map((a, i) => (
            <div
              key={a.name}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border ${i >= 4 ? 'hidden sm:flex' : ''}`}
              style={{
                backgroundColor: `${a.color}12`,
                borderColor: `${a.color}30`,
                color: a.color,
              }}
            >
              <span>{a.emoji}</span>
              <span className="font-mono tracking-wide">{a.name}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Input Form ─────────────────────────────────────────── */}
      <section className="relative z-10 w-full max-w-2xl mx-auto px-4 pb-14 sm:pb-16">
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={5}
          className="rounded-lg border p-4 sm:p-6 space-y-4 sm:space-y-5"
          style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
        >
          <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: '#1e293b' }}>
            <div className="w-2 h-2 rounded-full bg-war-amber animate-pulse flex-shrink-0" />
            <span className="font-orbitron text-xs tracking-[0.3em]" style={{ color: '#d4a853' }}>
              MISSION BRIEFING
            </span>
          </div>

          {/* Decision textarea */}
          <div>
            <label className="block text-xs tracking-widest mb-2" style={{ color: '#64748b' }}>
              CAREER DECISION <span style={{ color: '#d4a853' }}>*</span>
            </label>
            <textarea
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              onFocus={() => setTouched(false)}
              rows={4}
              placeholder="e.g., Should I leave my Fortune 500 PM role for a VP of Product position at a Series B startup?"
              className="w-full rounded border px-3 sm:px-4 py-3 text-sm leading-relaxed resize-none outline-none transition-colors font-mono placeholder:opacity-40"
              style={{
                backgroundColor: '#0a0e17',
                borderColor: showError ? '#ef4444' : isValid ? '#22c55e40' : '#1e293b',
                color: '#e2e8f0',
              }}
            />
            {/* Char count / validation */}
            <div className="mt-1 flex items-center justify-between">
              <AnimatePresence>
                {showError && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-mono"
                    style={{ color: '#ef4444' }}
                  >
                    {remaining} more character{remaining !== 1 ? 's' : ''} needed
                  </motion.span>
                )}
                {!showError && isValid && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-mono"
                    style={{ color: '#22c55e' }}
                  >
                    ✓ Ready
                  </motion.span>
                )}
                {!showError && !isValid && <span />}
              </AnimatePresence>
              <span className="text-xs" style={{ color: charCount >= MIN_CHARS ? '#22c55e60' : '#475569' }}>
                {charCount} / {MIN_CHARS}+
              </span>
            </div>
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs tracking-widest mb-2" style={{ color: '#64748b' }}>
                CURRENT ROLE
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Senior PM at Google"
                className="w-full rounded border px-3 py-2 text-sm outline-none transition-colors font-mono placeholder:opacity-30 focus:border-amber-500"
                style={{ backgroundColor: '#0a0e17', borderColor: '#1e293b', color: '#e2e8f0' }}
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest mb-2" style={{ color: '#64748b' }}>
                YEARS OF EXPERIENCE
              </label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g., 8 years"
                className="w-full rounded border px-3 py-2 text-sm outline-none transition-colors font-mono placeholder:opacity-30 focus:border-amber-500"
                style={{ backgroundColor: '#0a0e17', borderColor: '#1e293b', color: '#e2e8f0' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs tracking-widest mb-2" style={{ color: '#64748b' }}>
              KEY PRIORITIES
            </label>
            <input
              type="text"
              value={priorities}
              onChange={(e) => setPriorities(e.target.value)}
              placeholder="e.g., financial security, title growth, work-life balance"
              className="w-full rounded border px-3 py-2 text-sm outline-none transition-colors font-mono placeholder:opacity-30 focus:border-amber-500"
              style={{ backgroundColor: '#0a0e17', borderColor: '#1e293b', color: '#e2e8f0' }}
            />
          </div>

          {/* Submit button */}
          <motion.button
            onClick={handleSubmit}
            whileHover={isValid ? { scale: 1.02 } : { scale: 1 }}
            whileTap={isValid ? { scale: 0.98 } : {}}
            className="w-full py-4 rounded font-orbitron font-bold text-sm tracking-[0.25em] transition-all duration-300"
            style={isValid ? {
              backgroundColor: '#d4a853',
              color: '#0a0e17',
              animation: 'pulse_glow 2.5s ease-in-out infinite',
              cursor: 'pointer',
            } : {
              backgroundColor: '#1e293b',
              color: '#64748b',
              cursor: 'not-allowed',
              opacity: showError ? 1 : 0.5,
              boxShadow: showError ? '0 0 0 1px #ef4444' : 'none',
            }}
          >
            ▶ INITIATE WAR ROOM
          </motion.button>

          <p className="text-center text-xs" style={{ color: '#475569' }}>
            ~45 seconds to complete 3 debate rounds
          </p>
        </motion.div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pb-20 sm:pb-24">
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={6}
          className="text-center mb-8 sm:mb-10"
        >
          <span className="font-orbitron text-xs tracking-[0.4em]" style={{ color: '#d4a853' }}>
            PROTOCOL
          </span>
          <h2 className="font-orbitron font-bold text-xl sm:text-2xl mt-2" style={{ color: '#e2e8f0' }}>
            HOW IT WORKS
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div
              key={item.step}
              variants={fadeUp} initial="hidden" animate="visible" custom={7 + i}
              className="rounded-lg border p-5 sm:p-6 space-y-3"
              style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
            >
              <div className="flex items-center gap-3">
                <span className="font-orbitron text-xs font-bold" style={{ color: '#d4a853' }}>
                  {item.step}
                </span>
                <span className="text-2xl">{item.icon}</span>
              </div>
              <h3 className="font-orbitron font-bold text-sm tracking-wide" style={{ color: '#e2e8f0' }}>
                {item.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        variants={fadeUp} initial="hidden" animate="visible" custom={10}
        className="relative z-10 border-t py-6 text-center text-xs"
        style={{ borderColor: '#1e293b', color: '#334155' }}
      >
        <span className="font-orbitron tracking-widest">AI CAREER WAR ROOM</span>
        <span className="mx-3 opacity-30">|</span>
        <span>Powered by Claude Sonnet</span>
      </motion.footer>
    </div>
  );
}
