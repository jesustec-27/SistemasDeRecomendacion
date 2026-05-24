const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// MIGRACIÓN FÍSICA DE BASE DE DATOS (biblioia.db -> biblioflix.db)
const srcDb = path.join(__dirname, 'biblioia.db');
const destDb = path.join(__dirname, 'biblioflix.db');
try {
  if (fs.existsSync(srcDb)) {
    const destExists = fs.existsSync(destDb);
    const destSize = destExists ? fs.statSync(destDb).size : 0;
    
    if (!destExists || destSize < 35000) {
      // Si el archivo está abierto o bloqueado, intentamos cerrar cualquier conexión
      fs.copyFileSync(srcDb, destDb);
      console.log("Migration: Physical database file copied from biblioia.db to biblioflix.db successfully.");
    }
  }
} catch (err) {
  console.error("Migration error copying database file:", err);
}

const db = new Database(destDb);

// Inicializar tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT,
    author TEXT,
    subjects TEXT,
    category TEXT,
    cover_url TEXT,
    link TEXT,
    acquired_at TEXT,
    branch TEXT,
    pages INTEGER,
    publisher TEXT,
    isbn TEXT,
    interaction_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    carrera TEXT,
    semestre INTEGER,
    interests TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    book_id TEXT,
    type TEXT,
    rating INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// MIGRACIÓN DE DATOS VÍA SQL ATTACH (copiar desde biblioia.db si la base de datos destino está vacía)
try {
  const booksCount = db.prepare("SELECT count(*) as count FROM books").get().count;
  if (booksCount === 0 && fs.existsSync(srcDb)) {
    console.log("Migration: 'books' table is empty. Attaching 'biblioia.db' to copy records...");
    const srcDbSqlPath = srcDb.replace(/\\/g, '/');
    try {
      db.exec(`
        ATTACH '${srcDbSqlPath}' AS oldDb;
        INSERT OR IGNORE INTO books (id, title, author, subjects, category, cover_url, link, acquired_at, branch, pages, publisher, isbn, interaction_count, created_at)
          SELECT id, title, author, subjects, category, cover_url, link, acquired_at, branch, pages, publisher, isbn, interaction_count, created_at FROM oldDb.books;
        INSERT OR IGNORE INTO users (id, carrera, semestre, interests, created_at)
          SELECT id, carrera, semestre, interests, created_at FROM oldDb.users;
        INSERT OR IGNORE INTO interactions (id, user_id, book_id, type, rating, created_at)
          SELECT id, user_id, book_id, type, rating, created_at FROM oldDb.interactions;
        DETACH oldDb;
      `);
      console.log("Migration: Successfully copied all records from biblioia.db to biblioflix.db via SQL ATTACH.");
    } catch (errInner) {
      console.log("Fallback migration without isbn column in source database...");
      try {
        db.exec(`
          INSERT OR IGNORE INTO books (id, title, author, subjects, category, cover_url, link, acquired_at, branch, pages, publisher, interaction_count, created_at)
            SELECT id, title, author, subjects, category, cover_url, link, acquired_at, branch, pages, publisher, interaction_count, created_at FROM oldDb.books;
          INSERT OR IGNORE INTO users (id, carrera, semestre, interests, created_at)
            SELECT id, carrera, semestre, interests, created_at FROM oldDb.users;
          INSERT OR IGNORE INTO interactions (id, user_id, book_id, type, rating, created_at)
            SELECT id, user_id, book_id, type, rating, created_at FROM oldDb.interactions;
          DETACH oldDb;
        `);
        console.log("Migration: Successfully copied all records via fallback SQL ATTACH.");
      } catch (errDetach) {
        try { db.exec("DETACH oldDb;"); } catch(e) {}
        throw errDetach;
      }
    }
  }
} catch (e) {
  console.error("Migration error copying records via SQL:", e);
}

// MIGRACIÓN: Agregar columna isbn si no existe
try {
  db.exec("ALTER TABLE books ADD COLUMN isbn TEXT;");
  console.log("Migration: Successfully added 'isbn' column to books table.");
} catch (e) {
  // Ignorar si la columna ya existe
}

// Limpieza automática de portadas de provisión previas (Koha placeholders o links rotos)
try {
  db.prepare(`
    UPDATE books 
    SET cover_url = NULL 
    WHERE cover_url LIKE '%no-image%' 
       OR cover_url LIKE '%no-img%' 
       OR cover_url LIKE '%opac-tmpl%' 
       OR cover_url LIKE '%spacer.gif%'
  `).run();
} catch (e) {
  console.error("Error al limpiar portadas de provisión previas en SQLite:", e);
}

