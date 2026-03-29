import { useState, useCallback } from 'react';

const AGENT_KEY_MAP = {
  'The Strategist':    'strategist',
  'The Contrarian':    'contrarian',
  'The Mentor':        'mentor',
  'The Data Scientist':'datascientist',
  'The Coach':         'coach',
};

const emptyAgents = () => ({
  strategist:    { round1: null, round2: null, round3: null },
  contrarian:    { round1: null, round2: null, round3: null },
  mentor:        { round1: null, round2: null, round3: null },
  datascientist: { round1: null, round2: null, round3: null },
  coach:         { round1: null, round2: null, round3: null },
});

export function useDebateStream() {
  const [agents, setAgents]             = useState(emptyAgents);
  const [currentRound, setCurrentRound] = useState(0);
  const [synthesis, setSynthesis]       = useState(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState(null);

  const handleEvent = useCallback((event) => {
    const { type, round, agent: agentName, emoji, content } = event;

    if (type === 'agent_response') {
      const key = AGENT_KEY_MAP[agentName];
      if (!key) return;
      setAgents((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [`round${round}`]: { agent: agentName, emoji, content },
        },
      }));
    }

    if (type === 'round_complete') {
      setCurrentRound(round);
    }

    if (type === 'synthesis') {
      setSynthesis(content);
    }

    if (type === 'done') {
      setIsLoading(false);
    }

    if (type === 'error') {
      setError(event.message ?? 'Unknown error from server');
      setIsLoading(false);
    }
  }, []);

  const startDebate = useCallback(async (decision, context) => {
    // Reset state
    setAgents(emptyAgents());
    setCurrentRound(0);
    setSynthesis(null);
    setError(null);
    setIsLoading(true);

    let res;
    try {
      const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
      res = await fetch(`${API_BASE}/api/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, context }),
      });
    } catch (err) {
      setError(`Failed to connect to server: ${err.message}`);
      setIsLoading(false);
      return;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      setError(`Server error ${res.status}: ${text}`);
      setIsLoading(false);
      return;
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by double newlines
        const frames = buffer.split('\n\n');
        buffer = frames.pop(); // last chunk may be incomplete

        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith('data:')) continue;
          const json = line.slice('data:'.length).trim();
          if (!json) continue;
          try {
            handleEvent(JSON.parse(json));
          } catch {
            // malformed JSON — skip
          }
        }
      }
    } catch (err) {
      setError(`Stream error: ${err.message}`);
      setIsLoading(false);
    }
  }, [handleEvent]);

  return { agents, currentRound, synthesis, isLoading, error, startDebate };
}
