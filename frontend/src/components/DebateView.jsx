import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebateStream } from '../hooks/useDebateStream.js';
import AdvisorCard from './AdvisorCard.jsx';
import RoundAnnouncement from './RoundAnnouncement.jsx';
import WarRoomBrief from './WarRoomBrief.jsx';
import ShareCard from './ShareCard.jsx';

const AGENT_CONFIGS = {
  strategist:    { name: 'The Strategist',    role: 'McKinsey Partner',    emoji: '🎯', color: '#3b82f6' },
  contrarian:    { name: 'The Contrarian',    role: "Devil's Advocate",    emoji: '😈', color: '#ef4444' },
  mentor:        { name: 'The Mentor',        role: 'Seasoned Executive',  emoji: '👴', color: '#a855f7' },
  datascientist: { name: 'The Data Scientist',role: 'Quant Analyst',       emoji: '📊', color: '#22c55e' },
  coach:         { name: 'The Coach',         role: 'Executive Coach',     emoji: '💚', color: '#f59e0b' },
};
const AGENT_ORDER = ['strategist', 'contrarian', 'mentor', 'datascientist', 'coach'];

// ── Round progress bar ────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'ROUND 1', sub: 'Initial' },
  { id: 2, label: 'ROUND 2', sub: 'Cross-Ex' },
  { id: 3, label: 'ROUND 3', sub: 'Verdicts' },
  { id: 4, label: 'BRIEF',   sub: 'Synthesis' },
];

