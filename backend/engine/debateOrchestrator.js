import { callAgent } from '../utils/claude.js';
import strategist from '../agents/strategist.js';
import contrarian from '../agents/contrarian.js';
import mentor from '../agents/mentor.js';
import datascientist from '../agents/datascientist.js';
import coach from '../agents/coach.js';
import Anthropic from '@anthropic-ai/sdk';

const AGENTS = [strategist, contrarian, mentor, datascientist, coach];

let _client;
const getClient = () => {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
};

function formatPositions(responses) {
  return responses
    .map(({ agent, emoji, content }) => {
      const c = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      return `${emoji} ${agent}:\n${c}`;
    })
    .join('\n\n');
}

async function runRound(agentMessages, round) {
  const start = Date.now();
  console.log(`[Round ${round}] Starting — ${AGENTS.length} agents in parallel`);

  const results = await Promise.all(
    AGENTS.map((agent) => callAgent(agent, agentMessages[agent.name]))
  );

  console.log(`[Round ${round}] Complete in ${Date.now() - start}ms`);
  return results;
}

export async function* runDebate(decision, context) {
  const totalStart = Date.now();

  // ─── ROUND 1: INITIAL POSITIONS ────────────────────────────────────────────
  const round1Messages = {};
  for (const agent of AGENTS) {
    round1Messages[agent.name] = [
      {
        role: 'user',
        content: `Career decision: ${decision}\nContext: ${context || 'No additional context provided.'}\n\nGive your initial position on this decision.`,
      },
    ];
  }

  const round1Results = await runRound(round1Messages, 1);

  for (const result of round1Results) {
    yield { type: 'agent_response', round: 1, ...result };
  }
  yield { type: 'round_complete', round: 1 };

  // ─── ROUND 2: CROSS-EXAMINATION ────────────────────────────────────────────
  const round1Summary = formatPositions(round1Results);

  const round2Messages = {};
  for (const agent of AGENTS) {
    round2Messages[agent.name] = [
      {
        role: 'user',
        content: `Career decision: ${decision}\nContext: ${context || 'No additional context provided.'}\n\nHere are all advisors' positions from Round 1:\n\n${round1Summary}\n\nNow:\n1) Challenge the weakest argument from another advisor\n2) Strengthen or revise your own position based on what you've heard\n3) Identify the #1 blind spot in the room that nobody has addressed`,
      },
    ];
  }

  const round2Results = await runRound(round2Messages, 2);

  for (const result of round2Results) {
    yield { type: 'agent_response', round: 2, ...result };
  }
  yield { type: 'round_complete', round: 2 };

  // ─── ROUND 3: FINAL VERDICTS ────────────────────────────────────────────────
  const round2Summary = formatPositions(round2Results);

  const round3Messages = {};
  for (const agent of AGENTS) {
    round3Messages[agent.name] = [
      {
        role: 'user',
        content: `Career decision: ${decision}\nContext: ${context || 'No additional context provided.'}\n\nHere is the full debate so far:\n\n--- ROUND 1 ---\n${round1Summary}\n\n--- ROUND 2 ---\n${round2Summary}\n\nBased on the full debate, give your FINAL verdict:\n1) One-sentence recommendation\n2) Confidence level 0-100 (include in the "confidence" field)\n3) The one thing they must not ignore`,
      },
    ];
  }

  const round3Results = await runRound(round3Messages, 3);

  for (const result of round3Results) {
    yield { type: 'agent_response', round: 3, ...result };
  }
  yield { type: 'round_complete', round: 3 };

  // ─── SYNTHESIS: WAR ROOM BRIEF ─────────────────────────────────────────────
  const synthStart = Date.now();
  console.log('[Synthesis] Starting War Room Brief');

  const round3Summary = formatPositions(round3Results);

  const synthResponse = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    temperature: 0.5,
    system: `You are a neutral synthesis engine. You have observed a structured debate between 5 expert advisors about a career decision. Your job is to produce a clear, actionable War Room Brief — not your own opinion, but a distillation of the debate.

Respond in valid JSON only:
{
  "consensusAreas": ["list of points where advisors broadly agreed"],
  "keyTensions": ["list of the sharpest disagreements that the user must resolve"],
  "decisionFramework": [
    { "condition": "If X...", "recommendation": "Then Y..." }
  ],
  "criticalFactor": "The single most important factor that should drive this decision",
  "overallLean": "Lean toward | Lean against | Genuinely split",
  "summary": "2-3 sentence plain-English summary of what the war room concluded"
}`,
    messages: [
      {
        role: 'user',
        content: `Career decision: ${decision}\nContext: ${context || 'No additional context provided.'}\n\n--- ROUND 1: INITIAL POSITIONS ---\n${round1Summary}\n\n--- ROUND 2: CROSS-EXAMINATION ---\n${round2Summary}\n\n--- ROUND 3: FINAL VERDICTS ---\n${round3Summary}\n\nProduce the War Room Brief.`,
      },
    ],
  });

  let synthContent;
  try {
    const raw = synthResponse.content[0].text;
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    synthContent = JSON.parse(cleaned);
  } catch {
    synthContent = synthResponse.content[0].text;
  }

  console.log(`[Synthesis] Complete in ${Date.now() - synthStart}ms`);
  console.log(`[Debate] Total time: ${Date.now() - totalStart}ms`);

  yield { type: 'synthesis', content: synthContent };
  yield { type: 'done' };
}
