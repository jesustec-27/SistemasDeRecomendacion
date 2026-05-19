import { useUser } from '../hooks/useUser';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, LogOut, Heart, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`/api/interactions/user/${user.id}`);
        setHistory(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchHistory();
  }, [user]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-uady-blue">
        <ChevronLeft className="h-4 w-4" /> Volver al feed
      </Link>

      <div className="mb-12 flex items-center justify-between rounded-2xl bg-uady-blue p-8 text-white shadow-lg">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-uady-gold flex items-center justify-center text-3xl font-bold text-uady-blue">
            {user?.carrera?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.carrera}</h1>
            <p className="opacity-80">{user?.semestre}º Semestre</p>
          </div>
        </div>
        <button 
          onClick={() => {
            logout();
            window.location.href = '/onboarding';
          }}
          className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
        >
          <LogOut className="h-4 w-4" /> Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Intereses */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-gray-700">
            <User className="h-5 w-5 text-uady-blue" /> Tus Intereses
          </h2>
          <div className="flex flex-wrap gap-2">
            {user?.interests?.map(tag => (
              <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                {tag}
              </span>
            ))}
          </div>
          <button className="mt-6 text-sm font-bold text-uady-blue hover:underline">
            Editar Perfil
          </button>
        </div>

        {/* Historial Reciente */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-gray-700">
            <Clock className="h-5 w-5 text-uady-blue" /> Actividad Reciente
          </h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-gray-400">Cargando actividad...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No has interactuado con libros aún.</p>
            ) : (
              history.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className={`rounded p-1 ${item.type === 'save' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    {item.type === 'save' ? <Heart className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 truncate">
                    <span className="font-bold">{item.type === 'save' ? 'Guardaste' : 'Viste'}</span> {item.title}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
