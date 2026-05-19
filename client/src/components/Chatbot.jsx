import { useState } from 'react';
import axios from 'axios';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import { useUser } from '../hooks/useUser';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy BiblioIA. ¿En qué puedo ayudarte hoy?' }
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
      const res = await axios.post('/api/chat', { query, userId: user.id });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error al conectar con Claude.' }]);
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
              <span className="font-bold text-sm">Pregúntale a BiblioIA</span>
            </div>
            <button onClick={() => setIsOpen(false)}><X className="h-5 w-5" /></button>
          </div>
          
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === 'user' ? 'bg-uady-blue text-white' : 'bg-gray-100 text-gray-800'
                }`}>
                  {m.text}
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
