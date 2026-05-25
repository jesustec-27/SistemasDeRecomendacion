// Funciones auxiliares (versión worker)
function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

function getVector(text, idf) {
  const tokens = tokenize(text);
  const tf = {};
  tokens.forEach(t => tf[t] = (tf[t] || 0) + 1);
  const vector = {};
  for (const term in tf) {
    if (idf[term]) vector[term] = tf[term] * idf[term];
  }
  return vector;
}

function cosineSimilarity(vecA, vecB) {
  const keysA = Object.keys(vecA);
  const keysB = Object.keys(vecB);
  if (keysA.length === 0 || keysB.length === 0) return 0;
  const uniqueTerms = new Set([...keysA, ...keysB]);
  let dotProduct = 0, magA = 0, magB = 0;
  for (const term of uniqueTerms) {
    const valA = vecA[term] || 0;
    const valB = vecB[term] || 0;
    dotProduct += valA * valB;
    magA += valA * valA;
    magB += valB * valB;
  }
  return magA === 0 || magB === 0 ? 0 : dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

self.onmessage = (e) => {
  const { currentBook, allBooks } = e.data;
  
  // 1. Calcular IDF global
  const idf = {};
  const N = allBooks.length;
  allBooks.forEach(b => {
    const text = `${b.title} ${b.author} ${b.subjects ? JSON.stringify(b.subjects) : ''}`;
    new Set(tokenize(text)).forEach(t => idf[t] = (idf[t] || 0) + 1);
  });
  for (const t in idf) idf[t] = Math.log(N / idf[t]);
  
  // 2. Vector del libro actual
  const currentText = `${currentBook.title} ${currentBook.author} ${JSON.stringify(currentBook.subjects)}`;
  const currentVector = getVector(currentText, idf);
  
  // 3. Calcular similitudes
  const results = allBooks
    .filter(b => b.id !== currentBook.id)
    .map(book => {
      const bookText = `${book.title} ${book.author} ${JSON.stringify(book.subjects)}`;
      const bookVector = getVector(bookText, idf);
      const similarity = cosineSimilarity(currentVector, bookVector);
      return {
        ...book,
        similarity: similarity,
        relevanceScore: similarity,
        explanation: `Este libro tiene un ${Math.round(similarity * 100)}% de similitud temática basada en contenido (TF-IDF) y materias.`
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 6);
    
  self.postMessage(results);
};
