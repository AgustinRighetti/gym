import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Trash2, Edit2, X, Search, ChevronLeft,
  Dumbbell, Calendar, Save, Activity
} from 'lucide-react';

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='80' viewBox='0 0 100 80'%3E%3Crect width='100' height='80' fill='%231a1a1a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23444' font-size='10' font-family='sans-serif'%3ESin img%3C/text%3E%3C/svg%3E";
const POR_PAGINA_EJ = 24;

export default function AdminRutinas({ onVolver }) {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [socios, setSocios] = useState([]);
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const [busquedaSocio, setBusquedaSocio] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const [rutinas, setRutinas] = useState([]);
  const [ejercicios, setEjercicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', ejercicios: [] });

  // Estado del ejercicio que se está configurando
  const [ejSeleccionado, setEjSeleccionado] = useState(null);
  const [config, setConfig] = useState({ series: 3, repeticiones: 10, diaSemana: 'LUNES', notas: '' });

  // Buscador del grid de ejercicios
  const [busquedaEj, setBusquedaEj] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [paginaEj, setPaginaEj] = useState(1);

  const gruposUnicos = [...new Set(ejercicios.map(e => e.grupoMuscular).filter(Boolean))].sort();

  const buscando = busquedaEj !== '' || filtroGrupo !== '';
  const ejerciciosFiltrados = ejercicios.filter(e => {
    const coincideNombre = e.nombre.toLowerCase().includes(busquedaEj.toLowerCase());
    const coincideGrupo = filtroGrupo === '' || e.grupoMuscular?.toLowerCase().includes(filtroGrupo.toLowerCase());
    return coincideNombre && coincideGrupo;
  });
  const totalPaginas = Math.ceil(ejerciciosFiltrados.length / POR_PAGINA_EJ);
  const ejerciciosPagina = buscando
    ? ejerciciosFiltrados
    : ejerciciosFiltrados.slice((paginaEj - 1) * POR_PAGINA_EJ, paginaEj * POR_PAGINA_EJ);

  useEffect(() => { setPaginaEj(1); }, [busquedaEj, filtroGrupo]);
  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [sociosRes, ejerciciosRes] = await Promise.all([
        axios.get(`${BASE}/socios`, { headers }),
        axios.get(`${BASE}/ejercicios`, { headers }),
      ]);
      setSocios(sociosRes.data);
      setEjercicios(ejerciciosRes.data);
    } catch (err) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSocio = async (socio) => {
    setSocioSeleccionado(socio);
    setBusquedaSocio(`${socio.nombre} ${socio.apellido}`);
    setMostrarResultados(false);
    try {
      const res = await axios.get(`${BASE}/rutinas/socio/${socio.id}`, { headers });
      setRutinas(res.data);
    } catch { setRutinas([]); }
  };

  const sociosFiltrados = socios.filter(s =>
    `${s.nombre} ${s.apellido}`.toLowerCase().includes(busquedaSocio.toLowerCase())
  );

  const handleSeleccionarEjercicio = (ej) => {
    setEjSeleccionado(ej);
    // scroll suave hacia la config
    setTimeout(() => {
      document.getElementById('config-ejercicio')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleAgregarEjercicio = () => {
    if (!ejSeleccionado) { setError('Seleccioná un ejercicio del grid'); return; }
    setForm(prev => ({
      ...prev,
      ejercicios: [...prev.ejercicios, {
        ejercicioId: ejSeleccionado.id,
        series: config.series,
        repeticiones: config.repeticiones,
        diaSemana: config.diaSemana,
        notas: config.notas,
        ejercicio: ejSeleccionado,
      }]
    }));
    setEjSeleccionado(null);
    setConfig({ series: 3, repeticiones: 10, diaSemana: 'LUNES', notas: '' });
    setError('');
  };

  const handleCrearRutina = async (e) => {
    e.preventDefault();
    if (!form.nombre) { setError('El nombre es obligatorio'); return; }
    if (form.ejercicios.length === 0) { setError('Agregá al menos un ejercicio'); return; }
    try {
      const payload = { nombre: form.nombre, descripcion: form.descripcion, socioId: socioSeleccionado.id, ejercicios: form.ejercicios };
      if (editing) await axios.put(`${BASE}/rutinas/${editing}`, payload, { headers });
      else await axios.post(`${BASE}/rutinas`, payload, { headers });
      setModal(false); setEditing(null);
      setForm({ nombre: '', descripcion: '', ejercicios: [] });
      setError('');
      handleSelectSocio(socioSeleccionado);
    } catch { setError('Error al guardar la rutina'); }
  };

  const handleEliminarRutina = async (id) => {
    if (!window.confirm('¿Eliminar esta rutina?')) return;
    try {
      await axios.delete(`${BASE}/rutinas/${id}`, { headers });
      handleSelectSocio(socioSeleccionado);
    } catch { setError('Error al eliminar'); }
  };

  const handleEditarRutina = (rutina) => {
    setForm({
      nombre: rutina.nombre,
      descripcion: rutina.descripcion || '',
      ejercicios: rutina.ejercicios.map(e => ({
        ejercicioId: e.ejercicioId, series: e.series,
        repeticiones: e.repeticiones, diaSemana: e.diaSemana,
        notas: e.notas, ejercicio: e.ejercicio
      }))
    });
    setEditing(rutina.id);
    setEjSeleccionado(null);
    setBusquedaEj(''); setFiltroGrupo('');
    setModal(true);
  };

  const abrirModalNuevo = () => {
    setForm({ nombre: '', descripcion: '', ejercicios: [] });
    setEditing(null); setEjSeleccionado(null);
    setBusquedaEj(''); setFiltroGrupo('');
    setModal(true);
  };

  if (loading && !socios.length) return <div style={{ padding: '2rem', color: '#666' }}>Cargando...</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: "'Inter', sans-serif" }}>
      <button onClick={onVolver} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#FF4500', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', letterSpacing: '1px', marginBottom: '1.5rem', padding: 0 }}>
        <ChevronLeft size={20} /> VOLVER AL PANEL
      </button>

      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: '#fff', margin: '0 0 1.5rem', letterSpacing: '2px' }}>GESTIÓN DE RUTINAS</h2>

      {/* Buscador socios */}
      <div style={{ position: 'relative', maxWidth: '500px', marginBottom: '2rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#FF4500', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Buscar Socio</label>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
          <input type="text" placeholder="Nombre o Apellido..." value={busquedaSocio}
            onChange={e => { setBusquedaSocio(e.target.value); setMostrarResultados(true); if (!e.target.value) setSocioSeleccionado(null); }}
            onFocus={() => setMostrarResultados(true)}
            style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', background: '#0a0a0a', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '1rem' }} />
        </div>
        {mostrarResultados && busquedaSocio && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1a1a', border: '1px solid #333', borderRadius: '0 0 6px 6px', zIndex: 10, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            {sociosFiltrados.length === 0
              ? <div style={{ padding: '1rem', color: '#555' }}>No se encontraron socios</div>
              : sociosFiltrados.map(s => (
                <div key={s.id} onClick={() => handleSelectSocio(s)}
                  style={{ padding: '0.8rem 1rem', cursor: 'pointer', borderBottom: '1px solid #222' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#222'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{s.nombre} {s.apellido}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>Plan: {socioSeleccionado.plan?.nombre || socioSeleccionado.plan?.codigo || 'Sin plan'}</div>
                </div>
              ))}
          </div>
        )}
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ff8a8a', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', borderLeft: '4px solid #ef4444' }}>{error}</div>}

      {/* Panel del socio */}
      {socioSeleccionado && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: '#1a1a1a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #FF450030' }}>
            <div>
              <p style={{ color: '#FF4500', fontSize: '0.8rem', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>Socio Seleccionado</p>
              <h3 style={{ fontSize: '1.8rem', margin: '0.2rem 0', color: '#fff' }}>{socioSeleccionado.nombre} {socioSeleccionado.apellido}</h3>
              <span style={{ fontSize: '0.85rem', color: '#888' }}>Plan: {socioSeleccionado.plan?.nombre || socioSeleccionado.plan?.codigo || 'Sin plan'}</span>
            </div>
            <button onClick={abrirModalNuevo} style={{ background: '#FF4500', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              <Plus size={18} /> NUEVA RUTINA
            </button>
          </div>

          {rutinas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: '#111', borderRadius: '8px', border: '1px dashed #333' }}>
              <Activity size={48} style={{ color: '#333', marginBottom: '1rem' }} />
              <p style={{ color: '#555', margin: 0 }}>Este socio aún no tiene rutinas asignadas.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '2rem' }}>
              {rutinas.map(rutina => {
                const porDia = rutina.ejercicios.reduce((acc, re) => {
                  if (!acc[re.diaSemana]) acc[re.diaSemana] = [];
                  acc[re.diaSemana].push(re);
                  return acc;
                }, {});
                return (
                  <div key={rutina.id} style={{ background: '#111', borderRadius: '8px', border: '1px solid #222', overflow: 'hidden' }}>
                    <div style={{ padding: '1.2rem 1.5rem', background: '#161616', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '1.3rem', color: '#fff', margin: 0 }}>{rutina.nombre}</h4>
                        {rutina.descripcion && <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.3rem 0 0' }}>{rutina.descripcion}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => handleEditarRutina(rutina)} style={{ background: '#FF450020', color: '#FF4500', border: '1px solid #FF450040', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}><Edit2 size={16} /></button>
                        <button onClick={() => handleEliminarRutina(rutina.id)} style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
                      {DIAS.map(dia => {
                        const ejs = porDia[dia];
                        if (!ejs) return null;
                        return (
                          <div key={dia}>
                            <h5 style={{ color: '#FF4500', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Calendar size={14} /> {dia}
                            </h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                              {ejs.map((re, idx) => (
                                <div key={idx} style={{ background: '#0a0a0a', padding: '1rem', borderRadius: '6px', border: '1px solid #222' }}>
                                  <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.3rem' }}>{re.ejercicio.nombre}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#FF4500', marginBottom: '0.5rem' }}>{re.ejercicio.grupoMuscular}</div>
                                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#888' }}>
                                    <span>Sets: <strong style={{ color: '#ccc' }}>{re.series}</strong></span>
                                    <span>Reps: <strong style={{ color: '#ccc' }}>{re.repeticiones}</strong></span>
                                  </div>
                                  {re.notas && <div style={{ marginTop: '0.6rem', padding: '0.4rem', background: '#161616', borderRadius: '4px', fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>"{re.notas}"</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ MODAL ══════════════════════════════════════════════════════════════ */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
          <div style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #FF4500', width: '100%', maxWidth: '1000px', marginTop: '1rem', marginBottom: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.9)' }}>

            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid #2a2a2a' }}>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#FF4500', margin: 0 }}>
                {editing ? 'EDITAR RUTINA' : 'CREAR NUEVA RUTINA'}
              </h3>
              <button onClick={() => { setModal(false); setEditing(null); }} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              {/* Nombre y descripción */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Nombre *</label>
                  <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Hipertrofia A, Piernas..."
                    style={{ width: '100%', padding: '0.8rem', background: '#0a0a0a', border: '1px solid #333', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Descripción (opcional)</label>
                  <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Breve detalle del enfoque..."
                    style={{ width: '100%', padding: '0.8rem', background: '#0a0a0a', border: '1px solid #333', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* ── GRID DE EJERCICIOS ── */}
              <div style={{ background: '#0d0d0d', borderRadius: '8px', border: '1px solid #2a2a2a', marginBottom: '2rem', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Dumbbell size={18} color="#FF4500" />
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', color: '#fff', letterSpacing: '1px' }}>
                    SELECCIONÁ UN EJERCICIO
                  </span>
                  {ejSeleccionado && (
                    <span style={{ marginLeft: 'auto', background: '#FF450020', color: '#FF4500', border: '1px solid #FF450060', borderRadius: '20px', padding: '0.2rem 0.8rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      ✓ {ejSeleccionado.nombre}
                    </span>
                  )}
                </div>

                {/* Buscador del grid */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                    <input type="text" placeholder="Buscar ejercicio..." value={busquedaEj}
                      onChange={e => setBusquedaEj(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                  </div>
                  <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)}
                    style={{ padding: '0.6rem 0.8rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: filtroGrupo ? '#fff' : '#888', fontSize: '0.85rem' }}>
                    <option value="">Todos los grupos</option>
                    {gruposUnicos.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {(busquedaEj || filtroGrupo) && (
                    <button onClick={() => { setBusquedaEj(''); setFiltroGrupo(''); }}
                      style={{ padding: '0.6rem 0.8rem', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Grid de cards */}
                <div style={{ padding: '1rem 1.5rem', maxHeight: '340px', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    {ejerciciosPagina.map(ej => {
                      const seleccionado = ejSeleccionado?.id === ej.id;
                      return (
                        <div key={ej.id} onClick={() => handleSeleccionarEjercicio(ej)}
                          style={{
                            background: seleccionado ? '#FF450015' : '#111',
                            border: seleccionado ? '2px solid #FF4500' : '1px solid #222',
                            borderRadius: '6px', cursor: 'pointer', overflow: 'hidden',
                            transition: 'border-color 0.15s, transform 0.15s',
                            transform: seleccionado ? 'scale(1.03)' : 'scale(1)',
                          }}
                          onMouseEnter={e => { if (!seleccionado) e.currentTarget.style.borderColor = '#555'; }}
                          onMouseLeave={e => { if (!seleccionado) e.currentTarget.style.borderColor = '#222'; }}
                        >
                          <div style={{ height: '80px', overflow: 'hidden', background: '#0a0a0a' }}>
                            <img src={ej.imageUrl || PLACEHOLDER} alt={ej.nombre}
                              onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER; }}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </div>
                          <div style={{ padding: '0.4rem 0.5rem' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: seleccionado ? '#FF4500' : '#fff', lineHeight: 1.2, marginBottom: '0.2rem' }}>
                              {ej.nombre.length > 30 ? ej.nombre.slice(0, 30) + '…' : ej.nombre}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#666' }}>{ej.grupoMuscular}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Paginación del grid */}
                  {!buscando && totalPaginas > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem' }}>
                      <button onClick={() => setPaginaEj(p => Math.max(1, p - 1))} disabled={paginaEj === 1}
                        style={{ padding: '0.3rem 0.7rem', background: paginaEj === 1 ? '#1a1a1a' : '#333', color: paginaEj === 1 ? '#444' : '#fff', border: 'none', borderRadius: '4px', cursor: paginaEj === 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>
                        ‹
                      </button>
                      <span style={{ color: '#888', fontSize: '0.8rem', display: 'flex', alignItems: 'center', padding: '0 0.5rem' }}>
                        {paginaEj} / {totalPaginas}
                      </span>
                      <button onClick={() => setPaginaEj(p => Math.min(totalPaginas, p + 1))} disabled={paginaEj === totalPaginas}
                        style={{ padding: '0.3rem 0.7rem', background: paginaEj === totalPaginas ? '#1a1a1a' : '#333', color: paginaEj === totalPaginas ? '#444' : '#fff', border: 'none', borderRadius: '4px', cursor: paginaEj === totalPaginas ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>
                        ›
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── CONFIGURACIÓN del ejercicio seleccionado ── */}
              <div id="config-ejercicio" style={{
                background: ejSeleccionado ? '#0d1a0d' : '#0d0d0d',
                border: ejSeleccionado ? '1px solid #FF450060' : '1px solid #2a2a2a',
                borderRadius: '8px', padding: '1.25rem 1.5rem', marginBottom: '2rem',
                transition: 'background 0.3s, border-color 0.3s'
              }}>
                <div style={{ fontSize: '0.8rem', color: ejSeleccionado ? '#FF4500' : '#555', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem' }}>
                  {ejSeleccionado ? `Configurar: ${ejSeleccionado.nombre}` : 'Seleccioná un ejercicio del grid para configurarlo'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr auto', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>Series</label>
                    <input type="number" min="1" value={config.series}
                      onChange={e => setConfig({ ...config, series: parseInt(e.target.value) || 1 })}
                      disabled={!ejSeleccionado}
                      style={{ width: '100%', padding: '0.65rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: ejSeleccionado ? '#fff' : '#555', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>Repeticiones</label>
                    <input type="number" min="1" value={config.repeticiones}
                      onChange={e => setConfig({ ...config, repeticiones: parseInt(e.target.value) || 1 })}
                      disabled={!ejSeleccionado}
                      style={{ width: '100%', padding: '0.65rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: ejSeleccionado ? '#fff' : '#555', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>Día</label>
                    <select value={config.diaSemana} onChange={e => setConfig({ ...config, diaSemana: e.target.value })}
                      disabled={!ejSeleccionado}
                      style={{ width: '100%', padding: '0.65rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: ejSeleccionado ? '#fff' : '#555', boxSizing: 'border-box' }}>
                      {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="button" onClick={handleAgregarEjercicio} disabled={!ejSeleccionado}
                      style={{ background: ejSeleccionado ? '#FF4500' : '#333', color: ejSeleccionado ? '#fff' : '#555', border: 'none', padding: '0.65rem 1.2rem', borderRadius: '6px', cursor: ejSeleccionado ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                      <Plus size={18} /> AGREGAR
                    </button>
                  </div>
                </div>
                <input type="text" placeholder="Notas o indicaciones (opcional)..." value={config.notas}
                  onChange={e => setConfig({ ...config, notas: e.target.value })}
                  disabled={!ejSeleccionado}
                  style={{ width: '100%', padding: '0.65rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: ejSeleccionado ? '#fff' : '#555', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>

              {/* Lista de ejercicios agregados */}
              {form.ejercicios.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Ejercicios en la rutina ({form.ejercicios.length})
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {form.ejercicios.map((e, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '0.75rem 1rem', borderRadius: '6px', borderLeft: '3px solid #FF4500' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ color: '#FF4500', fontWeight: 800, fontSize: '0.75rem', minWidth: '70px' }}>{e.diaSemana}</span>
                          <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{e.ejercicio?.nombre}</span>
                          <span style={{ color: '#666', fontSize: '0.8rem' }}>{e.series}×{e.repeticiones}</span>
                          {e.notas && <span style={{ color: '#555', fontSize: '0.75rem', fontStyle: 'italic' }}>"{e.notas}"</span>}
                        </div>
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, ejercicios: prev.ejercicios.filter((_, i) => i !== idx) }))}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && <div style={{ color: '#ff8a8a', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '4px' }}>{error}</div>}

              {/* Botones */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => { setModal(false); setEditing(null); }}
                  style={{ flex: 1, padding: '1rem', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                  CANCELAR
                </button>
                <button onClick={handleCrearRutina}
                  style={{ flex: 1, padding: '1rem', background: '#FF4500', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', letterSpacing: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Save size={20} /> {editing ? 'ACTUALIZAR RUTINA' : 'GUARDAR RUTINA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}