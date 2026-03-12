function CosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error("Vectors must be of the same length");
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        const valA = a[i];
        const valB = b[i];

        if (valA === undefined || valB === undefined) continue;

        dot += valA * valB;
        normA += valA * valA;
        normB += valB * valB;
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default CosineSimilarity;