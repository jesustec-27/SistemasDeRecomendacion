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

  if (!coverUrl) return null;

  const lowercaseUrl = coverUrl.toLowerCase();
  // Descartar placeholders genéricos y URLs relativas de Koha
  if (
    lowercaseUrl.includes('no-image') ||
    lowercaseUrl.includes('no-img') ||
    lowercaseUrl.includes('opac-tmpl') ||
    lowercaseUrl.includes('spacer.gif') ||
    (!lowercaseUrl.startsWith('http://') && !lowercaseUrl.startsWith('https://'))
  ) {
    return null;
  }

  // Si encontramos la imagen de Amazon, la mejoramos a alta calidad (TZZZZZZZ -> LZZZZZZZ)
  if (coverUrl.includes('.TZZZZZZZ.')) {
    coverUrl = coverUrl.replace('.TZZZZZZZ.', '.LZZZZZZZ.');
  }

  // Garantizar que la portada siempre sea HTTPS
  if (coverUrl.startsWith('http://')) {
    coverUrl = coverUrl.replace('http://', 'https://');
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
      // 1. Extraer el string del link de forma segura (soporta string u objeto con #text/@_href)
      let actualLink = '';
      if (typeof item.link === 'string') {
        actualLink = item.link;
      } else if (item.link?.['#text']) {
        actualLink = item.link['#text'];
      } else if (item.link?.['@_href']) {
        actualLink = item.link['@_href'];
      } else if (typeof item.guid === 'string') {
        actualLink = item.guid;
      } else if (item.guid?.['#text']) {
        actualLink = item.guid['#text'];
      }

      // 2. Extraer biblionumber del link o del guid
      let biblionumber = null;
      if (actualLink) {
        const match = actualLink.match(/biblionumber=(\d+)/);
        if (match) biblionumber = match[1];
      }
      
      if (!biblionumber) {
        const guidStr = typeof item.guid === 'string' ? item.guid : item.guid?.['#text'] || '';
        const match = guidStr.match(/biblionumber=(\d+)/);
        biblionumber = match ? match[1] : guidStr || Math.random().toString(36).substr(2, 9);
      }

      // 3. Si actualLink es nulo o inválido, construirlo usando el biblionumber
      if (!actualLink || actualLink.includes('[object')) {
        actualLink = `https://bibliotecahub.uady.mx/cgi-bin/koha/opac-detail.pl?biblionumber=${biblionumber}`;
      }
      
      // Los sujetos pueden venir en dc:subject
      let subjects = item['dc:subject'];
      if (typeof subjects === 'string') {
        subjects = [subjects];
      } else if (!Array.isArray(subjects)) {
        subjects = [];
      }

      let isbn = extractISBN(item['dc:identifier']);
      
      // Intentar extraer el ISBN de la descripción si no se encontró en dc:identifier
      if (!isbn && typeof item.description === 'string') {
        isbn = extractISBN(item.description);
      }
      
      let coverUrl = extractAndUpgradeCover(item.description);
      
      // Si la portada de la descripción es nula, vacía o inválida, y tenemos un ISBN válido,
      // generamos un enlace de portada directo, seguro (HTTPS) y de alta calidad a Amazon
      if ((!coverUrl || coverUrl.includes('no-image') || coverUrl.includes('no-img')) && isbn) {
        coverUrl = `https://images-na.ssl-images-amazon.com/images/P/${isbn}.01.LZZZZZZZ.jpg`;
      }
      
      // Garantizar que todos los enlaces de portadas usen HTTPS para evitar problemas de contenido mixto
      if (coverUrl && coverUrl.startsWith('http://')) {
        coverUrl = coverUrl.replace('http://', 'https://');
      }
      
      // Separar título y autor e intentar deducir el autor real si está en el título
      const parsed = parseTitleAndAuthor(item.title, item['dc:creator']);
      
      // Parsear páginas desde la descripción del XML
      const pages = extractPagesFromDescription(item.description);

      return {
        id: biblionumber,
        title: parsed.title,
        author: parsed.author,
        subjects: subjects,
        category: categorizeBook(parsed.title),
        link: actualLink,
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

module.exports = { fetchKohaRSS };

