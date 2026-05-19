import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ExternalLink, Book as BookIcon, Hash, Building, Calendar, Info } from 'lucide-react';
import BookCard from '../components/BookCard';

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [computingSimilar, setComputingSimilar] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/books/${id}`);
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
  }, [id]);

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
          <div className="overflow-hidden rounded-2xl bg-gray-100 shadow-xl">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full object-cover" />
            ) : (
              <div className="flex aspect-[3/4] flex-col items-center justify-center bg-gray-200 p-12 text-center">
                 <div className="mb-4 text-6xl font-serif text-gray-400">UADY</div>
                 <div className="font-bold text-gray-500 uppercase tracking-widest">{book.category}</div>
              </div>
            )}
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

          <div className="grid grid-cols-1 gap-6 rounded-2xl bg-white p-8 shadow-sm sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2 text-gray-500"><Building className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-400">Editorial</p>
                <p className="font-medium">{book.publisher || 'No disponible'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2 text-gray-500"><Hash className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-400">Páginas</p>
                <p className="font-medium">{book.pages || 'Desconocido'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2 text-gray-500"><Calendar className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-400">Adquirido el</p>
                <p className="font-medium">{new Date(book.acquired_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2 text-gray-500"><BookIcon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-400">Biblioteca</p>
                <p className="font-medium">{book.branch}</p>
              </div>
            </div>
          </div>

          {/* White Box logic visualization */}
          <div className="mt-8 rounded-2xl bg-uady-gold/10 p-6 border border-uady-gold/20">
            <div className="flex items-center gap-2 mb-2 font-bold text-uady-blue">
              <Info className="h-5 w-5" /> ¿Por qué te recomendamos esto?
            </div>
            <p className="text-gray-700 italic">"{book.explanation}"</p>
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
