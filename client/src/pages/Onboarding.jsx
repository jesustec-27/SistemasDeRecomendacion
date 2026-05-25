import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { BookOpen, GraduationCap, Tags, ChevronRight, ChevronLeft, Fingerprint, Sparkles, RefreshCw } from 'lucide-react';

const CARRERAS = ['Sistemas', 'Civil', 'Mecatrónica', 'Industrial', 'Renovables', 'Logística'];
const TAGS_PREDEFINIDOS = [
  'Algoritmos', 'Redes', 'Bases de Datos', 'Cálculo', 'Física', 'Gestión', 
  'Estructuras', 'Termodinámica', 'Programación', 'Inteligencia Artificial',
  'Matemáticas', 'Química', 'Electrónica', 'Software', 'Economía'
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    matricula: '',
    nombre: '',
    carrera: '',
    semestre: 1,
    interests: []
  });
  const [isChecking, setIsChecking] = useState(false);
  const [existingUser, setExistingUser] = useState(null);

  const { saveUser, checkUserExists, loginUser } = useUser();
  const navigate = useNavigate();

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleMatriculaChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 8); // Solo dígitos y max 8
    setFormData(prev => ({ ...prev, matricula: val }));

    if (val.length < 8) {
      setExistingUser(null);
      setIsChecking(false);
      return;
    }

    if (val.length === 8) {
      setIsChecking(true);
      try {
        const check = await checkUserExists(val);
        if (check.exists) {
          setExistingUser(check.user);
        } else {
          setExistingUser(null);
          // Preestablecer valores vacíos para que el usuario elija
          setFormData(prev => ({
            ...prev,
            carrera: '',
            semestre: 1
          }));
        }
      } catch (error) {
        console.error('Error al verificar matrícula:', error);
      } finally {
        setIsChecking(false);
      }
    }
  };

  const handleAccess = async () => {
    if (existingUser) {
      const success = await loginUser(existingUser);
      if (success) {
        navigate('/');
      } else {
        alert("Error al iniciar sesión.");
      }
    }
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
    if (!formData.carrera) {
      alert("Por favor selecciona tu carrera.");
      return;
    }
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

        {/* STEP 1: Matrícula & Verification */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <Fingerprint className="mb-4 h-12 w-12 text-uady-blue" />
            <h1 className="mb-2 text-2xl font-bold">Ingresa tu Matrícula</h1>
            <p className="mb-6 text-gray-500">Usa tu número de estudiante UADY (8 dígitos) para registrarte o iniciar sesión.</p>
            
            <input
              type="text"
              value={formData.matricula}
              onChange={handleMatriculaChange}
              placeholder="Ej. 19203440"
              className="mb-6 w-full text-center text-2xl font-bold tracking-widest rounded-xl border-2 border-gray-200 py-3 focus:border-uady-blue focus:ring-0 placeholder:text-gray-300"
            />

            {isChecking && (
              <div className="flex flex-col items-center justify-center py-6 text-gray-500 animate-pulse">
                <RefreshCw className="h-6 w-6 animate-spin text-uady-blue mb-2" />
                <span className="text-sm font-medium">Buscando matrícula en el servidor...</span>
              </div>
            )}

            {!isChecking && isMatriculaValid && existingUser && (
              <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50/50 p-5 border border-green-200 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Sparkles className="h-16 w-16 text-green-600" />
                </div>
                <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-green-700">
                  <Sparkles className="h-4 w-4 text-green-600 animate-pulse" />
                  <span>¡Matrícula Registrada!</span>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>Esta matrícula ya existe en la plataforma.</p>
                  {existingUser.nombre && <p>Estudiante: <strong className="font-semibold text-gray-900">{existingUser.nombre}</strong></p>}
                  <p>Carrera: <strong className="font-semibold text-gray-900">Ingeniería {existingUser.carrera}</strong></p>
                  <p>Semestre: <strong className="font-semibold text-gray-900">{existingUser.semestre}º Semestre</strong></p>
                </div>
              </div>
            )}

            {!isChecking && isMatriculaValid && !existingUser && (
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-amber-50/50 p-5 border border-uady-gold/20 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Sparkles className="h-16 w-16 text-uady-gold" />
                </div>
                <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-uady-blue">
                  <Sparkles className="h-4 w-4 text-uady-gold" />
                  <span>Matrícula Nueva Detectada</span>
                </div>
                <div className="space-y-2 text-sm text-gray-700 mb-4">
                  <p>Esta matrícula no está registrada aún.</p>
                  <p>Por favor, escribe tu nombre y haz clic en <strong>Siguiente</strong> para completar tu perfil.</p>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Tu Nombre Completo</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej. Isaac Newton"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-uady-blue focus:ring-0 bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Confirmar/Editar Carrera */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <GraduationCap className="mb-4 h-12 w-12 text-uady-blue" />
            <h1 className="mb-2 text-2xl font-bold">Selecciona tu Carrera</h1>
            <p className="mb-6 text-gray-500">Por favor, elige tu programa de Ingeniería en la UADY.</p>
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
            <h1 className="mb-2 text-2xl font-bold">Selecciona tu Semestre</h1>
            <p className="mb-6 text-gray-500">Elige el semestre escolar que estás cursando actualmente.</p>
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
            {step === 1 && existingUser ? (
              <button 
                onClick={handleAccess} 
                className="flex items-center gap-1 rounded-lg bg-green-600 px-6 py-2 text-white font-bold hover:bg-green-700 transition-all shadow-md"
              >
                Acceder <ChevronRight className="h-4 w-4" />
              </button>
            ) : step < 4 ? (
              <button 
                disabled={(step === 1 && (!isMatriculaValid || (!existingUser && !formData.nombre?.trim()))) || (step === 2 && !formData.carrera) || isChecking}
                onClick={handleNext} 
                className="flex items-center gap-1 rounded-lg bg-uady-blue px-6 py-2 text-white disabled:opacity-50 transition-all"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button 
                onClick={handleFinish} 
                className="rounded-lg bg-uady-gold px-8 py-2 font-bold text-uady-blue hover:bg-yellow-500 transition-all"
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
