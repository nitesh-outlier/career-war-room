import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Circular SVG confidence ring
function ConfidenceBadge({ value, color }) {
  const r    = 20;
  const circ = 2 * Math.PI * r;

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
        <motion.circle
          cx="28" cy="28" r={r}
          fill="none" stroke={color}
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (value / 100) * circ }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      <span className="absolute font-orbitron font-bold text-xs" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

// Skeleton loader bars
function SkeletonContent() {
  return (
    <div className="space-y-3 py-2">
      {[100, 75, 90].map((w, i) => (
        <div key={i} className="space-y-1">
          <div className="h-1.5 w-12 rounded" style={{ backgroundColor: '#1e293b' }} />
          <motion.div
            className="h-2.5 rounded"
            style={{ width: `${w}%`, backgroundColor: '#1e293b' }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15 }}
          />
          {i === 1 && (
            <motion.div
              className="h-2.5 rounded w-2/3"
              style={{ backgroundColor: '#1e293b' }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: 0.25 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Pulsing thinking dots
function ThinkingDots({ color }) {
  return (
    <div className="flex items-center gap-1.5 py-4">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function Field({ label, value, color }) {
  if (!value && value !== 0) return null;
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] tracking-widest font-mono" style={{ color: `${color}80` }}>
        {label}
      </div>
      <div className="text-xs leading-relaxed font-mono" style={{ color: '#cbd5e1' }}>
        {String(value)}
      </div>
    </div>
  );
}

export default function AdvisorCard({ config, roundData, displayRound, isActive, isFirstRound }) {
  const { color, emoji, name, role } = config;

  const hasData    = !!roundData;
  const state      = hasData ? 'complete' : isActive ? 'thinking' : 'waiting';
  const content    = roundData?.content;
  const isObj      = content && typeof content === 'object';
  const confidence = isObj ? content.confidence : null;

  // Glow flash when content first arrives
  const [justArrived, setJustArrived] = useState(false);
  useEffect(() => {
    if (hasData) {
      setJustArrived(true);
      const id = setTimeout(() => setJustArrived(false), 1200);
      return () => clearTimeout(id);
    }
  }, [hasData]);

  return (
    <motion.div
      whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
      animate={justArrived ? {
        boxShadow: [`0 0 0px ${color}00`, `0 0 20px ${color}60`, `0 0 0px ${color}00`],
      } : { boxShadow: `0 0 0px ${color}00` }}
      transition={justArrived ? { duration: 1.2, ease: 'easeOut' } : {}}
      className="relative rounded-lg border overflow-hidden flex flex-col"
      style={{
        backgroundColor: '#111827',
        borderColor: '#1e293b',
        borderLeftColor: color,
        borderLeftWidth: 3,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 sm:px-4 py-3 border-b"
        style={{ borderColor: '#1e293b' }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-lg sm:text-xl flex-shrink-0">{emoji}</span>
          <div className="min-w-0">
            <div className="font-orbitron font-bold text-[11px] sm:text-xs tracking-wide truncate" style={{ color }}>
              {name}
            </div>
            <div className="text-[9px] sm:text-[10px] tracking-widest mt-0.5 truncate" style={{ color: '#475569' }}>
              {role}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-1">
          {state === 'waiting' && (
            <motion.span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: '#334155' }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          {state === 'thinking' && (
            <motion.span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
          )}
          {state === 'complete' && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs flex-shrink-0"
              style={{ color: '#22c55e' }}
            >
              ✓
            </motion.span>
          )}
          {displayRound && (
            <span className="font-orbitron text-[9px] sm:text-[10px] tracking-widest" style={{ color: '#334155' }}>
              R{displayRound}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-3 sm:px-4 py-3 flex-1 min-h-[110px] sm:min-h-[120px]">
        <AnimatePresence mode="wait">

          {/* Skeleton — first round, no data yet, not active */}
          {state === 'waiting' && isFirstRound && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SkeletonContent />
            </motion.div>
          )}

          {/* Plain waiting */}
          {state === 'waiting' && !isFirstRound && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 py-4"
            >
              <span className="text-xs" style={{ color: '#334155' }}>STANDING BY...</span>
            </motion.div>
          )}

          {state === 'thinking' && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ThinkingDots color={color} />
            </motion.div>
          )}

          {state === 'complete' && (
            <motion.div
              key={`content-r${displayRound}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="space-y-3"
            >
              {isObj ? (
                <>
                  <Field label="POSITION"     value={content.position}    color={color} />
                  <Field label="KEY ARGUMENT" value={content.keyArgument} color={color} />
                  <Field label="BLIND SPOT"   value={content.blindSpot}   color={color} />
                </>
              ) : (
                <div className="text-xs leading-relaxed font-mono" style={{ color: '#cbd5e1' }}>
                  {String(content)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confidence badge — Round 3 only */}
      <AnimatePresence>
        {state === 'complete' && confidence != null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="absolute top-3 right-10 sm:right-12"
          >
            <ConfidenceBadge value={confidence} color={color} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
