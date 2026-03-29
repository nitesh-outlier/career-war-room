import Anthropic from '@anthropic-ai/sdk';

let client;
const getClient = () => {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseJSON(text) {
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(cleaned);
}

async function attempt(agentConfig, messages) {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    system: agentConfig.systemPrompt,
    temperature: agentConfig.temperature,
    messages,
  });

  const raw = response.content[0].text;

  let content;
  try {
    content = parseJSON(raw);
  } catch {
    content = raw;
  }

  return {
    agent: agentConfig.name,
    emoji: agentConfig.emoji,
    content,
  };
}

export async function callAgent(agentConfig, messages) {
  try {
    return await attempt(agentConfig, messages);
  } catch (err) {
    console.warn(`[callAgent] First attempt failed for ${agentConfig.name}: ${err.message}. Retrying in 2s...`);
    await sleep(2000);
    return await attempt(agentConfig, messages);
  }
}
