import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Model selection by round
const MODELS = {
  round1: "claude-haiku-4-5-20251001",    // Cheaper for initial positions
  round2: "claude-sonnet-4-20250514",      // Better reasoning for cross-exam
  synthesis: "claude-sonnet-4-20250514",
};

// Pricing per million tokens
const PRICING = {
  "claude-haiku-4-5-20251001": { input: 0.80, output: 4.0, cacheWrite: 1.0, cacheRead: 0.08 },
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0, cacheWrite: 3.75, cacheRead: 0.30 },
};

/**
 * Call a single agent with prompt caching enabled
 */
export async function callAgent(agentConfig, messages, options = {}) {
  const model = options.model || MODELS.round1;
  const maxRetries = 1;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: options.maxTokens || 300,
        temperature: agentConfig.temperature,
        system: [
          {
            type: "text",
            text: agentConfig.systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages,
      }, {
        headers: {
          "anthropic-beta": "token-efficient-tools-2025-02-19",
        },
      });

      const rawText = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");

      let parsed;
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { position: rawText };
      } catch {
        parsed = { position: rawText, parseError: true };
      }

      const cost = logCost(response.usage, model);

      return {
        agent: agentConfig.name,
        emoji: agentConfig.emoji,
        color: agentConfig.color,
        content: parsed,
        usage: response.usage,
        cost,
      };
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries && (error.status === 529 || error.status === 429)) {
        console.log(`Rate limited, retrying in 2s... (${agentConfig.name})`);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Call synthesis (no specific agent, uses Sonnet)
 */
export async function callSynthesis(messages) {
  const model = MODELS.synthesis;
  const response = await client.messages.create({
    model,
    max_tokens: 500,
    temperature: 0.5,
    system: [
      {
        type: "text",
        text: `You synthesize multi-advisor career debates into actionable briefs.
Respond in JSON: {consensus: string[], tensions: string[], framework: string[], criticalFactor: string}
Be specific and reference advisors by name.`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
  });

  const rawText = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  let parsed;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: rawText };
  } catch {
    parsed = { raw: rawText };
  }

  const cost = logCost(response.usage, model);
  return { content: parsed, usage: response.usage, cost };
}

function logCost(usage, model) {
  const pricing = PRICING[model] || PRICING["claude-sonnet-4-20250514"];
  const inputCost = (usage.input_tokens / 1_000_000) * pricing.input;
  const outputCost = (usage.output_tokens / 1_000_000) * pricing.output;
  const cacheReadCost = ((usage.cache_read_input_tokens || 0) / 1_000_000) * pricing.cacheRead;
  const cacheWriteCost = ((usage.cache_creation_input_tokens || 0) / 1_000_000) * pricing.cacheWrite;
  const totalCost = inputCost + outputCost + cacheReadCost + cacheWriteCost;

  console.log(
    `  💰 ${model.split("-").slice(1, 3).join("-")}: $${totalCost.toFixed(5)} ` +
    `(in:${usage.input_tokens} out:${usage.output_tokens} ` +
    `cached:${usage.cache_read_input_tokens || 0})`
  );

  return totalCost;
}

export { MODELS };
