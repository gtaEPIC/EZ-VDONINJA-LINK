interface APIResponse {
    word: string;
}

export default async function generateWord() {
    const response = await fetch("https://random-words-api.kushcreates.com/api?language=en&length=7&type=lowercase&words=1");
    if (response.ok) {
        const data: APIResponse[] = await response.json();
        const word: string = data[0].word;
        if (!word) return generateWord();
        if (word.length < 5 || word.includes(" ")) return generateWord();
        console.log("New Word", word);
        return word;
    }else{
        throw new Error("Word cannot be generated, API returned " + response.status);
    }
}