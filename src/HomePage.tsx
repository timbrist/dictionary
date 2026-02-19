import { signOut, type User } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import TextSearch from "./components/TextSearch";
import ImageSearch from "./components/ImageSearch";
import Wordlist from "./components/Wordlist";
import { useEffect, useRef, useState } from "react";
import { loadUserWordList, normalizeWord, saveUserWordList, serializeWordList } from "./services/wordlistFirestore";
import type { WordEntry } from "./types/WordType";


export function HomePage( {user}:{user:User} ){

    //Log out function 
    const nav= useNavigate();
    const handleLogout = async ()=>{
        await signOut(auth);
        nav("/login", {replace: true});
    }
    //save word to fire base
    const [words, setWords] = useState<WordEntry[]>([]);
    const [hydrated, setHydrated] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const lastSavedWordsRef = useRef<string>("");

    //load word list every time when user.uid changed 
    useEffect(() => {
        let active = true;
        async function loadWordList() {
        setHydrated(false);
        setSyncing(true);
        setSyncError(null);
        setWords([]);

        try {
            const parsed = await loadUserWordList(user.uid);
            if (active) {
            lastSavedWordsRef.current = JSON.stringify(serializeWordList(parsed));
            setWords(parsed);
            }
        } catch (error) {
            if (active) {
            setSyncError(error instanceof Error ? error.message : "Failed to load word list from Firestore.");
            }
        } finally {
            if (active) {
                setHydrated(true);
                setSyncing(false);
                }
            }
        }
    void loadWordList();
        return () => {
        active = false;
        };
    }, [user.uid]);


    //whenever add the word to list, save to the firestore
    useEffect(() => {
        if (!hydrated) return;

        let active = true;

        async function saveWordList() {
            const serializedWords = serializeWordList(words);
            const nextSignature = JSON.stringify(serializedWords);
            if (nextSignature === lastSavedWordsRef.current) {
                return;
            }

            setSyncing(true);
            setSyncError(null);

            try {
                await saveUserWordList(user.uid, words);
                lastSavedWordsRef.current = nextSignature;
            } catch (error) {
                if (active) {
                setSyncError(error instanceof Error ? error.message : "Failed to save word list to Firestore.");
                }
            } finally {
                if (active) {
                setSyncing(false);
                }
            }
            }

        void saveWordList();
        return () => {
            active = false;
            };
    }, [hydrated, user.uid, words]);

    function addWordToList(input: WordEntry) {
        const normalized = normalizeWord(input.word);
        if (!normalized) return;

        setWords((prev) => {
        const existingIndex = prev.findIndex((item) => item.word === normalized);

        if (existingIndex < 0) {
            return [
            {
                word: normalized,
                meaning: input.meaning,
            },
            ...prev,
            ];
        }

        const existing = prev[existingIndex];
        const merged: WordEntry = {
            ...existing,
            meaning: existing.meaning ?? input.meaning,
        };

        const next = [...prev];
        next[existingIndex] = merged;
        return next;
        });
    }

    function deleteWord(word: string) {
        const normalized = normalizeWord(word);
        setWords((prev) => prev.filter((item) => item.word !== normalized));
    }

    return(
        <>
        <div className="home-page">
            <div className="account-info">
                <h1> Welcome to Your Personal AI Dictionary</h1>
                <p> Logged in as: {user.email} </p>
                <p>Word List Count: {words.length}</p>
                <p>Firestore Sync: {syncing ? "syncing..." : "up to date"}</p>
                {syncError ? <p style={{ color: "#b91c1c", margin: 0 }}>Sync Error: {syncError}</p> : null}
                <button onClick={ handleLogout}>Logout</button>
            </div>

            <div className="dictionary-features">
                <TextSearch/>
                <ImageSearch onAddWord={addWordToList} />
                <Wordlist words={words} onDeleteWord={deleteWord}/>
            </div>
        </div>
            
        </>
    );
}