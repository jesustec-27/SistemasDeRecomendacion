import { useUser } from '../hooks/useUser';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, LogOut, Heart, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const TAGS_PREDEFINIDOS = [
  'Algoritmos', 'Redes', 'Bases de Datos', 'Cálculo', 'Física', 'Gestión', 
  'Estructuras', 'Termodinámica', 'Programación', 'Inteligencia Artificial',
  'Matemáticas', 'Química', 'Electrónica', 'Software', 'Economía'
];

export default function Profile() {
  const { user, logout, saveUser } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInterests, setEditedInterests] = useState([]);
  const [saving, setSaving] = useState(false);

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

  const handleEditClick = () => {
    setEditedInterests(user?.interests || []);
    setIsEditing(true);
  };

  const toggleInterest = (tag) => {
    setEditedInterests(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (editedInterests.length < 3) {
      alert("Por favor selecciona al menos 3 intereses.");
      return;
    }
    setSaving(true);
    try {
      const updatedUser = {
        ...user,
        interests: editedInterests
      };
      const success = await saveUser(updatedUser);
      if (success) {
        setIsEditing(false);
      } else {
        alert("Error al guardar intereses.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-uady-blue">
        <ChevronLeft className="h-4 w-4" /> Volver al feed
      </Link>

      <div className="mb-12 flex items-center justify-between rounded-2xl bg-uady-blue p-8 text-white shadow-lg">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-uady-gold flex items-center justify-center text-3xl font-bold text-uady-blue">
            {(user?.nombre || user?.carrera)?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.nombre || user?.carrera}</h1>
            <p className="opacity-80">
              {user?.nombre ? `Ingeniería ${user?.carrera} • ` : ''}{user?.semestre}º Semestre
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            logout();
            window.location.href = '/';
          }}
          className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
        >
          <LogOut className="h-4 w-4" /> Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Intereses */}
        {!isEditing ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm border animate-in fade-in duration-300">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-gray-700">
              <User className="h-5 w-5 text-uady-blue" /> Tus Intereses
            </h2>
            <div className="flex flex-wrap gap-2">
              {user?.interests?.map(tag => (
                <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-uady-blue font-medium">
                  {tag}
                </span>
              ))}
            </div>
            <button 
              onClick={handleEditClick}
              className="mt-6 text-sm font-bold text-uady-blue hover:underline"
            >
              Editar Perfil
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-uady-gold/50 animate-in zoom-in-95 duration-300">
            <h2 className="mb-2 flex items-center gap-2 font-bold text-gray-700">
              <User className="h-5 w-5 text-uady-blue" /> Editar Intereses
            </h2>
            <p className="text-xs text-gray-400 mb-4">Selecciona al menos 3 intereses para personalizar tus recomendaciones.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {TAGS_PREDEFINIDOS.map(tag => {
                const isSelected = editedInterests.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleInterest(tag)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected 
                        ? 'bg-uady-gold/20 text-uady-blue border-2 border-uady-gold shadow-sm' 
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-2 border-gray-100'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-uady-blue px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50 transition-all shadow-sm"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

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

      {/* Elementos Favoritos / Guardados */}
      {(() => {
        const savedBooks = [];
        const seenBookIds = new Set();
        history.forEach(item => {
          if (item.type === 'save' && !seenBookIds.has(item.book_id)) {
            seenBookIds.add(item.book_id);
            savedBooks.push(item);
          }
        });

        if (savedBooks.length === 0) {
          return (
            <div className="mt-8 rounded-2xl bg-white p-8 text-center border-2 border-dashed border-gray-200 py-16 animate-in fade-in duration-300">
              <Heart className="mx-auto mb-4 h-12 w-12 text-gray-200 animate-pulse" />
              <h3 className="text-lg font-bold text-gray-700 mb-1">Aún no tienes elementos favoritos</h3>
              <p className="text-sm text-gray-400">Presiona el botón "Guardar" en las tarjetas de libros del catálogo para agregarlos aquí.</p>
            </div>
          );
        }

        return (
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm border animate-in fade-in duration-500">
            <h2 className="mb-6 flex items-center gap-2 font-bold text-gray-800 text-lg border-b pb-4">
              <Heart className="h-5 w-5 text-red-500 fill-red-500" /> Mis Elementos Favoritos ({savedBooks.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {savedBooks.map((item, idx) => (
                <div key={idx} className="flex gap-4 rounded-xl border p-3 hover:shadow-md transition-all group bg-white hover:border-uady-gold/30">
                  <div className="h-20 w-14 overflow-hidden rounded bg-gray-50 flex-shrink-0 relative shadow-sm aspect-[3/4] flex">
                    {item.cover_url ? (
                      <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-uady-blue to-[#002142] flex items-center justify-center text-[10px] text-white/80 p-1 font-bold text-center uppercase leading-none">
                        {item.title?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-between overflow-hidden flex-grow">
                    <div className="overflow-hidden">
                      <h4 className="line-clamp-2 text-xs font-bold leading-tight group-hover:text-uady-blue">
                        <Link to={`/book/${item.book_id}`}>{item.title}</Link>
                      </h4>
                      <p className="truncate text-[10px] text-gray-400 mt-1 italic">{item.author}</p>
                    </div>
                    <Link 
                      to={`/book/${item.book_id}`}
                      className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-uady-blue hover:underline"
                    >
                      Ver detalles →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
