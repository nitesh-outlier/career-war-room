import { createParser } from 'eventsource-parser';

const DECISION =
  'Should I leave my stable Fortune 500 PM job for a VP Product role at a Series B AI startup?';
const CONTEXT =
  '8 years experience, current comp $200K, startup offering $180K + 0.5% equity, 40 employees, $20M ARR';

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

const c = (color, text) => `${COLORS[color]}${text}${COLORS.reset}`;

function printAgentResponse({ round, emoji, agent, content }) {
  console.log(`\n  ${emoji} ${c('bold', agent)}`);
  if (typeof content === 'string') {
    console.log(`     ${c('dim', content)}`);
  } else {
    if (content.position)     console.log(`     ${c('cyan', 'Position:')}     ${content.position}`);
    if (content.keyArgument)  console.log(`     ${c('yellow', 'Key Arg:')}      ${content.keyArgument}`);
    if (content.blindSpot)    console.log(`     ${c('magenta', 'Blind Spot:')}   ${content.blindSpot}`);
    if (content.confidence != null) console.log(`     ${c('green', 'Confidence:')}   ${content.confidence}%`);
  }
}

function printSynthesis(content) {
  console.log(c('bold', '\n╔══════════════════════════════════════════════╗'));
  console.log(c('bold', '║           WAR ROOM BRIEF                     ║'));
  console.log(c('bold', '╚══════════════════════════════════════════════╝'));

  if (typeof content === 'string') {
    console.log(content);
    return;
  }

  if (content.overallLean) {
    console.log(`\n  ${c('bold', 'Overall Lean:')} ${c('green', content.overallLean)}`);
  }
  if (content.summary) {
    console.log(`\n  ${c('bold', 'Summary:')}\n  ${content.summary}`);
  }
  if (content.consensusAreas?.length) {
    console.log(`\n  ${c('bold', 'Consensus:')}`);
    content.consensusAreas.forEach((a) => console.log(`    • ${a}`));
  }
  if (content.keyTensions?.length) {
    console.log(`\n  ${c('bold', 'Key Tensions:')}`);
    content.keyTensions.forEach((t) => console.log(`    ⚡ ${t}`));
  }
  if (content.decisionFramework?.length) {
    console.log(`\n  ${c('bold', 'Decision Framework:')}`);
    content.decisionFramework.forEach(({ condition, recommendation }) =>
      console.log(`    ${c('cyan', condition)} → ${recommendation}`)
    );
  }
  if (content.criticalFactor) {
    console.log(`\n  ${c('bold', 'Critical Factor:')} ${c('yellow', content.criticalFactor)}`);
  }
}

async function main() {
  console.log(c('bold', '\n🔥 AI CAREER WAR ROOM — DEBATE TEST\n'));
  console.log(`  ${c('cyan', 'Decision:')} ${DECISION}`);
  console.log(`  ${c('cyan', 'Context:')}  ${CONTEXT}\n`);

  const totalStart = Date.now();
  let roundStart = Date.now();
  let currentRound = 0;

  const res = await fetch('http://localhost:3001/api/debate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: DECISION, context: CONTEXT }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(c('red', `Request failed: ${res.status} ${err}`));
    process.exit(1);
  }

  const parser = createParser({ onEvent: (event) => {
    if (!event.data) return;
    const data = event.data;

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }

    const { type, round } = parsed;

    if (type === 'agent_response') {
      if (round !== currentRound) {
        currentRound = round;
        roundStart = Date.now();
        console.log(c('bold', `\n━━━ ROUND ${round} ` + ('─').repeat(40)));
      }
      printAgentResponse(parsed);
    }

    if (type === 'round_complete') {
      const elapsed = ((Date.now() - roundStart) / 1000).toFixed(1);
      console.log(c('dim', `\n  ✓ Round ${round} complete in ${elapsed}s`));
    }

    if (type === 'synthesis') {
      printSynthesis(parsed.content);
    }

    if (type === 'done') {
      const total = ((Date.now() - totalStart) / 1000).toFixed(1);
      console.log(c('green', `\n✅ Debate complete in ${total}s total\n`));
    }

    if (type === 'error') {
      console.error(c('red', `\n❌ Server error: ${parsed.message}`));
    }
  } });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.feed(decoder.decode(value, { stream: true }));
  }
}

main().catch((err) => {
  console.error(c('red', `\n❌ Fatal: ${err.message}`));
  process.exit(1);
});
