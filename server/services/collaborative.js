const db = require('../db');

function getCollaborativeScores(userId) {
  try {
    const user = db.prepare('SELECT carrera, semestre FROM users WHERE id = ?').get(userId);
    if (!user) return [];
    
    // Buscar interacciones de usuarios similares (misma carrera y semestre)
    const peerInteractions = db.prepare(`
      SELECT i.book_id, COUNT(*) as interaction_count
      FROM interactions i
      JOIN users u ON i.user_id = u.id
      WHERE u.carrera = ? AND u.semestre = ? AND u.id != ?
      GROUP BY i.book_id
    `).all(user.carrera, user.semestre, userId);
    
    if (peerInteractions.length === 0) return [];
    
    // Normalizar scores (0 a 1)
    const maxCount = Math.max(...peerInteractions.map(i => i.interaction_count));
    
    return peerInteractions.map(i => ({
      bookId: i.book_id,
      score: i.interaction_count / maxCount
    }));
  } catch (error) {
    console.error('Error in collaborative filtering:', error);
    return [];
  }
}

module.exports = { getCollaborativeScores };
