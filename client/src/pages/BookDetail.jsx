import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ExternalLink, Book as BookIcon, Hash, Sparkles } from 'lucide-react';
import BookCard from '../components/BookCard';
import { useUser } from '../hooks/useUser';
import BookCover from '../components/BookCover';

export default function BookDetail() {
  const { id } = useParams();
  const { user } = useUser();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [computingSimilar, setComputingSimilar] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      try {
        const params = {};
        if (user?.id) {
          params.userId = user.id;
        }
        const res = await axios.get(`/api/books/${id}`, { params });
        setBook(res.data);
        
        // Una vez tenemos el libro, calculamos similares vía Worker
        setComputingSimilar(true);
        const allBooksRes = await axios.get('/api/books');
        
        const worker = new Worker(new URL('../workers/tfidf.worker.js', import.meta.url), { type: 'module' });
        worker.postMessage({ currentBook: res.data, allBooks: allBooksRes.data });
        
        worker.onmessage = (e) => {
          setSimilarBooks(e.data);
          setComputingSimilar(false);
          worker.terminate();
        };
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id, user?.id]);

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando detalles...</div>;
  if (!book) return <div className="p-10 text-center">Libro no encontrado</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-uady-blue">
        <ChevronLeft className="h-4 w-4" /> Volver al inicio
      </Link>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Portada */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl bg-gray-100 shadow-xl aspect-[3/4] flex">
            <BookCover 
              coverUrl={book.cover_url} 
              title={book.title} 
              author={book.author} 
              category={book.category} 
              isbn={book.isbn}
            />
          </div>
          
          <a 
            href={book.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-uady-blue py-4 font-bold text-white transition-all hover:bg-blue-800"
          >
            Ver en Catálogo Koha <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Metadata */}
        <div className="lg:col-span-2">
          <h1 className="mb-2 text-4xl font-bold text-uady-blue">{book.title}</h1>
          <p className="mb-8 text-xl text-gray-500">{book.author}</p>

          <div className="mb-8 flex flex-wrap gap-2">
            {book.subjects?.map(s => (
              <span key={s} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-uady-blue border border-blue-100">
                {s}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6 rounded-2xl bg-white p-8 shadow-sm">
            {book.pages && book.pages > 0 ? (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2 text-gray-500"><Hash className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">Páginas</p>
                  <p className="font-medium">{book.pages}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2 text-gray-500"><Hash className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">{book.isbn ? 'ISBN' : 'Código Sistema'}</p>
                  <p className="font-medium text-sm break-all">{book.isbn || book.id}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2 text-gray-500"><BookIcon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-400">Biblioteca</p>
                <p className="font-medium">{book.branch || 'INGE'}</p>
              </div>
            </div>
          </div>

          {/* White Box logic visualization */}
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-blue-50/40 via-white to-amber-50/30 p-6 border border-uady-gold/30 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Sparkles className="h-24 w-24 text-uady-gold" />
            </div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 font-bold text-uady-blue">
                <Sparkles className="h-5 w-5 text-uady-gold animate-pulse" />
                <span>¿Por qué te recomendamos esto?</span>
              </div>
              <span className="rounded-full bg-uady-gold/10 px-3 py-0.5 text-xs font-bold text-uady-blue border border-uady-gold/20 tracking-wide uppercase">
                BiblioFlix Match
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-gray-700 italic text-base leading-relaxed pl-4 border-l-2 border-uady-gold/40">
                “{book.explanation || 'Te recomendamos este libro por su relevancia general en tu área de estudio.'}”
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Libros Similares Section */}
      <div className="mt-20">
        <h2 className="mb-8 text-2xl font-bold text-uady-blue">Libros Similares</h2>
        {computingSimilar ? (
          <p className="text-gray-500 flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-uady-blue border-t-transparent" />
            Calculando similitudes con TF-IDF...
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {similarBooks.map(b => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
