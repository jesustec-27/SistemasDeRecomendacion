const contentBased = require('./contentBased');
const collaborative = require('./collaborative');
const explainer = require('./explainer');
const db = require('../db');

function getHybridRecommendations(userId, options = {}) {
  const { contentWeight = 0.6, collabWeight = 0.4, boosted = true } = options;
  
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return [];
    
    user.interests = JSON.parse(user.interests || '[]');
    const allBooks = db.prepare('SELECT * FROM books').all();
    
    // 1. Puntajes de CONTENIDO
    const contentScores = contentBased.getRecommendations(user, allBooks);
    
    // 2. Puntajes de COLABORACIÓN
    const collabScores = collaborative.getCollaborativeScores(userId);
    const collabMap = {};
    collabScores.forEach(s => collabMap[s.bookId] = s.score);
    
    // 3. Puntaje híbrido
    const results = allBooks.map(book => {
      const cScoreData = contentScores.find(s => s.bookId === book.id);
      const cbScore = cScoreData ? cScoreData.score : 0;
      const clScore = collabMap[book.id] || 0;
      
      const baseScore = (cbScore * contentWeight) + (clScore * collabWeight);
      let finalScore = baseScore;
      const boosts = [];
      
      if (boosted) {
        // Novedad: < 6 meses (aprox 180 días)
        const acqDate = new Date(book.acquired_at);
        const now = new Date();
        const diffDays = (now - acqDate) / (1000 * 60 * 60 * 24);
        if (diffDays < 180) {
          finalScore += 0.20;
          boosts.push('novedad');
        }
        
        // Popularidad
        if (book.interaction_count > 10) { 
          finalScore += 0.15;
          boosts.push('popularidad');
        }
        
        // Relevancia carrera
        if (book.category && user.carrera && 
            book.category.toLowerCase().includes(user.carrera.toLowerCase())) {
          finalScore += 0.10;
          boosts.push('carrera');
        }
        
        // Penalización: ya interactuado (visto o guardado)
        const interaction = db.prepare('SELECT type FROM interactions WHERE user_id = ? AND book_id = ? LIMIT 1').get(userId, book.id);
        if (interaction) {
          finalScore *= 0.5;
          boosts.push('interactuado');
        }
      }
      
      const explanation = explainer.generateExplanation({
        book,
        cbScore,
        clScore,
        boosts,
        dominant: (cbScore * contentWeight) > (clScore * collabWeight) ? 'content' : 'collab',
        matchedTerms: cScoreData ? cScoreData.matchedTerms : []
      });
      
      return {
        ...book,
        subjects: JSON.parse(book.subjects || '[]'),
        relevanceScore: Math.min(Math.max(finalScore, 0), 1.5), // Cap relevance
        explanation
      };
    });
    
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  } catch (error) {
    console.error('Error in hybrid recommendations:', error);
    return [];
  }
}

module.exports = { getHybridRecommendations };
