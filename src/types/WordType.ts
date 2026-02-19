

//rendering the word
export type WordCard = {
    word:string;
    phonetic:string;
    partOfSpeech:string;
    definition: string
};

// fetch the word from api
export type DictionaryEntry = {
  word: string;
  phonetic?: string;
  phonetics?: { text?: string; audio?: string }[];
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string }[];
  }[];
};