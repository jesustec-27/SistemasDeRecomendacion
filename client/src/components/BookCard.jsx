import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, Heart, Eye } from 'lucide-react';
import axios from 'axios';
import { useUser } from '../hooks/useUser';
import BookCover from './BookCover';

export default function BookCard({ book }) {
  const { user } = useUser();
  const [isSaved, setIsSaved] = useState(false);

  const handleInteraction = async (type) => {
    if (!user) {
      if (type === 'save') {
        alert("Inicia sesión para guardar tus libros favoritos.");
      }
      return;
    }

    try {
      await axios.post('/api/interactions', {
        user_id: user.id,
        book_id: book.id,
        type
      });
      if (type === 'save') {
        setIsSaved(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const relevancePercent = Math.min((book.relevanceScore || 0) * 100, 100);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <Link 
        to={`/book/${book.id}`} 
        onClick={() => handleInteraction('view')}
        className="relative aspect-[3/4] overflow-hidden bg-gray-100"
      >
        <BookCover 
          coverUrl={book.cover_url} 
          title={book.title} 
          author={book.author} 
          category={book.category} 
          isbn={book.isbn}
        />
        
        {/* Explanation Badge overlay on hover */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex items-start gap-2 text-xs text-white">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-uady-gold" />
            <p>{book.explanation}</p>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 line-clamp-2 font-bold leading-tight group-hover:text-uady-blue">
          {book.title}
        </h3>
        <p className="mb-3 text-sm text-gray-500">{book.author}</p>
        
        <div className="mt-auto space-y-3">
          {/* Relevancia Bar */}
          {book.relevanceScore !== undefined && book.relevanceScore !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <span>Relevancia</span>
                <span>{Math.round(relevancePercent)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div 
                  className="h-full bg-uady-blue transition-all duration-1000" 
                  style={{ width: `${relevancePercent}%` }} 
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button 
              onClick={(e) => {
                e.preventDefault();
                if (!isSaved) handleInteraction('save');
              }}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                isSaved 
                  ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' 
                  : 'border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 transition-transform ${isSaved ? 'fill-red-500 text-red-500 scale-110' : ''}`} />
              {isSaved ? '¡Guardado!' : 'Guardar'}
            </button>
            <Link 
              to={`/book/${book.id}`}
              className="flex items-center justify-center rounded-lg bg-gray-100 px-3 py-1.5 text-gray-600 hover:bg-gray-200"
            >
              <Eye className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
