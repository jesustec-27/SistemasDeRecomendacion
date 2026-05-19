import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { BookOpen, GraduationCap, Tags, ChevronRight, ChevronLeft } from 'lucide-react';

const CARRERAS = ['Sistemas', 'Civil', 'Mecatrónica', 'Industrial', 'Renovables', 'Logística'];
const TAGS_PREDEFINIDOS = [
  'Algoritmos', 'Redes', 'Bases de Datos', 'Cálculo', 'Física', 'Gestión', 
  'Estructuras', 'Termodinámica', 'Programación', 'Inteligencia Artificial',
  'Matemáticas', 'Química', 'Electrónica', 'Software', 'Economía'
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    carrera: '',
    semestre: 1,
    interests: []
  });
  const { saveUser } = useUser();
  const navigate = useNavigate();

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const toggleInterest = (tag) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(tag)
        ? prev.interests.filter(t => t !== tag)
        : [...prev.interests, tag]
    }));
  };

  const handleFinish = async () => {
    if (formData.interests.length < 3) {
      alert("Por favor selecciona al menos 3 intereses.");
      return;
    }
    const success = await saveUser(formData);
    if (success) navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {/* Progress Bar */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`h-2 flex-1 rounded-full transition-colors ${i <= step ? 'bg-uady-blue' : 'bg-gray-200'}`} 
            />
          ))}
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <GraduationCap className="mb-4 h-12 w-12 text-uady-blue" />
            <h1 className="mb-2 text-2xl font-bold">¿Qué estudias?</h1>
            <p className="mb-6 text-gray-500">Selecciona tu carrera para personalizar tus recomendaciones.</p>
            <div className="grid grid-cols-2 gap-3">
              {CARRERAS.map(c => (
                <button
                  key={c}
                  onClick={() => setFormData({ ...formData, carrera: c })}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                    formData.carrera === c ? 'border-uady-blue bg-blue-50 text-uady-blue' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <BookOpen className="mb-4 h-12 w-12 text-uady-blue" />
            <h1 className="mb-2 text-2xl font-bold">¿En qué semestre estás?</h1>
            <p className="mb-6 text-gray-500">Esto nos ayuda a saber el nivel de los libros que necesitas.</p>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                <button
                  key={s}
                  onClick={() => setFormData({ ...formData, semestre: s })}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                    formData.semestre === s ? 'border-uady-blue bg-blue-50 text-uady-blue' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <Tags className="mb-4 h-12 w-12 text-uady-blue" />
            <h1 className="mb-2 text-2xl font-bold">Temas de interés</h1>
            <p className="mb-6 text-gray-500">Selecciona al menos 3 áreas que te apasionen.</p>
            <div className="flex flex-wrap gap-2">
              {TAGS_PREDEFINIDOS.map(t => (
                <button
                  key={t}
                  onClick={() => toggleInterest(t)}
                  className={`rounded-full px-4 py-2 text-sm transition-all ${
                    formData.interests.includes(t) 
                      ? 'bg-uady-blue text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <button onClick={handleBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
              <ChevronLeft className="h-4 w-4" /> Atrás
            </button>
          )}
          <div className="ml-auto">
            {step < 3 ? (
              <button 
                disabled={step === 1 && !formData.carrera}
                onClick={handleNext} 
                className="flex items-center gap-1 rounded-lg bg-uady-blue px-6 py-2 text-white disabled:opacity-50"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button 
                onClick={handleFinish} 
                className="rounded-lg bg-uady-gold px-8 py-2 font-bold text-uady-blue hover:bg-yellow-500"
              >
                Comenzar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
