const fetch = require('node-fetch');
const https = require('https');
const { XMLParser } = require('fast-xml-parser');

const agent = new https.Agent({
  rejectUnauthorized: false
});

const RSS_URL = 'https://bibliotecahub.uady.mx/cgi-bin/koha/opac-search.pl?idx=&q=&limit=branch%3AINGE&count=200&sort_by=acqdate_dsc&format=rss';

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
    
    // El RSS puede tener un solo item o un array
    let items = jsonObj.rss?.channel?.item || [];
    if (!Array.isArray(items)) {
      items = [items];
    }
    
    return items.map(item => {
      // Extraer biblionumber del link (ej: .../opac-detail.pl?biblionumber=23565)
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

      return {
        id: biblionumber,
        title: item.title || 'Untitled',
        author: item['dc:creator'] || 'Autor desconocido',
        subjects: subjects,
        category: item.category || 'General',
        link: item.link,
        acquiredAt: item.pubDate || new Date().toISOString(),
        branch: 'INGE'
      };
    });
  } catch (error) {
    console.error('Error fetching Koha RSS:', error);
    return [];
  }
}

module.exports = { fetchKohaRSS };
