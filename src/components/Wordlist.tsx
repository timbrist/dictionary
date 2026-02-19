import React, { useEffect, useMemo, useState } from "react";

import type { WordEntry } from "../types/WordType";

type WordlistProps = {
  words?: WordEntry[];
  onDeleteWord?: (word: string) => void;
};

type OpenAIResponsesOutput = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
};

type OpenAIResponsesResponse = {
  output?: OpenAIResponsesOutput[];
};

function extractStoryText(data: OpenAIResponsesResponse): string {
  const texts: string[] = [];

  for (const block of data.output ?? []) {
    for (const part of block.content ?? []) {
      if (part.type === "output_text" && typeof part.text === "string") {
        texts.push(part.text);
      }
    }
  }

  return texts.join("\n\n").trim();
}

export default function Wordlist({ words = [], onDeleteWord }: WordlistProps) {
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWordsSet, setSelectedWordsSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedWordsSet((prev) => {
      const next = new Set<string>();
      for (const item of words) {
        if (prev.has(item.word)) next.add(item.word);
      }
      return next;
    });
  }, [words]);

  const selectedWords = useMemo(() => words.filter((item) => selectedWordsSet.has(item.word)), [selectedWordsSet, words]);

  function toggleSelection(word: string) {
    setSelectedWordsSet((prev) => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.add(word);
      }
      return next;
    });
  }

  async function generateStory() {
    if (selectedWords.length === 0) {
      setError("Select at least one word.");
      return;
    }

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    const model = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ?? "gpt-4o-mini";

    if (!apiKey) {
      setError("Missing VITE_OPENAI_API_KEY in your environment.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedWordTexts = selectedWords.map((item) => item.word);
      const prompt = [
        "Write one short, memorable story for language learners.",
        `You must naturally include these words: ${selectedWordTexts.join(", ")}.`,
        "Constraints:",
        "- 130 to 180 words",
        "- Friendly tone",
        "- Clear, simple sentences",
        "- At the end, include a bullet list explaining each selected word in one line",
      ].join("\n");

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: prompt,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`OpenAI request failed (${response.status}): ${detail}`);
      }

      const data = (await response.json()) as OpenAIResponsesResponse;
      const generated = extractStoryText(data);
      if (!generated) {
        throw new Error("OpenAI returned an empty response.");
      }

      setStory(generated);
    } catch (e) {
      setStory("");
      setError(e instanceof Error ? e.message : "Failed to generate story.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={styles.wrap}>
      <h2 style={styles.title}>Word List Story Builder</h2>
      <p style={styles.help}>Collect words from text search and image search, then generate a story from selected words.</p>

      {words.length === 0 ? (
        <p style={styles.empty}>No words yet. Add words from the other two sections above.</p>
      ) : (
        <ul style={styles.list}>
          {words.map((item) => (
            <li key={item.word} style={styles.listItem}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedWordsSet.has(item.word)}
                  onChange={() => toggleSelection(item.word)}
                />
                <span>
                  <strong>{item.word}</strong>
                  {item.meaning ? <span style={styles.meaning}> - {item.meaning}</span> : null}
                </span>
              </label>
              <div style={styles.metaRow}>
                <button type="button" style={styles.deleteButton} onClick={() => onDeleteWord?.(item.word)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div style={styles.actionRow}>
        <div style={styles.selectionText}>
          Selected: {selectedWords.length === 0 ? "None" : selectedWords.map((w) => w.word).join(", ")}
        </div>
        <button
          type="button"
          onClick={generateStory}
          disabled={loading || selectedWords.length === 0}
          style={styles.generateButton}
        >
          {loading ? "Generating..." : "Generate Story"}
        </button>
      </div>

      {error ? <p style={styles.error}>{error}</p> : null}

      <article style={styles.storyCard}>
        {story ? <pre style={styles.story}>{story}</pre> : <p style={styles.placeholder}>Generated story appears here.</p>}
      </article>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    background: "#ffffff",
    padding: 16,
    display: "grid",
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 22,
  },
  help: {
    margin: 0,
    color: "#475569",
  },
  empty: {
    margin: 0,
    color: "#64748b",
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "grid",
    gap: 8,
  },
  listItem: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#0f172a",
  },
  meaning: {
    color: "#475569",
    fontWeight: 400,
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  deleteButton: {
    border: "none",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
    background: "#b91c1c",
    color: "#fff",
    fontWeight: 700,
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  selectionText: {
    color: "#334155",
    fontSize: 14,
  },
  generateButton: {
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    background: "#0f766e",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  error: {
    color: "#b91c1c",
    margin: 0,
    whiteSpace: "pre-wrap",
    fontSize: 14,
  },
  storyCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 12,
    background: "#f8fafc",
    minHeight: 120,
  },
  story: {
    margin: 0,
    whiteSpace: "pre-wrap",
    fontFamily: "inherit",
    lineHeight: 1.5,
    color: "#0f172a",
  },
  placeholder: {
    margin: 0,
    color: "#64748b",
  },
};
