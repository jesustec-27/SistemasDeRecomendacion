const fetch = require('node-fetch');
const https = require('https');
const { XMLParser } = require('fast-xml-parser');

const agent = new https.Agent({
  rejectUnauthorized: false
});

const RSS_URL = 'https://bibliotecahub.uady.mx/cgi-bin/koha/opac-search.pl?idx=&q=&limit=branch%3AINGE&count=200&sort_by=acqdate_dsc&format=rss';

function extractAndUpgradeCover(description) {
  if (!description) return null;
  
  let coverUrl = null;
  
  if (typeof description === 'object') {
    // fast-xml-parser parsea el CDATA con HTML como un objeto anidado si contiene tags
    if (description.img && description.img['@_src']) {
      coverUrl = description.img['@_src'];
    }
  } else if (typeof description === 'string') {
    // Fallback en caso de que lo parseara como string
    const match = description.match(/src=["']([^"']+)["']/i);
    if (match) {
      coverUrl = match[1];
    }
  }

  // Si encontramos la imagen de Amazon, la mejoramos a alta calidad (TZZZZZZZ -> LZZZZZZZ)
  if (coverUrl && coverUrl.includes('.TZZZZZZZ.')) {
    coverUrl = coverUrl.replace('.TZZZZZZZ.', '.LZZZZZZZ.');
  }
  
  return coverUrl;
}

function extractISBN(identifier) {
  if (!identifier) return null;
  
  const extractFromText = (text) => {
    // Buscar todas las secuencias que parezcan números ISBN de 10 o 13 dígitos
    const matches = text.match(/([0-9X\- ]{10,20})/gi);
    if (matches) {
      const cleanIsbns = matches
        .map(m => m.replace(/[^0-9X]/gi, ''))
        .filter(c => c.length === 10 || c.length === 13);
        
      // Priorizar el de 13 dígitos por ser más estándar y moderno
      const isbn13 = cleanIsbns.find(c => c.length === 13);
      if (isbn13) return isbn13;
      const isbn10 = cleanIsbns.find(c => c.length === 10);
      if (isbn10) return isbn10;
    }
    return null;
  };

  if (typeof identifier === 'string') {
    return extractFromText(identifier);
  } else if (Array.isArray(identifier)) {
    for (const part of identifier) {
      if (typeof part === 'string') {
        const res = extractFromText(part);
        if (res) return res;
      }
    }
  }
  
  return null;
}

function parseTitleAndAuthor(rawTitle, rawCreator) {
  let title = rawTitle || 'Untitled';
  let author = rawCreator || 'Autor desconocido';

  let splitIndex = -1;
  let separatorLength = 0;

  if (title.includes(' / | ')) {
    splitIndex = title.lastIndexOf(' / | ');
    separatorLength = 5;
  } else if (title.includes(' / |')) {
    splitIndex = title.lastIndexOf(' / |');
    separatorLength = 4;
  } else if (title.includes(' / ')) {
    splitIndex = title.lastIndexOf(' / ');
    separatorLength = 3;
  } else if (title.includes('/ | ')) {
    splitIndex = title.lastIndexOf('/ | ');
    separatorLength = 4;
  } else if (title.includes('/ |')) {
    splitIndex = title.lastIndexOf('/ |');
    separatorLength = 3;
  } else if (title.includes('/ ')) {
    splitIndex = title.lastIndexOf('/ ');
    separatorLength = 2;
  } else if (title.includes('/')) {
    const idx = title.lastIndexOf('/');
    if (idx > 0 && idx < title.length - 1) {
      const prevChar = title[idx - 1];
      const nextChar = title[idx + 1];
      if (!(/[0-9]/.test(prevChar) && /[0-9]/.test(nextChar))) {
        splitIndex = idx;
        separatorLength = 1;
      }
    }
  }

  if (splitIndex !== -1) {
    const potentialTitle = title.substring(0, splitIndex).trim();
    let potentialAuthor = title.substring(splitIndex + separatorLength).trim();

    if (potentialAuthor.startsWith('|')) {
      potentialAuthor = potentialAuthor.substring(1).trim();
    }
    
    potentialAuthor = potentialAuthor.replace(/[\.\s;]+$/, '').trim();
    title = potentialTitle;

    if (potentialAuthor && (!rawCreator || rawCreator === 'Autor desconocido')) {
      let cleanAuthor = potentialAuthor;
      const lower = cleanAuthor.toLowerCase();
      if (lower.startsWith('by ')) {
        cleanAuthor = cleanAuthor.substring(3).trim();
      } else if (lower.startsWith('edited by ')) {
        cleanAuthor = cleanAuthor.substring(10).trim();
      } else if (lower.startsWith('editor ')) {
        cleanAuthor = cleanAuthor.substring(7).trim();
      } else if (lower.startsWith('autor ')) {
        cleanAuthor = cleanAuthor.substring(6).trim();
      }
      
      cleanAuthor = cleanAuthor.replace(/[\.\s,;]+$/, '').trim();
      if (cleanAuthor) {
        author = cleanAuthor;
      }
    }
  }

  // Clean trailing punctuation and pipes from title
  title = title.replace(/[\s\/\:\;\-\|]+$/, '').trim();
  
  if (author && author !== 'Autor desconocido') {
    let cleanAuthor = author;
    const lower = cleanAuthor.toLowerCase();
    if (lower.startsWith('by ')) {
      cleanAuthor = cleanAuthor.substring(3).trim();
    } else if (lower.startsWith('edited by ')) {
      cleanAuthor = cleanAuthor.substring(10).trim();
    } else if (lower.startsWith('editor ')) {
      cleanAuthor = cleanAuthor.substring(7).trim();
    } else if (lower.startsWith('autor ')) {
      cleanAuthor = cleanAuthor.substring(6).trim();
    }
    
    cleanAuthor = cleanAuthor.replace(/[\.\s,;]+$/, '').trim();
    author = cleanAuthor;
  }

  return { title, author };
}

