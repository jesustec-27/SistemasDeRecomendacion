const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../db');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function askBiblioIA(userQuery, userId) {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const allBooks = db.prepare('SELECT title, author, subjects, category FROM books').all();
    
    const catalogSnippet = allBooks.map(b => `- ${b.title} (${b.author}) [${b.category}]`).join('\n');

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: `Eres BiblioIA, un asistente experto para la biblioteca de ingeniería de la UADY.
      Tu tarea es recomendar libros del siguiente catálogo basado en la consulta del usuario.
      Usuario: Estudiante de ${user?.carrera || 'Ingeniería'}, ${user?.semestre || '1'}º semestre.
      
      Catálogo disponible:
      ${catalogSnippet}
      
      Responde de forma amable, en español, y menciona específicamente los títulos del catálogo que coinciden. Si no hay una coincidencia exacta, sugiere el más cercano.`
    });

    const result = await model.generateContent(userQuery);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "Lo siento, tuve un problema consultando el procesado. ¿Puedes intentarlo de nuevo?";
  }
}

module.exports = { askBiblioIA };
