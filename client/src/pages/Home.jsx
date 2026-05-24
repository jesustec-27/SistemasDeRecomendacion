import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../hooks/useUser';
import BookCard from '../components/BookCard';
import Chatbot from '../components/Chatbot';
import { Sparkles, RefreshCw, Settings, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const { user } = useUser();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        // Modo Personalizado (Usuario con Sesión)
        const storedWeights = localStorage.getItem('biblioia_weights');
        const { content = 0.6, collab = 0.4 } = storedWeights ? JSON.parse(storedWeights) : {};
        const res = await axios.get(`/api/recommendations/${user.id}?boosted=true&contentWeight=${content}&collabWeight=${collab}`);
        setRecommendations(res.data);
      } else {
        // Modo Invitado (Catálogo General)
        const res = await axios.get('/api/books');
        setRecommendations(res.data);
      }
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
    fetchRecommendations();
  }, [user]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-uady-blue tracking-tight">BiblioIA UADY</h1>
          {user ? (
            <p className="text-gray-500 mt-1">
              Hola, <strong className="text-uady-blue font-semibold">{user.carrera}</strong>. Aquí tienes tus recomendaciones personalizadas de hoy.
            </p>
          ) : (
            <p className="text-gray-500 mt-1">
              Explora el catálogo de ingeniería. Inicia sesión para obtener recomendaciones para tu carrera.
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          {user ? (
            <>
              <button 
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                Sincronizar Catálogo
              </button>
              <Link 
                to="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-uady-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 transition-all shadow-sm"
              >
                <Settings className="h-4 w-4" />
                Configurar Algoritmo
              </Link>
              <Link to="/profile">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-uady-gold p-0.5 shadow-sm transition-transform hover:scale-105">
                   <div className="flex h-full w-full items-center justify-center rounded-full bg-white font-bold text-uady-blue text-sm uppercase">
                     {user.carrera?.[0]}
                   </div>
                </div>
              </Link>
            </>
          ) : (
            <Link 
              to="/onboarding"
              className="flex items-center gap-2 rounded-xl bg-uady-gold px-6 py-3 font-bold text-uady-blue hover:bg-yellow-500 transition-all shadow-md transform hover:-translate-y-0.5"
            >
              <LogIn className="h-4 w-4" />
              Iniciar Sesión / Matrícula
            </Link>
          )}
        </div>
      </header>

      {/* Main section title */}
      <h2 className="mb-6 text-xl font-bold text-gray-800 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-uady-gold" />
        {user ? 'Recomendaciones para Ti' : 'Libros Sugeridos en General'}
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center bg-white shadow-sm">
          <Sparkles className="mb-4 h-12 w-12 text-gray-300 animate-pulse" />
          <h2 className="text-xl font-medium text-gray-600">No hay libros todavía</h2>
          {user ? (
            <>
              <p className="mb-6 text-gray-500">Sincroniza el catálogo de la biblioteca para comenzar.</p>
              <button onClick={handleSync} className="rounded-lg bg-uady-blue px-6 py-2.5 text-white font-semibold hover:bg-blue-800 transition-all">
                Sincronizar Ahora
              </button>
            </>
          ) : (
            <p className="text-gray-500">El catálogo se encuentra vacío.</p>
          )}
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
