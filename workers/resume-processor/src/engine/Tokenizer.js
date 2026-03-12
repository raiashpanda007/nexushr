import natural from "natural";

async function Tokenizer(text) {
  const lowercase = text.toLowerCase();

  const tokenizer = new natural.WordTokenizer();
  let unigrams = tokenizer.tokenize(lowercase);

  const stopwords = natural.stopwords;

  unigrams = unigrams.filter((word) => {
    return (
      !stopwords.includes(word) && // remove stopwords
      word.length > 2 && // remove short words
      /^[a-z0-9+#]+$/.test(word) // allow tech tokens like c++, c#, nodejs
    );
  });

  const bigrams = natural.NGrams.bigrams(unigrams).map((g) => g.join(" "));
  const trigrams = natural.NGrams.trigrams(unigrams).map((g) => g.join(" "));

  return [...unigrams, ...bigrams, ...trigrams];
}

export default Tokenizer;
