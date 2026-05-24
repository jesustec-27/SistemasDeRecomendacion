import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../hooks/useUser';
import { Sliders, TrendingUp, PieChart, Map, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePie, Pie, Cell, Legend } from 'recharts';

export default function Dashboard() {
  const { user } = useUser();
  const [weights, setWeights] = useState(() => {
    try {
      const stored = localStorage.getItem('biblioia_weights');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.content === 'number' && typeof parsed.collab === 'number') {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error loading weights from localStorage:", e);
    }
    return { content: 0.6, collab: 0.4 };
  });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');


  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/analytics');
        setAnalytics(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const COLORS = ['#003b71', '#d4af37', '#0056a3', '#f1c40f', '#2980b9'];

  if (loading) return <div className="p-10">Cargando tablero...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-uady-blue">
        <ChevronLeft className="h-4 w-4" /> Volver al feed
      </Link>

      <h1 className="mb-8 text-3xl font-bold text-uady-blue">Panel de Control BiblioIA</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Sliders de Pesos */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-6 flex items-center gap-2 font-bold text-gray-700">
            <Sliders className="h-5 w-5" /> Pesos del Algoritmo
          </div>
          
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Basado en Contenido</span>
                <span className="font-bold text-uady-blue">{Math.round(weights.content * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={weights.content} 
                onChange={(e) => {
                  const val = parseFloat(parseFloat(e.target.value).toFixed(1));
                  const newWeights = { content: val, collab: parseFloat((1 - val).toFixed(1)) };
                  setWeights(newWeights);
                  localStorage.setItem('biblioia_weights', JSON.stringify(newWeights));
                }}
                className="w-full accent-uady-blue"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Filtrado Colaborativo</span>
                <span className="font-bold text-uady-blue">{Math.round(weights.collab * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={weights.collab} 
                onChange={(e) => {
                  const val = parseFloat(parseFloat(e.target.value).toFixed(1));
                  const newWeights = { collab: val, content: parseFloat((1 - val).toFixed(1)) };
                  setWeights(newWeights);
                  localStorage.setItem('biblioia_weights', JSON.stringify(newWeights));
                }}
                className="w-full accent-uady-blue"
              />
            </div>

            <div className="rounded-xl bg-blue-50 p-4 text-xs text-uady-blue leading-relaxed">
              <p>Ajustar estos valores cambiará cómo se priorizan los libros en tu feed principal.</p>
            </div>

            <button 
              onClick={() => {
                localStorage.setItem('biblioia_weights', JSON.stringify(weights));
                setSaveStatus('success');
                setTimeout(() => setSaveStatus(''), 3000);
              }}
              className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2 ${
                saveStatus === 'success' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-uady-blue hover:bg-blue-800'
              }`}
            >
              {saveStatus === 'success' ? '¡Configuración Guardada!' : 'Guardar Configuración'}
            </button>
          </div>
        </div>

        {/* Analytics charts */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Top Libros */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="mb-6 flex items-center gap-2 font-bold text-gray-700">
                <TrendingUp className="h-5 w-5" /> Top 5 Libros
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.topBooks.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="id" hide />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 shadow-lg border rounded-lg text-xs">
                              <p className="font-bold">{payload[0].payload.title}</p>
                              <p>Interacciones: {payload[0].value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="interaction_count" fill="#003b71" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Categorías */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="mb-6 flex items-center gap-2 font-bold text-gray-700">
                <PieChart className="h-5 w-5" /> Distribución
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePie>
                    <Pie
                      data={analytics?.categories || []}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="category"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {(analytics?.categories || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} libros`, `Categoría: ${name}`]} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </RePie>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Heatmap summary table */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
             <div className="mb-6 flex items-center gap-2 font-bold text-gray-700">
                <Map className="h-5 w-5" /> Interacciones por Carrera y Semestre
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 font-bold text-gray-400">Carrera</th>
                      <th className="pb-3 font-bold text-gray-400">Semestre</th>
                      <th className="pb-3 font-bold text-gray-400">Interacciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.heatmap.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 font-medium">{row.carrera}</td>
                        <td className="py-3">{row.semestre}º</td>
                        <td className="py-3">
                           <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-uady-blue">
                             {row.interactions}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
