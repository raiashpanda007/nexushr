import DownloadPdf from "../utils/DownloadResume.js";
import path from "path";
import { ParseDocx, ParsePdfs } from "./ParseResumes.js";
import Tokenizer from "./Tokenizer.js";
import TfCalculator from "./tf-calculator.js";
import IdfCalculator from "./idf-calculator.js";
import GenerateEmbeddings from "../utils/GenerateEmbeddings.js";

async function ATSEngine(openingId, applicants, openingSkills) {
  try {
    console.log(`[ATS] Starting processing for opening ${openingId}`);

    // Step 1: Download all resumes
    const downloadedResumes = await Promise.all(
      applicants.map(async (applicant) => {
        const { _id, resume } = applicant;
        const filePath = await DownloadPdf(resume, _id.toString(), openingId);
        console.log(`[ATS] Resume for ${_id} downloaded at ${filePath}`);
        return { _id, filePath };
      })
    );

    // Step 2: Parse and tokenize all resumes
    console.log(`[ATS] Parsing ${downloadedResumes.length} resumes...`);
    const allResumeData = [];

    for (const { _id, filePath } of downloadedResumes) {
      const ext = path.extname(filePath).toLowerCase();
      let rawText = "";

      try {
        if (ext === ".pdf") {
          console.log(`[ATS] Parsing PDF for ${_id}`);
          rawText = await ParsePdfs(filePath);
        } else if (ext === ".docx") {
          console.log(`[ATS] Parsing DOCX for ${_id}`);
          rawText = await ParseDocx(filePath);
        } else {
          console.warn(`[ATS] Unsupported format for ${_id}: ${ext}`);
          continue;
        }

        const tokens = await Tokenizer(rawText);
        allResumeData.push({
          applicantId: _id,
          tokens,
          rawText
        });

        console.log(`[ATS] Tokenized ${tokens.length} tokens for ${_id}`);
      } catch (error) {
        console.error(`[ATS] Error parsing resume for ${_id}:`, error.message);
        continue;
      }
    }

    if (allResumeData.length === 0) {
      throw new Error("No resumes could be processed");
    }

    // Step 3: Get all unique tokens from all resumes
    console.log(`[ATS] Finding unique tokens...`);
    const uniqueTokensSet = new Set();
    allResumeData.forEach(resume => {
      resume.tokens.forEach(token => uniqueTokensSet.add(token));
    });
    const uniqueTokens = Array.from(uniqueTokensSet);
    console.log(`[ATS] Found ${uniqueTokens.length} unique tokens`);

    // Step 4: Generate embeddings for all unique tokens (batch)
    console.log(`[ATS] Generating embeddings for unique tokens...`);
    const tokenEmbeddingsArray = await GenerateEmbeddings(uniqueTokens);
    const tokenEmbeddings = {};

    for (let i = 0; i < uniqueTokens.length; i++) {
      tokenEmbeddings[uniqueTokens[i]] = tokenEmbeddingsArray[i];
    }

    console.log(`[ATS] Token embeddings generated`);

    // Step 5: Generate embeddings for opening skills
    console.log(`[ATS] Generating embeddings for opening skills...`);
    const skillNames = openingSkills.map(s => s.name);
    const skillEmbeddingsArray = await GenerateEmbeddings(skillNames);
    const skillEmbeddings = {};

    for (let i = 0; i < skillNames.length; i++) {
      skillEmbeddings[skillNames[i]] = skillEmbeddingsArray[i];
    }

    console.log(`[ATS] Skill embeddings generated`);

    // Step 6: Calculate IDF for all skills with embeddings
    console.log(`[ATS] Calculating IDF for all skills...`);
    const idfCache = {};

    for (const skill of openingSkills) {
      const idf = await IdfCalculator(
        allResumeData.map(r => r.tokens),
        skill.name,
        skillEmbeddings[skill.name],
        tokenEmbeddings
      );
      idfCache[skill.name] = idf;
    }

    // Step 7: Calculate scores for each applicant
    console.log(`[ATS] Calculating scores for each applicant...`);
    const scores = [];

    for (const resumeData of allResumeData) {
      const { applicantId, tokens } = resumeData;
      let totalScore = 0;
      let totalWeight = 0;
      const skillBreakdown = {};

      for (const skill of openingSkills) {
        const { name: skillName, proficiencyLevel: weight } = skill;
        totalWeight += weight;

        try {
          // Calculate TF with embeddings
          const tf = await TfCalculator(
            tokens,
            skillName,
            tokenEmbeddings,
            skillEmbeddings[skillName]
          );

          // Get IDF from cache
          const idf = idfCache[skillName] || 0;

          // Calculate final score: TF * IDF * weight
          const score = tf * idf * weight;
          totalScore += score;

          skillBreakdown[skillName] = {
            tf: parseFloat(tf.toFixed(3)),
            idf: parseFloat(idf.toFixed(3)),
            weight,
            score: parseFloat(score.toFixed(3))
          };
        } catch (error) {
          console.error(
            `[ATS] Error calculating score for skill ${skillName}:`,
            error
          );
          skillBreakdown[skillName] = { error: error.message };
        }
      }

      const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

      scores.push({
        applicantId,
        rawScore: parseFloat(totalScore.toFixed(3)),
        normalizedScore: parseFloat(normalizedScore.toFixed(3)),
        skillBreakdown
      });
    }

    // Step 8: Sort and rank candidates
    scores.sort((a, b) => b.normalizedScore - a.normalizedScore);

    const rankedScores = scores.map((score, index) => ({
      ...score,
      rank: index + 1
    }));

    console.log(
      `[ATS] Scoring complete. Top candidate: ${rankedScores[0]?.applicantId} with score ${rankedScores[0]?.normalizedScore}`
    );

    return rankedScores;
  } catch (error) {
    console.error("[ATS] ATSEngine failed:", error);
    throw error;
  }
}

export default ATSEngine;