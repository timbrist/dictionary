import {useState } from "react";
import type { DictionaryEntry, WordCard } from "../types/WordType";

function RawWordtoShowWordType(entry: DictionaryEntry) {
  const word = entry.word;
  const phonetic = entry.phonetic ?? entry.phonetics?.find((p) => p.text)?.text ?? "";
  const firstMeaning = entry.meanings?.[0];
  const partOfSpeech = firstMeaning?.partOfSpeech ?? "";
  const definition = firstMeaning?.definitions?.[0]?.definition ?? "";

  return { word, phonetic, partOfSpeech, definition };
}


export default function TextSearch(){

    const [query, setQuery] = useState("birthday");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [card, setCard] = useState<WordCard |null>(null);

    const fetchWord = async (word:string)=>{
        const w = word.trim();
        if (!w) return;

        try{
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${w}`);

            if(!res.ok){
                const maybe = await res.json().catch( ()=>null );
                const msg = maybe?.message ?? `Request failed (${res.status}). Try another word.`;
                throw new Error(msg);
            }
            const data = (await res.json()) as DictionaryEntry[];
            const entry = data?.[0];
            if (!entry) throw new Error("No result returned.");
            setCard(RawWordtoShowWordType(entry))
        } catch (e) {
            setCard(null);
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }
    

    return (
        <>
        <div className="text-search">
            <form onSubmit={ (e) =>{
                e.preventDefault();
                fetchWord(query);
            } }>
                <input
                    value={query}
                    onChange={ (e) => setQuery(e.target.value) }
                    placeholder="Type a world"
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Loading...":"Search"}
                </button>
            </form>
            <div className="word-card">
                { error ? ( <div className="error-msg"> {error} </div> ) 
                        : !card ? (<div className="card-msg">Search a word to see it here.</div>)
                                : (
                                    <>
                                    <div className="word-alone"> {card.word}</div>
                                    <div className="word-detail">
                                        {card.phonetic ? <span className="phonetic">({card.phonetic})</span> : null}
                                        {card.partOfSpeech ? <span className="partOfSpeech">{card.partOfSpeech}</span> : null}
                                    </div>

                                    <div className="divider" />

                                    <div className="definition">{card.definition}</div>

                                    <button  className="addButton" onClick={() => {} } >
                                        Add To Word List
                                    </button>
                                    </>
                                    
                                )
                }
            </div>
        </div>
        </>
    );
}