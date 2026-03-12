import CosineSimilarity from "../utils/CosineSimilarity.js";

async function IdfCalculator(allTokens, skillName, skillEmbedding, allTokenEmbeddings) {
  // allTokens = [ [tokens for resume 1], [tokens for resume 2], ... ]
  // skillEmbedding = [...] (embedding vector for the skill)
  // allTokenEmbeddings = { "node": [...], "javascript": [...], ... }

  const totalResumes = allTokens.length;

  if (!skillEmbedding || totalResumes === 0) {
    return 0;
  }

  const threshold = 0.7;
  let resumesWithSkill = 0;

  // For each resume, check if it contains tokens matching this skill
  for (const resumeTokens of allTokens) {
    let hasSkill = false;

    // Check if any token in this resume matches the skill embedding
    for (const token of resumeTokens) {
      const tokenVec = allTokenEmbeddings[token];

      if (!tokenVec) {
        continue;
      }

      // Calculate similarity between token and skill
      const similarity = CosineSimilarity(skillEmbedding, tokenVec);

      if (similarity > threshold) {
        hasSkill = true;
        break; // Found match, move to next resume
      }
    }

    if (hasSkill) {
      resumesWithSkill++;
    }
  }

  if (resumesWithSkill === 0) {
    return 0; // Skill not found in any resume
  }

  // Smoothed IDF = log(1 + total / count)
  return Math.log(1 + totalResumes / resumesWithSkill);
}

export default IdfCalculator;