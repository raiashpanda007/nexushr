import axios from "axios";
import { Cfg } from "../conf/Config.js";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/embeddings";
const BGE_LARGE_MODEL = "BAAI/bge-large-en-v1.5";
const BATCH_SIZE = 100;

async function embedBatch(texts) {
  const response = await axios.post(
    OPENROUTER_ENDPOINT,
    { model: BGE_LARGE_MODEL, input: texts },
    {
      headers: {
        Authorization: `Bearer ${Cfg.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = response.data;
  if (!data || !Array.isArray(data.data)) {
    throw new Error("Invalid response from OpenRouter embeddings API");
  }

  // Sort by index to guarantee order, then extract the vectors
  return data.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

async function GenerateEmbeddings(texts) {
  try {
    const allEmbeddings = [];
    const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      console.log(
        `[Embeddings] Processing batch ${batchNum}/${totalBatches} (${batch.length} items)`
      );
      const batchEmbeddings = await embedBatch(batch);
      allEmbeddings.push(...batchEmbeddings);
    }

    console.log(
      `[Embeddings] Generated embeddings for ${allEmbeddings.length} documents`
    );
    return allEmbeddings;
  } catch (error) {
    console.error("[Embeddings] Error generating embeddings:", error);
    throw error;
  }
}

export default GenerateEmbeddings;