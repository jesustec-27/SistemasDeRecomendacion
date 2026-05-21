const express = require('express');
const router = express.Router();
const { fetchKohaRSS } = require('../services/rssParser');
const { enrichWithOpenLibrary } = require('../services/enricher');
const db = require('../db');

router.all('/sync', async (req, res) => {
  try {
    const rawBooks = await fetchKohaRSS();
    let syncCount = 0;
    
    // Preparar el statement para insertar/actualizar
    const upsertStmt = db.prepare(`
      INSERT INTO books (id, title, author, subjects, category, cover_url, link, acquired_at, branch, pages, publisher)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        author=excluded.author,
        subjects=excluded.subjects,
        category=excluded.category,
        cover_url=excluded.cover_url,
        link=excluded.link,
        acquired_at=excluded.acquired_at,
        pages=excluded.pages,
        publisher=excluded.publisher
    `);

    for (const book of rawBooks) {
      const enriched = await enrichWithOpenLibrary(book);
      
      upsertStmt.run(
        enriched.id,
        enriched.title,
        enriched.author,
        JSON.stringify(enriched.subjects || []),
        enriched.category,
        enriched.cover_url || null,
        enriched.link,
        enriched.acquiredAt,
        enriched.branch,
        enriched.pages || null,
        enriched.publisher || null
      );
      syncCount++;
    }
    
    res.json({ 
      success: true, 
      message: `Sincronización completada: ${syncCount} libros procesados.`,
      count: syncCount 
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
