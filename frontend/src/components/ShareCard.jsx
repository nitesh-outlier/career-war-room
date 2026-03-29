import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AGENT_ORDER = ['strategist', 'contrarian', 'mentor', 'datascientist', 'coach'];
const AGENT_META = {
  strategist:    { emoji: '🎯', name: 'Strategist',     color: '#3b82f6' },
  contrarian:    { emoji: '😈', name: 'Contrarian',     color: '#ef4444' },
  mentor:        { emoji: '👴', name: 'Mentor',          color: '#a855f7' },
  datascientist: { emoji: '📊', name: 'Data Scientist',  color: '#22c55e' },
  coach:         { emoji: '💚', name: 'Coach',            color: '#f59e0b' },
};

// ── Consensus calculation (same logic as WarRoomBrief) ───────────────────────
function calcConsensus(agents) {
  const scores = AGENT_ORDER.map((key) => {
    const r3 = agents?.[key]?.round3?.content;
    return r3 && typeof r3 === 'object' && typeof r3.confidence === 'number'
      ? r3.confidence : null;
  }).filter((v) => v !== null);

  if (!scores.length) return null;
  const avg      = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + (b - avg) ** 2, 0) / scores.length;
  const stdDev   = Math.sqrt(variance);
  return Math.max(0, Math.min(100, Math.round(100 - (stdDev / 30) * 100)));
}

function getVerdict(agents, key) {
  const r3 = agents?.[key]?.round3?.content;
  if (!r3) return '—';
  if (typeof r3 === 'object' && r3.position) return r3.position;
  return String(r3).slice(0, 120);
}

function getBlindSpot(agents) {
  // Use the Contrarian's blind spot as the most provocative
  const r3 = agents?.contrarian?.round3?.content;
  if (r3 && typeof r3 === 'object' && r3.blindSpot) return r3.blindSpot;
  // Fallback: first available blind spot
  for (const key of AGENT_ORDER) {
    const c = agents?.[key]?.round3?.content;
    if (c && typeof c === 'object' && c.blindSpot) return c.blindSpot;
  }
  return 'Unknown';
}

