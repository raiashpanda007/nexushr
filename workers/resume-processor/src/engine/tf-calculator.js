
import CosineSimilarity from "../utils/CosineSimilarity.js";

async function TfCalculator(tokens, skillName, tokenEmbeddings, skillEmbedding) {
  // tokenEmbeddings = { "node": [...], "javascript": [...], ... }
  // skillEmbedding = [...] (embedding vector for the skill)

  if (!tokens || tokens.length === 0 || !skillEmbedding) {
    return 0;
  }

  const threshold = 0.7; // Cosine similarity threshold
  let matchedCount = 0;

  // Compare each token embedding with skill embedding
  for (const token of tokens) {
    const tokenVec = tokenEmbeddings[token];

    if (!tokenVec) {
      continue; // Skip if embedding not found
    }

    // Calculate cosine similarity
    const similarity = CosineSimilarity(skillEmbedding, tokenVec);

    // If similarity is above threshold, count it as matched
    if (similarity > threshold) {
      matchedCount++;
    }
  }

  // TF = matched tokens / total tokens
  const tf = matchedCount / tokens.length;

  return tf;
}

export default TfCalculator;