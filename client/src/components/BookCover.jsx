import { useState } from 'react';
import { BookOpen } from 'lucide-react';

export default function BookCover({ coverUrl, title, author, category, className = "" }) {
  const [hasError, setHasError] = useState(false);

  // Generar un fondo determinista pero vistoso basado en el título del libro
  const getGradientClass = (str) => {
    if (!str) return 'from-uady-blue to-[#002142]';
    const num = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const options = [
      'from-uady-blue via-[#002244] to-[#0b132b]',
      'from-[#0f2027] via-[#203a43] to-[#2c5364]',
      'from-uady-blue via-[#0c2445] to-[#1d3557]',
      'from-[#2c3e50] via-[#34495e] to-[#1a252f]',
      'from-[#141e30] to-[#243b55]'
    ];
    return options[num % options.length];
  };

  const gradient = getGradientClass(title);

  const isPlaceholderCover = (url) => {
    if (!url) return true;
    const lowercaseUrl = url.toLowerCase();
    
    if (
      lowercaseUrl.includes('no-image') ||
      lowercaseUrl.includes('no-img') ||
      lowercaseUrl.includes('opac-tmpl') ||
      lowercaseUrl.includes('spacer.gif')
    ) {
      return true;
    }
    
    const isAbsolute = lowercaseUrl.startsWith('http://') || lowercaseUrl.startsWith('https://');
    const isRelative = lowercaseUrl.startsWith('/') || 
                       lowercaseUrl.includes('.jpg') || 
                       lowercaseUrl.includes('.png') || 
                       lowercaseUrl.includes('.jpeg') || 
                       lowercaseUrl.includes('.webp') || 
                       lowercaseUrl.includes('.svg');
                       
    return !isAbsolute && !isRelative;
  };

  if (coverUrl && !isPlaceholderCover(coverUrl) && !hasError) {
    return (
      <img
        src={coverUrl}
        alt={title}
        onLoad={(e) => {
          if (e.target.naturalWidth <= 1 && e.target.naturalHeight <= 1) {
            setHasError(true);
          }
        }}
        onError={() => setHasError(true)}
        className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${className}`}
      />
    );
  }

  // Placeholder premium con diseño de portada clásica
  return (
    <div className={`relative flex h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-br ${gradient} p-5 text-white shadow-inner border-l-[6px] border-uady-gold/90 ${className}`}>
      {/* Patrón de líneas sutil de fondo (Marca de agua de libro elegante) */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Cabecera de la Portada */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-[10px] font-bold tracking-widest text-uady-gold uppercase">
          {category || 'Biblioteca UADY'}
        </span>
        <BookOpen className="h-3.5 w-3.5 text-uady-gold/80" />
      </div>

      {/* Título en el Centro */}
      <div className="my-auto py-4 text-center">
        <h4 className="font-serif text-lg font-semibold leading-snug text-gray-100 line-clamp-4 px-1 drop-shadow-md">
          {title}
        </h4>
        {/* Adorno sutil */}
        <div className="mx-auto mt-3 h-[1px] w-12 bg-uady-gold/60" />
      </div>

      {/* Autor y pie de la portada */}
      <div className="border-t border-white/10 pt-2 text-center">
        <p className="line-clamp-1 text-xs font-medium text-gray-300 italic">
          {author || 'Autor Desconocido'}
        </p>
        <p className="mt-1 text-[8px] tracking-wider text-uady-gold/70 font-semibold uppercase">
          Facultad de Ingeniería
        </p>
      </div>
    </div>
  );
}
