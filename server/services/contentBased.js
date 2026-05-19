function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

function calculateIDF(books) {
  const idf = {};
  const N = books.length;
  
  books.forEach(book => {
    const subjects = JSON.parse(book.subjects || '[]');
    const text = `${book.title} ${book.author} ${subjects.join(' ')}`;
    const uniqueTokens = new Set(tokenize(text));
    uniqueTokens.forEach(token => {
      idf[token] = (idf[token] || 0) + 1;
    });
  });
  
  for (const term in idf) {
    idf[term] = Math.log(N / idf[term]);
  }
  
  return idf;
}

function getVector(text, idf) {
  const tokens = tokenize(text);
  const tf = {};
  tokens.forEach(t => tf[t] = (tf[t] || 0) + 1);
  
  const vector = {};
  for (const term in tf) {
    if (idf[term]) {
      vector[term] = tf[term] * idf[term];
    }
  }
  return vector;
}

function cosineSimilarity(vecA, vecB) {
  const keysA = Object.keys(vecA);
  const keysB = Object.keys(vecB);
  
  if (keysA.length === 0 || keysB.length === 0) return 0;
  
  const uniqueTerms = new Set([...keysA, ...keysB]);
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  
  for (const term of uniqueTerms) {
    const valA = vecA[term] || 0;
    const valB = vecB[term] || 0;
    dotProduct += valA * valB;
    magA += valA * valA;
    magB += valB * valB;
  }
  
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

function getRecommendations(userProfile, allBooks) {
  const idf = calculateIDF(allBooks);
  const userText = userProfile.interests.join(' ');
  const userVector = getVector(userText, idf);
  
  const scores = allBooks.map(book => {
    const subjects = JSON.parse(book.subjects || '[]');
    const bookText = `${book.title} ${book.author} ${subjects.join(' ')}`;
    const bookVector = getVector(bookText, idf);
    
    const similarity = cosineSimilarity(userVector, bookVector);
    
    return {
      bookId: book.id,
      score: similarity,
      matchedTerms: Object.keys(userVector).filter(t => bookVector[t])
    };
  });
  
  return scores;
}

module.exports = { getRecommendations, tokenize };
