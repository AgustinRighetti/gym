import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EjercicioCard from './EjercicioCard';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='200' viewBox='0 0 280 200'%3E%3Crect width='280' height='200' fill='%231a1a1a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-size='14' font-family='sans-serif'%3ESin imagen%3C/text%3E%3C/svg%3E";
const POR_PAGINA = 20;

export default function AdminEjercicios() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [ejercicios, setEjercicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', grupoMuscular: '', descripcion: '' });
  const [formLoading, setFormLoading] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [pagina, setPagina] = useState(1);

  const gruposMusculares = [
    'Pecho', 'Espalda', 'Hombros', 'Brazos', 'Antebrazos',
    'Abdominales', 'Piernas', 'Glúteos', 'Cardio', 'Funcional'
  ];

  const gruposUnicos = [...new Set(ejercicios.map(e => e.grupoMuscular).filter(Boolean))].sort();

  const buscando = busqueda !== '' || filtroGrupo !== '';

  const ejerciciosFiltrados = ejercicios.filter(e => {
    const coincideNombre = e.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideGrupo = filtroGrupo === '' || e.grupoMuscular?.toLowerCase().includes(filtroGrupo.toLowerCase());
    return coincideNombre && coincideGrupo;
  });

  // Paginación solo cuando no hay búsqueda activa
  const totalPaginas = Math.ceil(ejerciciosFiltrados.length / POR_PAGINA);
  const ejerciciosPagina = buscando
    ? ejerciciosFiltrados
    : ejerciciosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  // Resetear página al cambiar filtros
  useEffect(() => { setPagina(1); }, [busqueda, filtroGrupo]);

  useEffect(() => { cargarEjercicios(); }, []);

  const cargarEjercicios = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE}/ejercicios`, { headers });
      setEjercicios(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Error al cargar ejercicios');
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.grupoMuscular) {
      setError('Nombre y grupo muscular son requeridos');
      return;
    }
    try {
      setFormLoading(true);
      setError('');
      await axios.post(`${BASE}/ejercicios`, form, { headers });
      setForm({ nombre: '', grupoMuscular: '', descripcion: '' });
      setModal(false);
      cargarEjercicios();
    } catch (err) {
      console.error(err);
      setError('Error al crear ejercicio');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este ejercicio?')) return;
    try {
      await axios.delete(`${BASE}/ejercicios/${id}`, { headers });
      cargarEjercicios();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar');
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
          Ejercicios
          <span style={{ marginLeft: '0.7rem', fontSize: '0.9rem', color: '#888', fontWeight: 'normal' }}>
            ({ejerciciosFiltrados.length} de {ejercicios.length})
          </span>
        </h2>
        <button onClick={() => { setError(''); setModal(true); }} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: '#FF4500', color: '#fff', border: 'none',
          padding: '0.7rem 1.4rem', borderRadius: '6px', cursor: 'pointer',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '2px'
        }}>
          <Plus size={18} /> Crear Ejercicio
        </button>
      </div>

      {/* Buscador */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            type="text"
            placeholder="Buscar ejercicio..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%', padding: '0.7rem 0.7rem 0.7rem 2.4rem',
              background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px',
              color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box'
            }}
          />
        </div>

        <select
          value={filtroGrupo}
          onChange={e => setFiltroGrupo(e.target.value)}
          style={{
            padding: '0.7rem 1rem', background: '#1a1a1a', border: '1px solid #333',
            borderRadius: '6px', color: filtroGrupo ? '#fff' : '#888', fontSize: '0.9rem', minWidth: '180px'
          }}
        >
          <option value="">Todos los grupos</option>
          {gruposUnicos.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        {buscando && (
          <button
            onClick={() => { setBusqueda(''); setFiltroGrupo(''); }}
            style={{
              padding: '0.7rem 1rem', background: '#333', color: '#fff',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem'
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}

      {/* Lista */}
      {loading ? (
        <p style={{ color: '#666' }}>Cargando...</p>
      ) : ejerciciosPagina.length === 0 ? (
        <p style={{ color: '#555', textAlign: 'center', padding: '3rem' }}>
          {buscando ? 'No se encontraron ejercicios con ese filtro.' : 'No hay ejercicios cargados todavía.'}
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {ejerciciosPagina.map(e => (
            <div key={e.id} style={{ position: 'relative' }}>
              <EjercicioCardConFallback ejercicio={e} placeholder={PLACEHOLDER} />
              <button onClick={() => handleEliminar(e.id)} style={{
                position: 'absolute', top: '0.5rem', right: '0.5rem',
                background: '#ef4444', color: '#fff', border: 'none',
                width: '32px', height: '32px', borderRadius: '4px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Paginación — solo cuando no hay búsqueda */}
      {!buscando && totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            style={{
              background: pagina === 1 ? '#222' : '#333', color: pagina === 1 ? '#555' : '#fff',
              border: 'none', borderRadius: '4px', padding: '0.5rem 0.8rem',
              cursor: pagina === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center'
            }}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Números de página */}
          {Array.from({ length: totalPaginas }, (_, i) => i + 1)
            .filter(n => n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 2)
            .reduce((acc, n, idx, arr) => {
              if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...');
              acc.push(n);
              return acc;
            }, [])
            .map((item, idx) =>
              item === '...' ? (
                <span key={`dots-${idx}`} style={{ color: '#555', padding: '0 0.3rem' }}>...</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPagina(item)}
                  style={{
                    background: pagina === item ? '#FF4500' : '#222',
                    color: '#fff', border: 'none', borderRadius: '4px',
                    padding: '0.5rem 0.8rem', cursor: 'pointer', fontWeight: pagina === item ? 'bold' : 'normal',
                    minWidth: '36px'
                  }}
                >
                  {item}
                </button>
              )
            )}

          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            style={{
              background: pagina === totalPaginas ? '#222' : '#333', color: pagina === totalPaginas ? '#555' : '#fff',
              border: 'none', borderRadius: '4px', padding: '0.5rem 0.8rem',
              cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center'
            }}
          >
            <ChevronRight size={16} />
          </button>

          <span style={{ color: '#888', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
            Página {pagina} de {totalPaginas}
          </span>
        </div>
      )}

      {/* Modal crear ejercicio */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#1a1a1a', padding: '2rem', borderRadius: '8px', border: '1px solid #FF4500', width: '90%', maxWidth: '500px' }}>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '2px', marginBottom: '1.5rem' }}>Crear Ejercicio</h3>
            <form onSubmit={handleCrear}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Nombre *</label>
                <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Grupo Muscular *</label>
                <select value={form.grupoMuscular} onChange={e => setForm({ ...form, grupoMuscular: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}>
                  <option value="">Seleccionar...</option>
                  {gruposMusculares.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff', minHeight: '80px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }} />
              </div>
              {error && <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</p>}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" disabled={formLoading} style={{
                  flex: 1, background: '#FF4500', color: '#fff', border: 'none',
                  padding: '0.7rem', borderRadius: '4px', cursor: formLoading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px', opacity: formLoading ? 0.6 : 1
                }}>
                  {formLoading ? 'Creando...' : 'Crear'}
                </button>
                <button type="button" onClick={() => { setModal(false); setForm({ nombre: '', grupoMuscular: '', descripcion: '' }); setError(''); }}
                  style={{ flex: 1, background: '#333', color: '#fff', border: 'none', padding: '0.7rem', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EjercicioCardConFallback({ ejercicio, placeholder }) {
  const [imgSrc, setImgSrc] = useState(ejercicio.imageUrl || placeholder);
  return (
    <div style={{ position: 'relative' }}>
      <EjercicioCard
        ejercicio={{ ...ejercicio, imageUrl: imgSrc }}
        onImageError={() => setImgSrc(placeholder)}
      />
    </div>
  );
}