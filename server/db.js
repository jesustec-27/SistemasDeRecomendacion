const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'biblioia.db'));

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

// Limpieza automática de portadas de provisión previas (Koha placeholders o links rotos)
try {
  db.prepare(`
    UPDATE books 
    SET cover_url = NULL 
    WHERE cover_url LIKE '%no-image%' 
       OR cover_url LIKE '%no-img%' 
       OR cover_url LIKE '%opac-tmpl%' 
       OR cover_url LIKE '%spacer.gif%'
       OR (cover_url IS NOT NULL AND cover_url NOT LIKE 'http://%' AND cover_url NOT LIKE 'https://%')
  `).run();
} catch (e) {
  console.error("Error al limpiar portadas de provisión previas en SQLite:", e);
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


