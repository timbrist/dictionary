import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "../firebase";
import type { WordEntry } from "../types/WordType";

export function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

function normalizeWordListItem(input: unknown): WordEntry | null {
  if (!input || typeof input !== "object") return null;

  const item = input as Partial<WordEntry>;
  const normalizedWord = typeof item.word === "string" ? normalizeWord(item.word) : "";
  if (!normalizedWord) return null;

  return {
    word: normalizedWord,
    meaning: typeof item.meaning === "string" ? item.meaning : undefined,
  };
}

export function serializeWordList(input: WordEntry[]) {
  return input.map((item) => ({ word: normalizeWord(item.word), ...(item.meaning ? { meaning: item.meaning } : {}) }));
}

export async function loadUserWordList(userId: string): Promise<WordEntry[]> {
  const wordlistDocRef = doc(db, "wordlist", userId);
  const snapshot = await getDoc(wordlistDocRef);
  if (!snapshot.exists()) {
    return [];
  }

  const rawWords = snapshot.data().words;
  return Array.isArray(rawWords)
    ? rawWords.map(normalizeWordListItem).filter((item): item is WordEntry => item !== null)
    : [];
}

export async function saveUserWordList(userId: string, words: WordEntry[]): Promise<void> {
  const wordlistDocRef = doc(db, "wordlist", userId);
  await setDoc(wordlistDocRef, {
    words: serializeWordList(words),
  });
}
