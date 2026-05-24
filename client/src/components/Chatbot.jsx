import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import { useUser } from '../hooks/useUser';

const renderMarkdown = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  
  return lines.map((line, idx) => {
    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }
    
    const processInline = (str) => {
      const parts = [];
      let currentStr = str;
      const boldRegex = /\*\*([^*]+?)\*\*/g;
      let match;
      let lastIndex = 0;
      
      while ((match = boldRegex.exec(currentStr)) !== null) {
        if (match.index > lastIndex) {
          parts.push(currentStr.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < currentStr.length) {
        parts.push(currentStr.substring(lastIndex));
      }
      
      return parts.length > 0 ? parts : str;
    };

    const bulletMatch = line.match(/^[\*\-]\s+(.*)/);
    if (bulletMatch) {
      return (
        <div key={idx} className="pl-3 flex items-start gap-2 my-0.5">
          <span className="text-uady-blue font-bold mt-1 shrink-0">•</span>
          <span className="text-gray-700 flex-1">{processInline(bulletMatch[1])}</span>
        </div>
      );
    }
    
    return (
      <p key={idx} className="text-gray-700 my-0.5">
        {processInline(line)}
      </p>
    );
  });
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy BiblioFlix. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const handleSend = async () => {
    if (!query.trim()) return;
    
    const userMsg = { role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', { query, userId: user?.id || 'invitado' });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: res.data.response,
        matchedBooks: res.data.matchedBooks
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error al conectar con BiblioFlix.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-uady-blue text-white shadow-2xl transition-transform hover:scale-110 flex items-center justify-center"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 rounded-2xl bg-white shadow-2xl border overflow-hidden flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-uady-blue p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-uady-gold" />
              <span className="font-bold text-sm">Pregúntale a BiblioFlix</span>
            </div>
            <button onClick={() => setIsOpen(false)}><X className="h-5 w-5" /></button>
          </div>
          
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === 'user' ? 'bg-uady-blue text-white' : 'bg-gray-100 text-gray-800'
                }`}>
                  {m.role === 'user' ? (
                    <div className="whitespace-pre-line leading-relaxed">{m.text}</div>
                  ) : (
                    <div className="leading-relaxed space-y-1">{renderMarkdown(m.text)}</div>
                  )}
                  
                  {m.matchedBooks && m.matchedBooks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50 space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Enlaces a libros sugeridos:</p>
                      <div className="flex flex-col gap-2">
                        {m.matchedBooks.map((book) => (
                          <div key={book.id} className="flex flex-col gap-1 p-2.5 rounded-xl bg-white border border-gray-150 shadow-sm transition-all hover:border-blue-200">
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-gray-900 leading-snug line-clamp-1">{book.title}</p>
                              <p className="text-[10px] text-gray-500 truncate">{book.author}</p>
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 shrink-0">
                              <Link
                                to={`/book/${book.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-uady-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                              >
                                Ver Detalles
                              </Link>
                              {book.link && (
                                <a
                                  href={book.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                                >
                                  Catálogo Koha
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm animate-pulse">...</div>
              </div>
            )}
          </div>

          <div className="p-4 border-t flex gap-2">
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe tu duda..."
              className="flex-1 text-sm border-none focus:ring-0"
            />
            <button onClick={handleSend} className="text-uady-blue"><Send className="h-5 w-5" /></button>
          </div>
        </div>
      )}
    </>
  );
}
