import natural from "natural";

async function Tokenizer(text) {
  const lowercase = text.toLowerCase();

  const tokenizer = new natural.WordTokenizer();
  let tokens = tokenizer.tokenize(lowercase);

  const stopwords = natural.stopwords;

  tokens = tokens.filter(word => {
    return (
      !stopwords.includes(word) &&     // remove stopwords
      word.length > 2 &&               // remove short words
      /^[a-z0-9+#]+$/.test(word)       // allow tech tokens like c++, c#, nodejs
    );
  });

  return tokens;
}

export default Tokenizer;
