function generateExplanation(data) {
  const { book, cbScore, clScore, boosts, dominant, matchedTerms } = data;
  
  let explanation = "";
  
  if (dominant === 'content' && cbScore > 0.1) {
    explanation = `Este libro coincide con tus intereses en ${matchedTerms.slice(0, 3).join(', ')}.`;
  } else if (dominant === 'collab' && clScore > 0.1) {
    explanation = `Es popular entre estudiantes de tu misma carrera (${book.category || 'tu área'}).`;
  } else {
    explanation = `Te recomendamos este libro por su relevancia general en el catálogo.`;
  }
  
  if (boosts.includes('novedad')) {
    explanation += " Además, es una adquisición reciente de la biblioteca.";
  }
  
  if (boosts.includes('popularidad')) {
    explanation += " Es uno de los libros más consultados actualmente.";
  }
  
  return explanation;
}

module.exports = { generateExplanation };
