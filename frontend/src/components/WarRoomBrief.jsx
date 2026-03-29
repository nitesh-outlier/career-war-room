import { motion } from 'framer-motion';

const AGENT_META = {
  strategist:    { emoji: '🎯', name: 'Strategist',  color: '#3b82f6' },
  contrarian:    { emoji: '😈', name: 'Contrarian',  color: '#ef4444' },
  mentor:        { emoji: '👴', name: 'Mentor',       color: '#a855f7' },
  datascientist: { emoji: '📊', name: 'Data Sci',     color: '#22c55e' },
  coach:         { emoji: '💚', name: 'Coach',         color: '#f59e0b' },
};

const AGENT_ORDER = ['strategist', 'contrarian', 'mentor', 'datascientist', 'coach'];

// Stagger variants
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

// ── Consensus meter ───────────────────────────────────────────────────────────
function ConsensusMeter({ agents }) {
  const scores = AGENT_ORDER.map((key) => {
    const r3 = agents?.[key]?.round3?.content;
    if (!r3 || typeof r3 !== 'object') return null;
    return typeof r3.confidence === 'number' ? r3.confidence : null;
  }).filter((v) => v !== null);

  if (scores.length === 0) return null;

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Consensus = how aligned the scores are (low std dev = high consensus)
  const variance = scores.reduce((a, b) => a + (b - avg) ** 2, 0) / scores.length;
  const stdDev   = Math.sqrt(variance);
  // Map stdDev 0→25 as "strong→low" consensus
  const consensusPct = Math.max(0, Math.min(100, Math.round(100 - (stdDev / 30) * 100)));

  const label =
    consensusPct >= 70 ? 'STRONG CONSENSUS' :
    consensusPct >= 40 ? 'MODERATE CONSENSUS' : 'LOW CONSENSUS';

  const barColor =
    consensusPct >= 70 ? '#22c55e' :
    consensusPct >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <motion.div variants={item} className="space-y-2">
      <div className="flex items-center justify-between">
        <SectionLabel>ADVISOR ALIGNMENT</SectionLabel>
        <span className="font-orbitron text-xs tracking-widest" style={{ color: barColor }}>
          {label}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${consensusPct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <div className="flex justify-between text-[10px]" style={{ color: '#334155' }}>
        <span>SPLIT</span>
        <span>{consensusPct}% alignment</span>
        <span>UNIFIED</span>
      </div>
    </motion.div>
  );
}

