
import CosineSimilarity from "../utils/CosineSimilarity.js";

async function TfCalculator(tokens, skillName, tokenEmbeddings, skillEmbedding) {
  // tokenEmbeddings = { "node": [...], "javascript": [...], ... }
  // skillEmbedding = [...] (embedding vector for the skill)

  if (!tokens || tokens.length === 0 || !skillEmbedding) {
    return 0;
  }

  // Exact match shortcut — strongest signal, return immediately
  const skillLower = skillName.toLowerCase();
  if (tokens.includes(skillLower)) {
    return 1.0;
  }

  const threshold = 0.55; // Lowered from 0.7 — catches synonyms & abbreviations
  let maxSim = 0;
  let matchedCount = 0;

  // Compare each token embedding with skill embedding
  for (const token of tokens) {
    const tokenVec = tokenEmbeddings[token];

    if (!tokenVec) {
      continue; // Skip if embedding not found
    }

    const similarity = CosineSimilarity(skillEmbedding, tokenVec);

    if (similarity > maxSim) {
      maxSim = similarity;
    }

    if (similarity > threshold) {
      matchedCount++;
    }
  }

  if (maxSim === 0) {
    return 0;
  }

  // Frequency bonus — log-normalised so it doesn't dominate
  const freqBonus = Math.log(1 + matchedCount) / Math.log(1 + tokens.length);

  // TF = weighted blend of best semantic match + frequency signal
  const tf = Math.min(1.0, maxSim * 0.7 + freqBonus * 0.3);

  return tf;
}

export default TfCalculator;