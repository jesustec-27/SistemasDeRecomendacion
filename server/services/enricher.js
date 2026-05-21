const fetch = require('node-fetch');

async function enrichWithOpenLibrary(book) {
  // Nota: Koha RSS a veces no trae el ISBN directo. 
  // Si estuviera disponible en algún campo lo usaríamos.
  // Por ahora, si no hay ISBN, devolvemos el libro tal cual.
  if (!book.isbn) {
    // Intento heurístico: si el título tiene algo que parece ISBN
    const isbnMatch = book.title?.match(/(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}|(?=(?:[0-9]+[\- ]){3})[0-9X\- ]{13}|97[89][0-9]{10}|(?=(?:[0-9]+[\- ]){4})[0-9X\- ]{17})(?:97[89][\- ]?)?[0-9]{1,5}[\- ]?[0-9]+[\- ]?[0-9]+[\- ]?[0-9X]/i);
    if (isbnMatch) {
      book.isbn = isbnMatch[0].replace(/[^0-9X]/gi, '');
    }
  }

  if (!book.isbn) return book;

  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${book.isbn}&format=json&jscmd=data`;
    const response = await fetch(url);
    if (!response.ok) return book;
    
    const data = await response.json();
    const info = data[`ISBN:${book.isbn}`];
    
    if (info) {
      return {
        ...book,
        cover_url: info.cover?.large || info.cover?.medium || info.cover?.small || book.cover_url || null,
        pages: info.number_of_pages || book.pages || null,
        publisher: info.publishers?.[0]?.name || info.publishers?.[0] || null
      };
    }
  } catch (error) {
    console.warn(`Could not enrich book ${book.id}:`, error.message);
  }

  return book;
}

module.exports = { enrichWithOpenLibrary };