// ── OG Image Card (hidden, captured by html2canvas) ──────────────────────────
function OGCard({ cardRef, decision, agents, consensusPct }) {
  const truncated = decision.length > 100 ? decision.slice(0, 97) + '…' : decision;

  return (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: '1200px',
        height: '630px',
        backgroundColor: '#0a0e17',
        border: '3px solid #d4a853',
        borderRadius: '12px',
        fontFamily: "'JetBrains Mono', monospace",
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 52px',
        boxSizing: 'border-box',
      }}
    >
      {/* Corner accents */}
      {[
        { top: 0, left: 0, borderTop: '3px solid #d4a853', borderLeft: '3px solid #d4a853' },
        { top: 0, right: 0, borderTop: '3px solid #d4a853', borderRight: '3px solid #d4a853' },
        { bottom: 0, left: 0, borderBottom: '3px solid #d4a853', borderLeft: '3px solid #d4a853' },
        { bottom: 0, right: 0, borderBottom: '3px solid #d4a853', borderRight: '3px solid #d4a853' },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...s }} />
      ))}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: '0.3em', color: '#d4a853' }}>
          AI CAREER WAR ROOM
        </div>
        {consensusPct !== null && (
          <div style={{
            fontFamily: "'Orbitron', sans-serif", fontSize: 12, letterSpacing: '0.2em',
            color: consensusPct >= 70 ? '#22c55e' : consensusPct >= 40 ? '#f59e0b' : '#ef4444',
            border: `1px solid ${consensusPct >= 70 ? '#22c55e50' : consensusPct >= 40 ? '#f59e0b50' : '#ef444450'}`,
            padding: '6px 14px', borderRadius: 6, backgroundColor: '#111827',
          }}>
            {consensusPct}% CONSENSUS
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: '#1e293b', marginBottom: 24 }} />

      {/* Decision */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.4em', color: '#475569', marginBottom: 8, fontFamily: "'Orbitron', sans-serif" }}>
          DECISION UNDER REVIEW
        </div>
        <div style={{ fontSize: 18, color: '#e2e8f0', lineHeight: 1.4, fontWeight: 500 }}>
          {truncated}
        </div>
      </div>

      {/* Advisors grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, flex: 1 }}>
        {AGENT_ORDER.map((key) => {
          const meta    = AGENT_META[key];
          const verdict = getVerdict(agents, key);
          const short   = verdict.length > 90 ? verdict.slice(0, 87) + '…' : verdict;
          const r3      = agents?.[key]?.round3?.content;
          const conf    = r3 && typeof r3 === 'object' ? r3.confidence : null;

          return (
            <div key={key} style={{
              backgroundColor: '#111827',
              border: `1px solid ${meta.color}30`,
              borderLeft: `3px solid ${meta.color}`,
              borderRadius: 8,
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 18 }}>{meta.emoji}</span>
                {conf !== null && (
                  <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, color: meta.color, fontWeight: 700 }}>
                    {conf}%
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 9, color: meta.color, letterSpacing: '0.15em', fontWeight: 700 }}>
                {meta.name.toUpperCase()}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.5 }}>
                {short}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid #1e293b' }}>
        <div style={{ fontSize: 11, color: '#475569', letterSpacing: '0.15em' }}>
          5 AI ADVISORS · 3 ROUNDS · 1 DECISION
        </div>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, color: '#d4a853', opacity: 0.7 }}>
          Built with AI — Try it free
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{    opacity: 0, y: -8, scale: 0.95 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg border font-mono text-sm"
          style={{ backgroundColor: '#111827', borderColor: '#22c55e', color: '#22c55e' }}
        >
          ✓ {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ShareCard({ decision, agents, synthesis }) {
  const cardRef      = useRef(null);
  const [toast, setToast] = useState('');

  const consensusPct = calcConsensus(agents);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  // ── Download PNG ────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    const html2canvas = (await import('html2canvas')).default;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0e17',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = 'war-room-brief.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Image downloaded!');
    } catch (err) {
      console.error('html2canvas error:', err);
      showToast('Download failed — try again');
    }
  };

  // ── Copy LinkedIn post ───────────────────────────────────────────────────────
  const handleCopyLinkedIn = () => {
    const verdicts = AGENT_ORDER.map((key) => {
      const meta    = AGENT_META[key];
      const verdict = getVerdict(agents, key);
      const short   = verdict.length > 100 ? verdict.slice(0, 97) + '…' : verdict;
      return `${meta.emoji} ${meta.name}: ${short}`;
    }).join('\n');

    const blindSpot = getBlindSpot(agents);
    const shortBlind = blindSpot.length > 120 ? blindSpot.slice(0, 117) + '…' : blindSpot;
    const consensusLine = consensusPct !== null ? `${consensusPct}%` : 'N/A';

    const post = `🎖️ I ran my career decision through an AI War Room.

5 AI advisors debated across 3 rounds:
${verdicts}

Consensus: ${consensusLine}
The biggest blind spot they found: ${shortBlind}

Try it yourself: ${import.meta.env.VITE_APP_URL ?? window.location.origin}

#AI #CareerAdvice #ProductManagement`;

    navigator.clipboard.writeText(post).then(() => {
      showToast('Copied to clipboard!');
    }).catch(() => {
      showToast('Copy failed — try again');
    });
  };

  return (
    <>
      {/* Hidden OG card for html2canvas */}
      <OGCard
        cardRef={cardRef}
        decision={decision}
        agents={agents}
        consensusPct={consensusPct}
      />

      {/* Share actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border p-5"
        style={{ backgroundColor: '#111827', borderColor: '#1e293b' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg">📤</span>
          <span className="font-orbitron text-xs tracking-[0.3em]" style={{ color: '#d4a853' }}>
            SHARE YOUR RESULTS
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Download PNG */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded border text-xs font-orbitron tracking-widest transition-colors"
            style={{ borderColor: '#d4a853', color: '#d4a853', backgroundColor: 'rgba(212,168,83,0.06)' }}
          >
            <span>⬇</span> DOWNLOAD IMAGE
          </motion.button>

          {/* Copy LinkedIn */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCopyLinkedIn}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded border text-xs font-orbitron tracking-widest transition-colors"
            style={{ borderColor: '#2dd4bf', color: '#2dd4bf', backgroundColor: 'rgba(45,212,191,0.06)' }}
          >
            <span>🔗</span> COPY LINKEDIN POST
          </motion.button>
        </div>
      </motion.div>

      <Toast message={toast} />
    </>
  );
}
