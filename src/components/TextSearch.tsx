import React, { useEffect, useState } from "react";

import type { DictionaryEntry, WordEntry } from "../types/WordType";

type TextSearchProps = {
  onAddWord?: (input: WordEntry) => void;
};

function pickCardData(entry: DictionaryEntry) {
  const word = entry.word;
  const phonetic = entry.phonetic ?? entry.phonetics?.find((p) => p.text)?.text ?? "";
  const firstMeaning = entry.meanings?.[0];
  const partOfSpeech = firstMeaning?.partOfSpeech ?? "";
  const definition = firstMeaning?.definitions?.[0]?.definition ?? "";

  return { word, phonetic, partOfSpeech, definition };
}

export default function TextSearch({ onAddWord }: TextSearchProps) {
  const [query, setQuery] = useState("birthday");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<{
    word: string;
    phonetic: string;
    partOfSpeech: string;
    definition: string;
  } | null>(null);

  async function fetchWord(word: string) {
    const w = word.trim();
    if (!w) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);

      if (!res.ok) {
        const maybe = await res.json().catch(() => null);
        const msg = maybe?.message ?? `Request failed (${res.status}). Try another word.`;
        throw new Error(msg);
      }

      const data = (await res.json()) as DictionaryEntry[];
      const entry = data?.[0];
      if (!entry) throw new Error("No result returned.");

      setCard(pickCardData(entry));
    } catch (e) {
      setCard(null);
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchWord(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.page}>
        <h2> English Dictionary </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void fetchWord(query);
        }}
        style={styles.form}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a word…"
          style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Loading…" : "Search"}
        </button>
      </form>

      <div style={styles.card}>
        {error ? (
          <div style={styles.error}>{error}</div>
        ) : !card ? (
          <div style={styles.muted}>Search a word to see it here.</div>
        ) : (
          <>
            <div style={styles.word}>{card.word}</div>

            <div style={styles.metaRow}>
              {card.phonetic ? <span style={styles.phonetic}>({card.phonetic})</span> : null}
              {card.partOfSpeech ? <span style={styles.partOfSpeech}>{card.partOfSpeech}</span> : null}
            </div>

            <div style={styles.divider} />

            <div style={styles.definition}>{card.definition}</div>

            <button
              type="button"
              style={styles.addButton}
              onClick={() => {
                onAddWord?.({
                  word: card.word,
                  meaning: card.definition,
                });
              }}
            >
              Add To Word List
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "grid",
    placeItems: "center",
    padding: 24,
    fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',

    border:"1px solid #ddd",
    borderRadius: 14,
  },
  form: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
    width: "min(520px, 92vw)",
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ddd",
    outline: "none",
    fontSize: 16,
  },
  button: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ddd",
    cursor: "pointer",
    fontSize: 16,
  },
  card: {
    width: "min(520px, 92vw)",
    background: "#fff",
    borderRadius: 18,
    padding: "28px 28px 30px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    display: "grid",
    gap: 8,
  },
  word: {
    fontSize: 64,
    lineHeight: 1,
    fontWeight: 700,
    letterSpacing: -0.5,
    textTransform: "lowercase",
    marginBottom: 10,
    color: "#111",
  },
  metaRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    color: "#111",
    marginBottom: 14,
  },
  phonetic: {
    fontSize: 22,
    fontWeight: 600,
  },
  partOfSpeech: {
    fontSize: 22,
    fontStyle: "italic",
    opacity: 0.75,
  },
  divider: {
    height: 1,
    background: "#222",
    opacity: 0.65,
    margin: "10px 0 16px",
  },
  definition: {
    fontSize: 28,
    lineHeight: 1.25,
    color: "#111",
  },
  addButton: {
    marginTop: 8,
    border: "none",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    background: "#14532d",
    color: "#fff",
    justifySelf: "end",
  },
  muted: {
    color: "#666",
    fontSize: 16,
  },
  error: {
    color: "#b00020",
    fontSize: 16,
    whiteSpace: "pre-wrap",
  },
};
