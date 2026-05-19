const { Anthropic } = require('@anthropic-ai/sdk');
const db = require('../db');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function askBiblioIA(userQuery, userId) {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const allBooks = db.prepare('SELECT title, author, subjects, category FROM books').all();
    
    const catalogSnippet = allBooks.map(b => `- ${b.title} (${b.author}) [${b.category}]`).join('\n');

    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229", // Usando un modelo disponible estable
      max_tokens: 1024,
      system: `Eres BiblioIA, un asistente experto para la biblioteca de ingeniería de la UADY.
      Tu tarea es recomendar libros del siguiente catálogo basado en la consulta del usuario.
      Usuario: Estudiante de ${user?.carrera}, ${user?.semestre}º semestre.
      
      Catálogo:
      ${catalogSnippet}
      
      Responde de forma amable, en español, y menciona específicamente los títulos del catálogo que coinciden.`,
      messages: [{ role: "user", content: userQuery }],
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Claude API Error:', error);
    return "Lo siento, tuve un problema consultando a mis neuronas artificiales. ¿Puedes intentarlo de nuevo?";
  }
}

module.exports = { askBiblioIA };
