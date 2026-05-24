import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { BookOpen, GraduationCap, Tags, ChevronRight, ChevronLeft, Fingerprint, Sparkles } from 'lucide-react';

const CARRERAS = ['Sistemas', 'Civil', 'Mecatrónica', 'Industrial', 'Renovables', 'Logística'];
const TAGS_PREDEFINIDOS = [
  'Algoritmos', 'Redes', 'Bases de Datos', 'Cálculo', 'Física', 'Gestión', 
  'Estructuras', 'Termodinámica', 'Programación', 'Inteligencia Artificial',
  'Matemáticas', 'Química', 'Electrónica', 'Software', 'Economía'
];

// Helper para decodificar matrícula de la UADY (Formato: AABBNNNN)
// AA: Año de inicio de ciclo (ej. 19 -> 2019)
// BB: Año de fin de ciclo (ej. 20 -> 2020)
// NNNN: Consecutivo de estudiante, donde el primer dígito (5º de la matrícula) simula la carrera
const decodeMatricula = (matriculaStr) => {
  if (!matriculaStr || matriculaStr.length !== 8) {
    return { carrera: '', semestre: 1, cycleStart: '', cycleEnd: '' };
  }
  
  const yearStr = matriculaStr.substring(0, 2);
  const cycleEndStr = matriculaStr.substring(2, 4);
  const careerDigit = matriculaStr.charAt(4); // 5º dígito
  
  // 1. Determinar Carrera basada en el 5º dígito
  let carrera = 'Sistemas'; // default
  if (careerDigit === '1' || careerDigit === '2') carrera = 'Sistemas';
  else if (careerDigit === '3' || careerDigit === '4') carrera = 'Civil';
  else if (careerDigit === '5' || careerDigit === '6') carrera = 'Mecatrónica';
  else if (careerDigit === '7') carrera = 'Industrial';
  else if (careerDigit === '8') carrera = 'Renovables';
  else if (careerDigit === '9' || careerDigit === '0') carrera = 'Logística';
  
  // 2. Calcular Semestre estimado
  const entryYear = parseInt(yearStr, 10);
  const currentYear = 26; // Año lectivo actual 2026 (correspondiente al local time)
  
  let semestre = 1;
  if (!isNaN(entryYear)) {
    const diff = currentYear - entryYear;
    if (diff <= 0) semestre = 1;
    else if (diff === 1) semestre = 3;
    else if (diff === 2) semestre = 5;
    else if (diff === 3) semestre = 7;
    else if (diff === 4) semestre = 9;
    else semestre = 10; // Egresado o último semestre
  }
  
  return { 
    carrera, 
    semestre, 
    cycleStart: `20${yearStr}`, 
    cycleEnd: `20${cycleEndStr}` 
  };
};

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    matricula: '',
    carrera: '',
    semestre: 1,
    interests: []
  });
  const { saveUser } = useUser();
  const navigate = useNavigate();

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleMatriculaChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 8); // Solo dígitos y max 8
    setFormData(prev => {
      const nextData = { ...prev, matricula: val };
      if (val.length === 8) {
        const decoded = decodeMatricula(val);
        nextData.carrera = decoded.carrera;
        nextData.semestre = decoded.semestre;
      }
      return nextData;
    });
  };

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
    const finalUserData = {
      ...formData,
      id: formData.matricula // Usar matrícula como el ID único
    };
    const success = await saveUser(finalUserData);
    if (success) navigate('/');
  };

  const isMatriculaValid = formData.matricula.length === 8;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        {/* Progress Bar */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className={`h-2 flex-1 rounded-full transition-colors ${i <= step ? 'bg-uady-blue' : 'bg-gray-200'}`} 
            />
          ))}
        </div>

        {/* STEP 1: Matrícula & Auto-decoding */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <Fingerprint className="mb-4 h-12 w-12 text-uady-blue" />
            <h1 className="mb-2 text-2xl font-bold">Ingresa tu Matrícula</h1>
            <p className="mb-6 text-gray-500">Usa tu número de estudiante UADY (8 dígitos) para iniciar sesión.</p>
            
            <input
              type="text"
              value={formData.matricula}
              onChange={handleMatriculaChange}
              placeholder="Ej. 19203440"
              className="mb-6 w-full text-center text-2xl font-bold tracking-widest rounded-xl border-2 border-gray-200 py-3 focus:border-uady-blue focus:ring-0 placeholder:text-gray-300"
            />

            {isMatriculaValid && (() => {
              const decoded = decodeMatricula(formData.matricula);
              return (
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-amber-50/50 p-5 border border-uady-gold/20 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Sparkles className="h-16 w-16 text-uady-gold" />
                  </div>
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-uady-blue">
                    <Sparkles className="h-4 w-4 text-uady-gold animate-pulse" />
                    <span>Perfil UADY Detectado</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>Ciclo escolar de ingreso: <strong className="font-semibold text-gray-900">{decoded.cycleStart}-{decoded.cycleEnd}</strong></p>
                    <p>Carrera de origen: <strong className="font-semibold text-gray-900">Ingeniería {formData.carrera}</strong></p>
                    <p>Semestre estimado: <strong className="font-semibold text-gray-900">{formData.semestre}º Semestre</strong></p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* STEP 2: Confirmar/Editar Carrera */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <GraduationCap className="mb-4 h-12 w-12 text-uady-blue" />
            <h1 className="mb-2 text-2xl font-bold">Confirma tu Carrera</h1>
            <p className="mb-6 text-gray-500">¿Es correcta tu carrera de procedencia? Ajústala si es necesario.</p>
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

        {/* STEP 3: Confirmar/Editar Semestre */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <BookOpen className="mb-4 h-12 w-12 text-uady-blue" />
            <h1 className="mb-2 text-2xl font-bold">Confirma tu Semestre</h1>
            <p className="mb-6 text-gray-500">Ajusta el semestre si has adelantado o repetido materias.</p>
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

        {/* STEP 4: Temas de Interés */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <Tags className="mb-4 h-12 w-12 text-uady-blue" />
            <h1 className="mb-2 text-2xl font-bold">Temas de interés</h1>
            <p className="mb-6 text-gray-500">Selecciona al menos 3 áreas que te apasionen para alimentar tu feed.</p>
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

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <button onClick={handleBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
              <ChevronLeft className="h-4 w-4" /> Atrás
            </button>
          )}
          <div className="ml-auto">
            {step < 4 ? (
              <button 
                disabled={step === 1 && !isMatriculaValid}
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