function extractPagesFromDescription(description) {
  if (!description) return null;
  
  let text = "";
  if (typeof description === 'string') {
    text = description;
  } else if (typeof description === 'object') {
    text = JSON.stringify(description);
  }
  
  text = text.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/<[^>]*>/g, ' ');
  
  // Regex para buscar el total de páginas físicas, ej: "305 p.", "400 pags"
  // Ignoramos rangos bibliográficos como "p. 203-205" usando lookbehinds y lookaheads
  const regex = /(?<!p\.\s*)\b(\d+)\s*(?:p\b|pág|pages|páginas|pp\b)(?!\s*-\s*\d+)/i;
  const match = text.match(regex);
  if (match) {
    const pages = parseInt(match[1], 10);
    if (pages > 0 && pages < 5000) {
      return pages;
    }
  }
  return null;
}

async function fetchKohaRSS() {
  try {
    const response = await fetch(RSS_URL, { agent });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const xmlData = await response.text();
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    
    const jsonObj = parser.parse(xmlData);
    
    let items = jsonObj.rss?.channel?.item || [];
    if (!Array.isArray(items)) {
      items = [items];
    }

    const fs = require('fs');
    const path = require('path');
    try {
      fs.writeFileSync(path.join(__dirname, '../debug_raw_items.json'), JSON.stringify(items.slice(0, 50), null, 2));
    } catch (e) {
      console.error('Error writing debug_raw_items:', e);
    }
    
    return items.map(item => {
      // Extraer biblionumber del link
      const biblionumber = item.link?.match(/biblionumber=(\d+)/)?.[1] || 
                           item.guid?.['#text'] || 
                           item.guid ||
                           Math.random().toString(36).substr(2, 9);
      
      // Los sujetos pueden venir en dc:subject
      let subjects = item['dc:subject'];
      if (typeof subjects === 'string') {
        subjects = [subjects];
      } else if (!Array.isArray(subjects)) {
        subjects = [];
      }

      const isbn = extractISBN(item['dc:identifier']);
      const coverUrl = extractAndUpgradeCover(item.description);
      
      // Separar título y autor e intentar deducir el autor real si está en el título
      const parsed = parseTitleAndAuthor(item.title, item['dc:creator']);
      
      // Parsear páginas desde la descripción del XML
      const pages = extractPagesFromDescription(item.description);

      return {
        id: biblionumber,
        title: parsed.title,
        author: parsed.author,
        subjects: subjects,
        category: item.category || 'General',
        link: item.link,
        acquiredAt: item.pubDate || new Date().toISOString(),
        branch: 'INGE',
        isbn: isbn,
        cover_url: coverUrl,
        pages: pages
      };
    });
  } catch (error) {
    console.error('Error fetching Koha RSS:', error);
    return [];
  }
}

module.exports = { fetchKohaRSS };

