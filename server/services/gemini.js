const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../db');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function askBiblioIA(userQuery, userId) {
  try {
    const allBooks = db.prepare('SELECT id, title, author, link, subjects, category FROM books').all();
    const catalogSnippet = allBooks.map(b => `- ${b.title} (${b.author}) [${b.category}]`).join('\n');

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `Eres BiblioIA, un asistente experto para la biblioteca de ingeniería de la UADY.
      Tu tarea es recomendar libros del siguiente catálogo basado en la consulta del usuario.
      
      Catálogo disponible:
      ${catalogSnippet}
      
      Responde de forma amable, en español, y menciona específicamente los títulos del catálogo que coinciden de manera idéntica. Si no hay una coincidencia exacta, sugiere el más cercano.`
    });

    const result = await model.generateContent(userQuery);
    const response = await result.response;
    const responseText = response.text();

    // Escanear libros del catálogo que fueron mencionados en la respuesta de la IA
    const matchedBooks = [];
    const responseTextLower = responseText.toLowerCase();

    allBooks.forEach(b => {
      if (b.title) {
        const titleLower = b.title.toLowerCase();
        // Verificar si el título del libro está mencionado en la respuesta
        if (responseTextLower.includes(titleLower)) {
          // Evitar duplicar
          if (!matchedBooks.some(m => m.id === b.id)) {
            matchedBooks.push({
              id: b.id,
              title: b.title,
              author: b.author,
              link: b.link
            });
          }
        }
      }
    });

    return { text: responseText, matchedBooks };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return { 
      text: "Lo siento, tuve un problema al consultar el catálogo. ¿Puedes intentarlo de nuevo?", 
      matchedBooks: [] 
    };
  }
}

module.exports = { askBiblioIA };