// ── Advisor verdict strip ─────────────────────────────────────────────────────
function AdvisorVerdictStrip({ agents }) {
  return (
    <motion.div variants={item} className="space-y-3">
      <SectionLabel>ADVISOR VERDICTS</SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {AGENT_ORDER.map((key) => {
          const meta    = AGENT_META[key];
          const r3      = agents?.[key]?.round3?.content;
          const isObj   = r3 && typeof r3 === 'object';
          const verdict = isObj ? r3.position : (r3 ? String(r3).slice(0, 80) : '—');
          const conf    = isObj && typeof r3.confidence === 'number' ? r3.confidence : null;

          return (
            <div
              key={key}
              className="rounded-lg border p-3 space-y-2"
              style={{
                backgroundColor: `${meta.color}08`,
                borderColor: `${meta.color}25`,
                borderLeftColor: meta.color,
                borderLeftWidth: 2,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{meta.emoji}</span>
                {conf !== null && (
                  <span
                    className="font-orbitron font-bold text-xs"
                    style={{ color: meta.color }}
                  >
                    {conf}%
                  </span>
                )}
              </div>
              <div
                className="font-orbitron text-[9px] tracking-widest"
                style={{ color: meta.color }}
              >
                {meta.name}
              </div>
              <p className="text-[10px] font-mono leading-relaxed" style={{ color: '#94a3b8' }}>
                {verdict
                  ? verdict.length > 90
                    ? verdict.slice(0, 90) + '…'
                    : verdict
                  : '—'}
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Section helpers ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div className="text-[10px] font-orbitron tracking-[0.4em]" style={{ color: '#475569' }}>
      {children}
    </div>
  );
}

function BulletList({ items, bulletColor }) {
  return (
    <ul className="space-y-2 mt-2">
      {items.map((text, i) => (
        <li key={i} className="flex gap-2 text-xs font-mono" style={{ color: '#94a3b8' }}>
          <span style={{ color: bulletColor, flexShrink: 0 }}>●</span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WarRoomBrief({ synthesis, agents }) {
  if (!synthesis) return null;
  const s = typeof synthesis === 'object' ? synthesis : null;

  const leanColor =
    s?.overallLean?.toLowerCase().includes('against') ? '#ef4444' :
    s?.overallLean?.toLowerCase().includes('toward')  ? '#22c55e' : '#d4a853';

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative rounded-xl border overflow-hidden mt-8"
      style={{ backgroundColor: '#0d1219', borderColor: '#d4a853' }}
    >
      {/* CLASSIFIED watermark */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        style={{ zIndex: 0 }}
      >
        <span
          className="font-orbitron font-black text-[6rem] tracking-[0.6em] opacity-[0.025] rotate-[-25deg]"
          style={{ color: '#d4a853', userSelect: 'none' }}
        >
          CLASSIFIED
        </span>
      </div>

      {/* Header */}
      <div
        className="relative z-10 flex items-center gap-4 px-6 py-5 border-b"
        style={{ borderColor: '#1e2535', background: 'rgba(212,168,83,0.05)' }}
      >
        <div className="flex-1">
          <div
            className="font-orbitron font-black text-xl tracking-[0.3em]"
            style={{ color: '#d4a853', textShadow: '0 0 20px rgba(212,168,83,0.3)' }}
          >
            WAR ROOM BRIEF
          </div>
          <div className="text-xs font-mono mt-1" style={{ color: '#475569' }}>
            Synthesized from 3 rounds · 5 advisors · {new Date().toLocaleDateString()}
          </div>
        </div>
        {/* Gold rule */}
        <div className="hidden md:block flex-1 h-px" style={{ backgroundColor: '#d4a85330' }} />
        {s?.overallLean && (
          <div
            className="font-orbitron font-bold text-xs tracking-widest px-4 py-2 rounded border flex-shrink-0"
            style={{ color: leanColor, borderColor: `${leanColor}50`, backgroundColor: `${leanColor}10` }}
          >
            {s.overallLean.toUpperCase()}
          </div>
        )}
      </div>

      {/* Body */}
      <motion.div
        className="relative z-10 px-6 py-6 space-y-8"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Consensus meter */}
        {agents && <ConsensusMeter agents={agents} />}

        {/* Summary */}
        {s?.summary && (
          <motion.div variants={item}>
            <SectionLabel>EXECUTIVE SUMMARY</SectionLabel>
            <p className="text-sm font-mono leading-relaxed mt-2" style={{ color: '#cbd5e1' }}>
              {s.summary}
            </p>
          </motion.div>
        )}

        <div className="h-px" style={{ backgroundColor: '#1e293b' }} />

        {/* Consensus + Tensions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {s?.consensusAreas?.length > 0 && (
            <motion.div variants={item}>
              <SectionLabel>AREAS OF CONSENSUS</SectionLabel>
              <BulletList items={s.consensusAreas} bulletColor="#22c55e" />
            </motion.div>
          )}
          {s?.keyTensions?.length > 0 && (
            <motion.div variants={item}>
              <SectionLabel>KEY TENSIONS</SectionLabel>
              <BulletList items={s.keyTensions} bulletColor="#ef4444" />
            </motion.div>
          )}
        </div>

        <div className="h-px" style={{ backgroundColor: '#1e293b' }} />

        {/* Decision Framework */}
        {s?.decisionFramework?.length > 0 && (
          <motion.div variants={item} className="space-y-3">
            <SectionLabel>DECISION FRAMEWORK</SectionLabel>
            <div className="space-y-2">
              {s.decisionFramework.map((f, i) => (
                <div
                  key={i}
                  className="flex flex-wrap gap-2 items-start text-xs font-mono p-3 rounded border"
                  style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
                >
                  <span className="font-bold" style={{ color: '#2dd4bf' }}>{f.condition}</span>
                  <span style={{ color: '#475569' }}>→</span>
                  <span style={{ color: '#cbd5e1' }}>{f.recommendation}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* The One Thing */}
        {s?.criticalFactor && (
          <motion.div
            variants={item}
            className="rounded-lg border p-5"
            style={{
              backgroundColor: 'rgba(212,168,83,0.04)',
              borderColor: 'rgba(212,168,83,0.25)',
              boxShadow: '0 0 30px rgba(212,168,83,0.05)',
            }}
          >
            <SectionLabel>THE ONE THING</SectionLabel>
            <p className="text-base font-mono font-bold mt-2 leading-snug" style={{ color: '#d4a853' }}>
              {s.criticalFactor}
            </p>
          </motion.div>
        )}

        <div className="h-px" style={{ backgroundColor: '#1e293b' }} />

        {/* Advisor verdict strip */}
        <AdvisorVerdictStrip agents={agents} />

        {/* Raw fallback */}
        {!s && (
          <motion.pre variants={item} className="text-xs font-mono whitespace-pre-wrap" style={{ color: '#94a3b8' }}>
            {typeof synthesis === 'string' ? synthesis : JSON.stringify(synthesis, null, 2)}
          </motion.pre>
        )}
      </motion.div>
    </motion.div>
  );
}
