import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../hooks/useUser';
import BookCard from '../components/BookCard';
import Chatbot from '../components/Chatbot';
import { Sparkles, RefreshCw, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const { user } = useUser();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/recommendations/${user.id}?boosted=true`);
      setRecommendations(res.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await axios.post('/api/etl/sync');
      await fetchRecommendations();
    } catch (error) {
      alert('Error sincronizando el catálogo');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (user) fetchRecommendations();
  }, [user]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-uady-blue">BiblioIA UADY</h1>
          <p className="text-gray-500">Hola, {user?.carrera}. Aquí tienes tus recomendaciones de hoy.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar Catálogo
          </button>
          <Link 
            to="/dashboard"
            className="flex items-center gap-2 rounded-lg bg-uady-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            <Settings className="h-4 w-4" />
            Configurar Algoritmo
          </Link>
          <Link to="/profile">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-uady-gold p-0.5">
               <div className="flex h-full w-full items-center justify-center rounded-full bg-white font-bold text-uady-blue">
                 {user?.carrera?.[0]}
               </div>
            </div>
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <Sparkles className="mb-4 h-12 w-12 text-gray-300" />
          <h2 className="text-xl font-medium text-gray-600">No hay recomendaciones todavía</h2>
          <p className="mb-6 text-gray-500">Sincroniza el catálogo de la biblioteca para comenzar.</p>
          <button onClick={handleSync} className="rounded-lg bg-uady-blue px-6 py-2 text-white">
            Sincronizar Ahora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recommendations.slice(0, 20).map((book, idx) => (
            <BookCard key={book.id} book={book} index={idx} />
          ))}
        </div>
      )}
      <Chatbot />
    </div>
  );
}