function RoundProgressBar({ currentRound, synthesis, isLoading }) {
  const activeStep = currentRound < 3 ? currentRound : 3;

  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-xl mx-auto">
      {STEPS.map((step, i) => {
        const isDone   = i < activeStep || (i === 3 && synthesis && !isLoading);
        const isActive = i === activeStep;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <motion.div
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-orbitron font-bold border-2 transition-all duration-300"
                style={{
                  backgroundColor: isDone ? '#22c55e' : isActive ? '#d4a853' : '#1e293b',
                  borderColor:     isDone ? '#22c55e' : isActive ? '#d4a853' : '#334155',
                  color:           isDone ? '#0a0e17' : isActive ? '#0a0e17' : '#64748b',
                }}
              >
                {isDone ? '✓' : i + 1}
              </motion.div>
              <div className="mt-1 text-center">
                <div
                  className="font-orbitron text-[8px] sm:text-[9px] tracking-wider leading-tight"
                  style={{ color: isActive ? '#d4a853' : isDone ? '#22c55e' : '#475569' }}
                >
                  {step.label}
                </div>
                <div className="text-[7px] sm:text-[8px] leading-tight mt-0.5 hidden sm:block" style={{ color: '#334155' }}>
                  {step.sub}
                </div>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <motion.div
                className="flex-1 h-px mx-1 mb-5 sm:mb-6"
                style={{ backgroundColor: i < activeStep ? '#22c55e' : '#1e293b' }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Status label ──────────────────────────────────────────────────────────────
const STATUS_MESSAGES = [
  'Assembling your board of advisors...',
  'Round 1 underway — initial positions being formed...',
  'Round 2 underway — advisors cross-examining each other...',
  'Round 3 underway — final verdicts being locked in...',
  'Generating War Room Brief...',
];

function StatusLabel({ isLoading, currentRound, displayRound }) {
  if (!isLoading) return null;
  const msg = currentRound === 0 && displayRound === 1
    ? STATUS_MESSAGES[0]
    : currentRound < 3
    ? STATUS_MESSAGES[currentRound + 1]
    : STATUS_MESSAGES[4];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={msg}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="text-center"
      >
        <span className="font-orbitron text-[10px] sm:text-xs tracking-[0.3em]" style={{ color: '#475569' }}>
          {msg}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorState({ error, onRetry }) {
  const isConnectionError = error?.toLowerCase().includes('connect') || error?.toLowerCase().includes('fetch');
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border p-5 sm:p-6 space-y-4"
      style={{ backgroundColor: '#1a0a0a', borderColor: '#7f1d1d' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">⚠️</span>
        <div className="space-y-1 min-w-0">
          <div className="font-orbitron text-xs tracking-widest" style={{ color: '#ef4444' }}>
            CONNECTION ERROR
          </div>
          <p className="text-sm font-mono leading-relaxed" style={{ color: '#fca5a5' }}>
            {isConnectionError
              ? 'Failed to connect to the War Room server. Is the backend running on port 3001?'
              : error}
          </p>
          {isConnectionError && (
            <p className="text-xs font-mono mt-1" style={{ color: '#64748b' }}>
              Run: <code className="px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1e293b', color: '#2dd4bf' }}>cd backend && npm run dev</code>
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onRetry}
        className="w-full sm:w-auto px-5 py-2.5 rounded border font-orbitron text-xs tracking-widest transition-all hover:bg-red-950"
        style={{ borderColor: '#7f1d1d', color: '#ef4444' }}
      >
        ↺ RETRY
      </button>
    </motion.div>
  );
}

// ── Main DebateView ───────────────────────────────────────────────────────────
export default function DebateView({ decision, context, onReset }) {
  const { agents, currentRound, synthesis, isLoading, error, startDebate } =
    useDebateStream();

  const [announcedRound, setAnnouncedRound] = useState(null);
  const [prevRound, setPrevRound]           = useState(0);
  const briefRef = useRef(null);

  // Start debate on mount
  useEffect(() => {
    startDebate(decision, context);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger round announcements
  useEffect(() => {
    if (currentRound > prevRound && currentRound < 3) {
      setAnnouncedRound(currentRound + 1);
    }
    setPrevRound(currentRound);
  }, [currentRound]); // eslint-disable-line react-hooks/exhaustive-deps

  // Smooth scroll to brief when synthesis arrives
  useEffect(() => {
    if (synthesis && briefRef.current) {
      setTimeout(() => {
        briefRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }, [synthesis]);

  const dismissAnnouncement = useCallback(() => setAnnouncedRound(null), []);
  const handleRetry         = useCallback(() => startDebate(decision, context), [decision, context, startDebate]);

  // Which round's data to show
  const displayRound  = isLoading ? Math.min(currentRound + 1, 3) : 3;
  const isFirstRound  = currentRound === 0 && isLoading;
  const isAgentActive = (key) => isLoading && !agents[key][`round${displayRound}`];

  return (
    <div className="min-h-screen font-mono text-war-text" style={{ backgroundColor: '#0a0e17' }}>
      <RoundAnnouncement round={announcedRound} onDismiss={dismissAnnouncement} />

      {/* Top bar */}
      <div
        className="sticky top-0 z-30 border-b px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4"
        style={{ backgroundColor: '#0a0e17ee', backdropFilter: 'blur(8px)', borderColor: '#1e293b' }}
      >
        <button
          onClick={onReset}
          className="text-xs font-orbitron tracking-widest transition-colors hover:text-war-amber flex-shrink-0"
          style={{ color: '#475569' }}
        >
          ← EXIT
        </button>
        <div className="w-px h-4 flex-shrink-0" style={{ backgroundColor: '#1e293b' }} />
        <span className="font-orbitron text-xs tracking-[0.2em] sm:tracking-[0.3em] truncate" style={{ color: '#d4a853' }}>
          WAR ROOM ACTIVE
        </span>
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {isLoading && (
            <motion.span
              className="w-2 h-2 rounded-full bg-amber-400"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
          {!isLoading && !error && synthesis && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-orbitron tracking-widest"
              style={{ color: '#22c55e' }}
            >
              ✓ COMPLETE
            </motion.span>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Decision summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border px-4 sm:px-5 py-3 sm:py-4"
          style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
        >
          <div className="text-[10px] tracking-[0.4em] font-orbitron mb-1" style={{ color: '#475569' }}>
            DECISION UNDER REVIEW
          </div>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#e2e8f0' }}>
            {decision}
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <RoundProgressBar currentRound={currentRound} synthesis={synthesis} isLoading={isLoading} />
        </motion.div>

        {/* Status message */}
        <StatusLabel isLoading={isLoading} currentRound={currentRound} displayRound={displayRound} />

        {/* Error */}
        <AnimatePresence>
          {error && <ErrorState error={error} onRetry={handleRetry} />}
        </AnimatePresence>

        {/* Agent grid: 3+2 layout, stacks on mobile */}
        {!error && (
          <div className="space-y-3 sm:space-y-4">
            {/* Row 1 — 3 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {AGENT_ORDER.slice(0, 3).map((key, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                >
                  <AdvisorCard
                    config={AGENT_CONFIGS[key]}
                    roundData={agents[key][`round${displayRound}`]}
                    displayRound={displayRound}
                    isActive={isAgentActive(key)}
                    isFirstRound={isFirstRound}
                  />
                </motion.div>
              ))}
            </div>
            {/* Row 2 — 2 cards, centered on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:w-2/3 md:mx-auto">
              {AGENT_ORDER.slice(3).map((key, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.31 + i * 0.07 }}
                >
                  <AdvisorCard
                    config={AGENT_CONFIGS[key]}
                    roundData={agents[key][`round${displayRound}`]}
                    displayRound={displayRound}
                    isActive={isAgentActive(key)}
                    isFirstRound={isFirstRound}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* War Room Brief */}
        {synthesis && (
          <div ref={briefRef}>
            <WarRoomBrief synthesis={synthesis} agents={agents} />
          </div>
        )}

        {/* Share card */}
        {synthesis && (
          <ShareCard decision={decision} agents={agents} synthesis={synthesis} />
        )}

        {/* Start New Debate CTA */}
        {synthesis && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-lg border p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
          >
            <div>
              <div className="font-orbitron text-xs tracking-widest mb-1" style={{ color: '#d4a853' }}>
                ANOTHER DECISION TO STRESS-TEST?
              </div>
              <p className="text-xs font-mono" style={{ color: '#64748b' }}>
                Bring a new career dilemma to the War Room.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onReset}
              className="w-full sm:w-auto font-orbitron font-bold text-xs tracking-[0.25em] px-6 py-3 rounded transition-all duration-200 flex-shrink-0"
              style={{ backgroundColor: '#d4a853', color: '#0a0e17' }}
            >
              ▶ START NEW DEBATE
            </motion.button>
          </motion.div>
        )}

        {/* Error state retry / exit — if never got results */}
        {error && !synthesis && (
          <div className="flex justify-center pb-8">
            <button
              onClick={onReset}
              className="font-orbitron text-xs tracking-[0.3em] px-6 py-3 rounded border transition-all hover:border-war-amber hover:text-war-amber"
              style={{ borderColor: '#1e293b', color: '#475569' }}
            >
              ← BACK TO LANDING
            </button>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="pb-8" />
      </div>
    </div>
  );
}