// MIGRACIÓN: Reparación de enlaces Koha rotos, nulos o con formato objeto
try {
  const result = db.prepare(`
    UPDATE books 
    SET link = 'https://bibliotecahub.uady.mx/cgi-bin/koha/opac-detail.pl?biblionumber=' || id 
    WHERE link IS NULL 
       OR link = '' 
       OR link LIKE '%[object%'
  `).run();
  if (result.changes > 0) {
    console.log(`Migration: Repaired ${result.changes} broken or empty Koha links in the database.`);
  }
} catch (err) {
  console.error("Error repairing Koha links in SQLite:", err);
}

// MIGRACIÓN: Categorización automática retroactiva de libros
try {
  const books = db.prepare('SELECT id, title FROM books').all();
  
  function categorizeBook(title) {
    if (!title) return 'General';
    const t = title.toLowerCase();
    
    if (t.includes('civil') || t.includes('geologic') || t.includes('geolog') || t.includes('roca') || t.includes('suelo') || 
        t.includes('concreto') || t.includes('estructura') || t.includes('hidrául') || t.includes('hidraul') || 
        t.includes('geotec') || t.includes('mineral') || t.includes('construcción') || t.includes('construccion') ||
        t.includes('paviment') || t.includes('cemento')) {
      return 'Ingeniería Civil';
    }
    
    if (t.includes('mecatrón') || t.includes('mecatron') || t.includes('control') || t.includes('robot') || 
        t.includes('vhdl') || t.includes('digital') || t.includes('circuito') || t.includes('electrón') || 
        t.includes('electron') || t.includes('señal') || t.includes('senal') || t.includes('microcontrol') ||
        t.includes('automat') || t.includes('lógica digital') || t.includes('logica digital') || 
        t.includes('dispositivos electrónicos') || t.includes('dispositivos electronicos') ||
        t.includes('redes') || t.includes('neural') || t.includes('inteligencia') || t.includes('software') ||
        t.includes('program') || t.includes('algorit') || t.includes('computa') || t.includes('base de datos') ||
        t.includes('database')) {
      return 'Mecatrónica y Computación';
    }
    
    if (t.includes('física') || t.includes('fisica') || t.includes('electric') || t.includes('magnet') || 
        t.includes('termodinám') || t.includes('termodinam') || t.includes('óptic') || t.includes('optic') || 
        t.includes('mecánica') || t.includes('mecanica') || t.includes('cuánt') || t.includes('cuant') || 
        t.includes('acúst') || t.includes('acust') || t.includes('estática') || t.includes('estatica') ||
        t.includes('ondas') || t.includes('fluidos') || t.includes('relatividad')) {
      return 'Ingeniería Física';
    }

    if (t.includes('químic') || t.includes('quimic') || t.includes('energía') || t.includes('energia') || 
        t.includes('renovabl') || t.includes('solar') || t.includes('eólic') || t.includes('eolic') || 
        t.includes('sustent') || t.includes('sustain') || t.includes('termal') || t.includes('combust') ||
        t.includes('ambiental') || t.includes('biomasa')) {
      return 'Energías y Química';
    }
    
    if (t.includes('álgebra') || t.includes('algebra') || t.includes('cálculo') || t.includes('calculo') || 
        t.includes('geomet') || t.includes('probabil') || t.includes('estadíst') || t.includes('estadist') || 
        t.includes('matemát') || t.includes('matemat') || t.includes('variable') || t.includes('compleja') || 
        t.includes('vector') || t.includes('numéric') || t.includes('numeric') || t.includes('ecuacion') || 
        t.includes('ecuación') || t.includes('análisis funcional') || t.includes('analisis funcional') ||
        t.includes('multilevel') || t.includes('inference') || t.includes('survey') || t.includes('regression') ||
        t.includes('stochastic') || t.includes('estocás') || t.includes('estocas') || t.includes('simulación') ||
        t.includes('simulacion') || t.includes('discreta')) {
      return 'Matemáticas y Estadística';
    }
    
    if (t.includes('investig') || t.includes('mercado') || t.includes('metodolog') || t.includes('admin') || 
        t.includes('proyect') || t.includes('econ') || t.includes('gubern') || t.includes('salud') || 
        t.includes('nopal') || t.includes('hormiga') || t.includes('inteligencia') || t.includes('comport') ||
        t.includes('human') || t.includes('social')) {
      return 'Ciencias del Desarrollo';
    }

    return 'General';
  }

  const updateStmt = db.prepare('UPDATE books SET category = ? WHERE id = ?');
  
  const transaction = db.transaction((booksList) => {
    for (const b of booksList) {
      const category = categorizeBook(b.title);
      updateStmt.run(category, b.id);
    }
  });
  
  transaction(books);
  console.log("Migration: Categorized existing books retroactively successfully.");
} catch (err) {
  console.error("Migration error:", err);
}

module.exports = db;


