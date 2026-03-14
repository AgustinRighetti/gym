import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Users, CheckCircle, Clock, AlertTriangle, LogOut,
  Trash2, RefreshCw, ClipboardList, ChevronDown, ChevronUp, RotateCcw,
  TrendingUp, TrendingDown, DollarSign, PlusCircle, X, Wallet,
  Dumbbell, BookOpen, Newspaper, Home
} from 'lucide-react';
import AdminEjercicios from '../components/AdminEjercicios';
import AdminRutinas from '../components/AdminRutinas';
import AdminNoticias from './AdminNoticias';

const PLANES = [
  { value: 'UN_DIA', label: '1 Día', precio: '$24.000' },
  { value: 'DOS_DIAS', label: '2 Días', precio: '$28.000' },
  { value: 'TRES_DIAS', label: '3 Días', precio: '$30.000' },
  { value: 'LIBRE', label: 'Libre', precio: '$34.000' },
];

const estadoColor = { PAGADO: '#22c55e', PENDIENTE: '#eab308', VENCIDO: '#ef4444' };

const CATEGORIAS_INGRESO = ['Cuota mensual', 'Ingreso extraordinario', 'Otro ingreso'];
const CATEGORIAS_EGRESO = ['Alquiler', 'Servicios (luz/agua/gas)', 'Equipamiento', 'Sueldos', 'Mantenimiento', 'Marketing', 'Otro'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Admin() {
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('TODOS');
  const [tab, setTab] = useState('socios');
  const [expandedSocioId, setExpandedSocioId] = useState(null);
  const [planSelects, setPlanSelects] = useState({});
  const [planLoadings, setPlanLoadings] = useState({});
  const [planMsgs, setPlanMsgs] = useState({});
  const [asistencias, setAsistencias] = useState([]);
  const [asistenciasLoading, setAsistenciasLoading] = useState(false);
  const [filtroAlerta, setFiltroAlerta] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, socio: null, loading: false, error: '' });

  // ── Caja ──
  const now = new Date();
  const [cajaMes, setCajaMes] = useState(now.getMonth() + 1);
  const [cajaAnio, setCajaAnio] = useState(now.getFullYear());
  const [resumen, setResumen] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cajaLoading, setCajaLoading] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [nuevoModal, setNuevoModal] = useState(false);
  const [nuevoForm, setNuevoForm] = useState({ tipo: 'EGRESO', monto: '', descripcion: '', categoria: '', fecha: now.toISOString().split('T')[0] });
  const [nuevoLoading, setNuevoLoading] = useState(false);
  const [nuevoError, setNuevoError] = useState('');
  const [deleteMovModal, setDeleteMovModal] = useState({ show: false, id: null, loading: false });

  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const headers = { Authorization: `Bearer ${token}` };

  // ── Socios ──
  useEffect(() => {
    const fetchSocios = async () => {
      try {
        const { data } = await axios.get(`${BASE}/socios`, { headers });
        setSocios(data);
      } catch { setError('Error al cargar socios'); }
      finally { setLoading(false); }
    };
    if (token) fetchSocios();
  }, [token]);

  const refreshSocios = async () => {
    const { data } = await axios.get(`${BASE}/socios`, { headers });
    setSocios(data);
  };

  // ── Asistencias ──
  const fetchAsistencias = async (soloAlerta = false) => {
    setAsistenciasLoading(true);
    try {
      const url = soloAlerta ? `${BASE}/asistencias/semana?alerta=true` : `${BASE}/asistencias/semana`;
      const { data } = await axios.get(url, { headers });
      setAsistencias(data);
    } catch { setAsistencias([]); }
    finally { setAsistenciasLoading(false); }
  };

  useEffect(() => {
    if (tab === 'asistencias' && token) fetchAsistencias(filtroAlerta);
  }, [tab, filtroAlerta, token]);

  // ── Caja ──
  const fetchCaja = async () => {
    setCajaLoading(true);
    try {
      const [resumenRes, movsRes] = await Promise.all([
        axios.get(`${BASE}/movimientos/resumen?mes=${cajaMes}&anio=${cajaAnio}`, { headers }),
        axios.get(`${BASE}/movimientos?mes=${cajaMes}&anio=${cajaAnio}`, { headers }),
      ]);
      setResumen(resumenRes.data);
      setMovimientos(movsRes.data);
    } catch { setResumen(null); setMovimientos([]); }
    finally { setCajaLoading(false); }
  };

  useEffect(() => {
    if (tab === 'caja' && token) fetchCaja();
  }, [tab, cajaMes, cajaAnio, token]);

  const handleNuevoMovimiento = async () => {
    setNuevoError('');
    if (!nuevoForm.monto || !nuevoForm.descripcion || !nuevoForm.categoria) {
      setNuevoError('Completá todos los campos');
      return;
    }
    setNuevoLoading(true);
    try {
      await axios.post(`${BASE}/movimientos`, { ...nuevoForm, monto: parseFloat(nuevoForm.monto) }, { headers });
      setNuevoModal(false);
      setNuevoForm({ tipo: 'EGRESO', monto: '', descripcion: '', categoria: '', fecha: new Date().toISOString().split('T')[0] });
      await fetchCaja();
    } catch (err) {
      setNuevoError(err.response?.data?.message || 'Error al guardar');
    } finally { setNuevoLoading(false); }
  };

  const handleDeleteMovimiento = async () => {
    setDeleteMovModal(p => ({ ...p, loading: true }));
    try {
      await axios.delete(`${BASE}/movimientos/${deleteMovModal.id}`, { headers });
      setDeleteMovModal({ show: false, id: null, loading: false });
      await fetchCaja();
    } catch { setDeleteMovModal(p => ({ ...p, loading: false })); }
  };

  // ── Plan handlers ──
  const handleProgramarPlan = async (socioId) => {
    const plan = planSelects[socioId];
    if (!plan) return;
    setPlanLoadings(p => ({ ...p, [socioId]: true }));
    setPlanMsgs(p => ({ ...p, [socioId]: null }));
    try {
      const { data } = await axios.put(`${BASE}/socios/${socioId}/plan`, { plan }, { headers });
      setPlanMsgs(p => ({ ...p, [socioId]: { tipo: 'ok', texto: data.message } }));
      await refreshSocios();
    } catch (err) {
      setPlanMsgs(p => ({ ...p, [socioId]: { tipo: 'err', texto: err.response?.data?.message || 'Error' } }));
    } finally { setPlanLoadings(p => ({ ...p, [socioId]: false })); }
  };

  const handleCancelarPlan = async (socioId) => {
    setPlanLoadings(p => ({ ...p, [socioId]: true }));
    setPlanMsgs(p => ({ ...p, [socioId]: null }));
    try {
      const { data } = await axios.delete(`${BASE}/socios/${socioId}/plan-pendiente`, { headers });
      setPlanMsgs(p => ({ ...p, [socioId]: { tipo: 'ok', texto: data.message } }));
      await refreshSocios();
    } catch (err) {
      setPlanMsgs(p => ({ ...p, [socioId]: { tipo: 'err', texto: err.response?.data?.message || 'Error' } }));
    } finally { setPlanLoadings(p => ({ ...p, [socioId]: false })); }
  };

  const toggleExpand = (socioId, currentPlan) => {
    setExpandedSocioId(prev => prev === socioId ? null : socioId);
    if (!planSelects[socioId]) setPlanSelects(p => ({ ...p, [socioId]: currentPlan }));
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const handleMarcarPagado = async (socioId) => {
    try {
      await axios.post(`${BASE}/pagos`, { socioId }, { headers });
      await refreshSocios();
    } catch { alert('Error al marcar como pagado'); }
  };

  const handleDeleteSocio = async () => {
    if (!deleteModal.socio) return;
    setDeleteModal(p => ({ ...p, loading: true, error: '' }));
    try {
      await axios.delete(`${BASE}/socios/${deleteModal.socio.id}`, { headers });
      setDeleteModal({ show: false, socio: null, loading: false, error: '' });
      await refreshSocios();
      const el = document.createElement('div');
      el.innerText = 'Socio eliminado correctamente';
      el.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#22c55e;color:white;padding:12px 24px;border-radius:8px;z-index:10000;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.5);font-family:Inter,sans-serif;';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    } catch (err) {
      setDeleteModal(p => ({ ...p, loading: false, error: err.response?.data?.message || 'Error al eliminar el socio' }));
    }
  };

  const sociosFiltrados = filtro === 'TODOS' ? socios : socios.filter(s => {
    const e = s.pagos?.[0]?.estado || 'PENDIENTE';
    if (filtro === 'PAGADOS') return e === 'PAGADO';
    if (filtro === 'PENDIENTES') return e === 'PENDIENTE';
    if (filtro === 'VENCIDOS') return e === 'VENCIDO';
    return true;
  });

  const contadores = {
    total: socios.length,
    pagados: socios.filter(s => s.pagos?.[0]?.estado === 'PAGADO').length,
    pendientes: socios.filter(s => { const e = s.pagos?.[0]?.estado; return e === 'PENDIENTE' || !e; }).length,
    vencidos: socios.filter(s => s.pagos?.[0]?.estado === 'VENCIDO').length,
  };

  const movsFiltrados = filtroTipo === 'TODOS' ? movimientos : movimientos.filter(m => m.tipo === filtroTipo);
  const fmt = n => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

  // ── Gráfico de barras CSS ──
  const GraficoBarras = ({ data }) => {
    if (!data?.length) return null;
    const maxVal = Math.max(...data.flatMap(d => [d.ingresos, d.egresos]), 1);
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 140, padding: '0 0.5rem' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div title={`Ingresos: ${fmt(d.ingresos)}`} style={{ flex: 1, background: '#22c55e', borderRadius: '3px 3px 0 0', height: `${(d.ingresos / maxVal) * 110}px`, minHeight: 2, opacity: 0.85 }} />
              <div title={`Egresos: ${fmt(d.egresos)}`} style={{ flex: 1, background: '#ef4444', borderRadius: '3px 3px 0 0', height: `${(d.egresos / maxVal) * 110}px`, minHeight: 2, opacity: 0.85 }} />
            </div>
            <span style={{ fontSize: '0.62rem', color: '#555', textAlign: 'center', whiteSpace: 'nowrap' }}>{d.mes}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
      <p>Cargando socios...</p>
    </div>
  );

  return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .stat-card { padding: 1.2rem 1.5rem; border-radius: 8px; border: 1px solid; box-shadow: 0 4px 12px rgba(0,0,0,0.5); transition: transform 0.2s; }
        .stat-card:hover { transform: translateY(-4px); }

        .socio-card { background: #111; border: 1px solid #222; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; transition: border-color 0.2s; }
        .socio-card:hover { border-color: #FF450060; }
        .asist-card { background: #111; border: 1px solid #222; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; }
        .mov-card   { background: #111; border: 1px solid #222; border-radius: 8px; padding: 1rem; margin-bottom: 0.6rem; }

        .table-view { display: block; }
        .cards-view { display: none;  }

        .tabs-wrap { display: flex; gap: 0.5rem; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px; }
        .tabs-wrap::-webkit-scrollbar { display: none; }
        .filters-wrap { display: flex; gap: 0.6rem; flex-wrap: wrap; }

        .caja-input { width: 100%; padding: 0.75rem 1rem; background: #0a0a0a; border: 1px solid #333; border-radius: 6px; color: #f0f0f0; font-family: 'Inter', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
        .caja-input:focus { border-color: #FF4500; }

        @media (max-width: 768px) {
          .table-view  { display: none !important; }
          .cards-view  { display: block !important; }
          .admin-pad   { padding: 1rem !important; }
          .stats-grid  { grid-template-columns: 1fr 1fr !important; gap: 0.75rem !important; }
          .stat-card   { padding: 1rem !important; }
          .stat-value  { font-size: 2rem !important; }
          .welcome-h2  { font-size: 1.8rem !important; }
          .nav-title   { font-size: 1.5rem !important; }
          .filters-wrap button { font-size: 0.8rem !important; padding: 0.5rem 0.9rem !important; }
          .asist-header { flex-direction: column !important; align-items: flex-start !important; }
          .asist-btns   { width: 100%; justify-content: flex-start; flex-wrap: wrap; }
          .caja-resumen-grid { grid-template-columns: 1fr !important; }
          .caja-header  { flex-direction: column !important; align-items: flex-start !important; gap: 1rem !important; }
          .nav-btns { flex-direction: column !important; width: 100%; }
          .nav-btns button { width: 100% !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: '#1a1a1a', borderBottom: '2px solid #FF4500', boxShadow: '0 4px 12px rgba(255,69,0,0.1)', gap: '1rem' }}>
        <h1 className="nav-title" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#FF4500', margin: 0, letterSpacing: '2px', cursor: 'pointer' }} onClick={() => navigate('/')}>IMPULSO</h1>
        <div className="nav-btns" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.6rem 1.1rem', 
              background: 'transparent', 
              color: '#FF4500', 
              border: '1px solid #FF4500', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: '0.85rem', 
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#FF4500';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#FF4500';
            }}
          >
            <Home size={15} /> Volver a Inicio
          </button>
          <button onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', background: '#FF4500', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = '#ff6625'}
            onMouseLeave={e => e.currentTarget.style.background = '#FF4500'}>
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="admin-pad" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#FF4500', fontWeight: '600', margin: '0 0 0.4rem' }}>GESTIÓN DE SOCIOS</p>
          <h2 className="welcome-h2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: '#fff', margin: 0 }}>Panel Administrativo</h2>
        </div>

        {/* Stats socios */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Socios', value: contadores.total, color: '#FF4500', bg: '#1a1a1a', border: '#FF450030', Icon: Users },
            { label: 'Pagados', value: contadores.pagados, color: '#22c55e', bg: 'linear-gradient(135deg,#1a1a1a,#025220)', border: '#22c55e30', Icon: CheckCircle },
            { label: 'Pendientes', value: contadores.pendientes, color: '#eab308', bg: 'linear-gradient(135deg,#1a1a1a,#3d3000)', border: '#eab30830', Icon: Clock },
            { label: 'Vencidos', value: contadores.vencidos, color: '#ef4444', bg: 'linear-gradient(135deg,#1a1a1a,#3d0000)', border: '#ef444430', Icon: AlertTriangle },
          ].map(({ label, value, color, bg, border, Icon }) => (
            <div key={label} className="stat-card" style={{ background: bg, borderColor: border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.78rem', color: '#999', margin: '0 0 0.4rem', fontWeight: 500 }}>{label}</p>
                  <p className="stat-value" style={{ fontSize: '2.5rem', margin: 0, fontWeight: 'bold', color, lineHeight: 1 }}>{value}</p>
                </div>
                <Icon size={28} color={color} strokeWidth={1.5} style={{ opacity: 0.7 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs-wrap" style={{ marginBottom: '1.5rem' }}>
          {[
            { key: 'socios', label: 'Socios', Icon: Users },
            { key: 'asistencias', label: 'Asistencias', Icon: ClipboardList },
            { key: 'caja', label: 'Caja', Icon: Wallet },
            { key: 'noticias', label: 'Noticias', Icon: Newspaper },
            { key: 'ejercicios', label: 'Ejercicios', Icon: Dumbbell },
            { key: 'rutinas', label: 'Rutinas', Icon: BookOpen },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.7rem 1.4rem', whiteSpace: 'nowrap',
              background: tab === t.key ? '#FF4500' : 'transparent',
              color: '#fff', border: `2px solid ${tab === t.key ? '#FF4500' : '#333'}`,
              borderRadius: '6px', cursor: 'pointer',
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: 2, transition: 'all 0.2s',
            }}>
              <t.Icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* ══ TAB SOCIOS ══ */}
        {tab === 'socios' && (
          <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #FF450030' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.8rem', color: '#FF4500', fontWeight: '600', margin: '0 0 0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Filtrar por Estado</p>
              <div className="filters-wrap">
                {['TODOS', 'PAGADOS', 'PENDIENTES', 'VENCIDOS'].map(f => (
                  <button key={f} onClick={() => setFiltro(f)} style={{ padding: '0.55rem 1.1rem', background: filtro === f ? '#FF4500' : 'transparent', color: '#fff', border: `2px solid ${filtro === f ? '#FF4500' : '#444'}`, borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', transition: 'all 0.2s' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ff8a8a', padding: '0.9rem', borderRadius: '4px', marginBottom: '1rem', borderLeft: '4px solid #ef4444' }}>{error}</div>}

            {sociosFiltrados.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#555', padding: '2rem' }}>No hay socios para mostrar</p>
            ) : (
              <>
                {/* Desktop */}
                <div className="table-view" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #FF4500' }}>
                        {['', 'Nombre', 'Email', 'Plan', 'Último Pago', 'Vencimiento', 'Estado', 'Acción'].map((col, i) => (
                          <th key={i} style={{ padding: '0.9rem 0.75rem', textAlign: i >= 6 ? 'center' : 'left', fontWeight: 'bold', color: '#FF4500', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sociosFiltrados.map(socio => {
                        const lastPago = socio.pagos?.[0];
                        const estadoPago = lastPago?.estado || 'PENDIENTE';
                        const isExpanded = expandedSocioId === socio.id;
                        return (
                          <>
                            <tr key={socio.id}
                              style={{ borderBottom: isExpanded ? 'none' : '1px solid #2a2a2a', background: isExpanded ? '#161616' : '#0a0a0a', cursor: 'pointer', transition: 'background 0.2s' }}
                              onClick={() => toggleExpand(socio.id, socio.plan)}
                              onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#141414'; }}
                              onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = '#0a0a0a'; }}>
                              <td style={{ padding: '0.9rem 0.75rem', color: '#555' }}>{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                              <td style={{ padding: '0.9rem 0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{socio.nombre} {socio.apellido}</td>
                              <td style={{ padding: '0.9rem 0.75rem', color: '#aaa', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{socio.email}</td>
                              <td style={{ padding: '0.9rem 0.75rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  <span style={{ display: 'inline-block', padding: '0.25rem 0.55rem', background: '#FF450020', color: '#FF4500', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem', width: 'fit-content' }}>
                                    {PLANES.find(p => p.value === socio.plan)?.label || socio.plan}
                                  </span>
                                  {socio.planPendiente && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', background: '#FF4500', color: '#fff', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, width: 'fit-content' }}>
                                      <RefreshCw size={10} /> {PLANES.find(p => p.value === socio.planPendiente)?.label}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '0.9rem 0.75rem', color: '#aaa', whiteSpace: 'nowrap' }}>{lastPago ? new Date(lastPago.fecha).toLocaleDateString('es-AR') : 'Sin registros'}</td>
                              <td style={{ padding: '0.9rem 0.75rem', color: '#aaa', whiteSpace: 'nowrap' }}>{lastPago ? new Date(lastPago.vencimiento).toLocaleDateString('es-AR') : '-'}</td>
                              <td style={{ padding: '0.9rem 0.75rem', textAlign: 'center' }}>
                                <span style={{ display: 'inline-block', padding: '0.3rem 0.7rem', background: estadoColor[estadoPago], color: '#000', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{estadoPago}</span>
                              </td>
                              <td style={{ padding: '0.9rem 0.75rem', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                  {(estadoPago === 'PENDIENTE' || estadoPago === 'VENCIDO') ? (
                                    <button onClick={e => { e.stopPropagation(); handleMarcarPagado(socio.id); }}
                                      style={{ padding: '0.45rem 0.9rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                                      onMouseEnter={e => e.currentTarget.style.background = '#16a34a'}
                                      onMouseLeave={e => e.currentTarget.style.background = '#22c55e'}>
                                      Pagar
                                    </button>
                                  ) : (
                                    <span style={{ padding: '0.45rem 0.9rem', color: '#555', fontSize: '0.78rem' }}>—</span>
                                  )}
                                  <button onClick={e => { e.stopPropagation(); setDeleteModal({ show: true, socio, loading: false, error: '' }); }}
                                    style={{ padding: '0.45rem 0.55rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                                <td colSpan="8" style={{ padding: 0, background: '#111' }}>
                                  <PlanManager socio={socio} planSelects={planSelects} planLoadings={planLoadings} planMsgs={planMsgs} setPlanSelects={setPlanSelects} handleProgramarPlan={handleProgramarPlan} handleCancelarPlan={handleCancelarPlan} />
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="cards-view">
                  {sociosFiltrados.map(socio => {
                    const lastPago = socio.pagos?.[0];
                    const estadoPago = lastPago?.estado || 'PENDIENTE';
                    const isExpanded = expandedSocioId === socio.id;
                    return (
                      <div key={socio.id} className="socio-card" style={{ borderColor: isExpanded ? '#FF450060' : '#222' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.2rem' }}>{socio.nombre} {socio.apellido}</div>
                            <div style={{ fontSize: '0.78rem', color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{socio.email || 'Sin email'}</div>
                          </div>
                          <span style={{ display: 'inline-block', padding: '0.3rem 0.7rem', background: estadoColor[estadoPago], color: '#000', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>{estadoPago}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.9rem', alignItems: 'center' }}>
                          <span style={{ padding: '0.25rem 0.55rem', background: '#FF450020', color: '#FF4500', borderRadius: '4px', fontWeight: 600, fontSize: '0.78rem' }}>{PLANES.find(p => p.value === socio.plan)?.label || socio.plan}</span>
                          {socio.planPendiente && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', background: '#FF4500', color: '#fff', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}><RefreshCw size={10} /> {PLANES.find(p => p.value === socio.planPendiente)?.label}</span>}
                          {lastPago && <span style={{ fontSize: '0.75rem', color: '#666' }}>Vence: {new Date(lastPago.vencimiento).toLocaleDateString('es-AR')}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {(estadoPago === 'PENDIENTE' || estadoPago === 'VENCIDO') && (
                            <button onClick={() => handleMarcarPagado(socio.id)} style={{ flex: 1, padding: '0.55rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem' }}>Marcar pagado</button>
                          )}
                          <button onClick={() => toggleExpand(socio.id, socio.plan)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.55rem', background: 'transparent', color: '#FF4500', border: '1px solid #FF450060', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                            <RefreshCw size={13} /> {isExpanded ? 'Ocultar plan' : 'Gestionar plan'}
                          </button>
                          <button onClick={() => setDeleteModal({ show: true, socio, loading: false, error: '' })} style={{ padding: '0.55rem 0.7rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef444460', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                        {isExpanded && (
                          <div style={{ marginTop: '1rem', borderTop: '1px solid #FF450030', paddingTop: '1rem' }}>
                            <PlanManager socio={socio} planSelects={planSelects} planLoadings={planLoadings} planMsgs={planMsgs} setPlanSelects={setPlanSelects} handleProgramarPlan={handleProgramarPlan} handleCancelarPlan={handleCancelarPlan} mobile />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ TAB ASISTENCIAS ══ */}
        {tab === 'asistencias' && (
          <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #FF450030' }}>
            <div className="asist-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#FF4500', fontWeight: 600, margin: '0 0 0.3rem', textTransform: 'uppercase', letterSpacing: 1 }}>Semana actual</p>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', margin: 0 }}>Asistencias</h3>
              </div>
              <div className="asist-btns" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <button onClick={() => setFiltroAlerta(false)} style={{ padding: '0.55rem 1.1rem', background: !filtroAlerta ? '#FF4500' : 'transparent', color: '#fff', border: `2px solid ${!filtroAlerta ? '#FF4500' : '#444'}`, borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem' }}>Todos</button>
                <button onClick={() => setFiltroAlerta(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 1.1rem', background: filtroAlerta ? '#FF4500' : 'transparent', color: '#fff', border: `2px solid ${filtroAlerta ? '#FF4500' : '#444'}`, borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem' }}>
                  <AlertTriangle size={13} /> Solo alertas
                </button>
                <button onClick={() => fetchAsistencias(filtroAlerta)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.55rem 0.9rem', background: 'transparent', color: '#aaa', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem' }}>
                  <RotateCcw size={13} /> Actualizar
                </button>
              </div>
            </div>
            {asistenciasLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Cargando asistencias...</div>
            ) : asistencias.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#444' }}>
                <ClipboardList size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>No hay asistencias registradas esta semana</p>
              </div>
            ) : (
              <>
                <div className="table-view" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #FF4500' }}>
                        {['Socio', 'Plan', 'Días / Límite', 'Última visita', 'Alerta'].map((col, i) => (
                          <th key={col} style={{ padding: '0.9rem 0.75rem', textAlign: i >= 2 ? 'center' : 'left', fontWeight: 'bold', color: '#FF4500', fontSize: '0.82rem' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {asistencias.map((item, idx) => {
                        const pct = item.limite ? Math.min(item.diasUsados / item.limite, 1) : 0;
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #2a2a2a', background: item.tieneAlerta ? 'rgba(255,69,0,0.05)' : 'transparent' }}>
                            <td style={{ padding: '0.9rem 0.75rem', fontWeight: 500 }}>{item.socio.nombre} {item.socio.apellido}</td>
                            <td style={{ padding: '0.9rem 0.75rem' }}><span style={{ background: '#FF450020', color: '#FF4500', padding: '0.22rem 0.55rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>{PLANES.find(p => p.value === item.socio.plan)?.label || item.socio.plan}</span></td>
                            <td style={{ padding: '0.9rem 0.75rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontWeight: 700, color: item.tieneAlerta ? '#FF4500' : '#fff' }}>{item.diasUsados} / {item.limite ?? '∞'}</span>
                                {item.limite && <div style={{ width: 90, height: 5, background: '#333', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${pct * 100}%`, height: '100%', background: item.tieneAlerta ? '#FF4500' : '#22c55e', borderRadius: 3 }} /></div>}
                              </div>
                            </td>
                            <td style={{ padding: '0.9rem 0.75rem', textAlign: 'center', color: '#aaa', fontSize: '0.82rem' }}>{item.ultimaVisita ? new Date(item.ultimaVisita).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                            <td style={{ padding: '0.9rem 0.75rem', textAlign: 'center' }}>
                              {item.tieneAlerta
                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,69,0,0.15)', color: '#FF4500', padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, border: '1px solid #FF450050' }}><AlertTriangle size={12} /> Excedido</span>
                                : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#22c55e', fontSize: '0.82rem' }}><CheckCircle size={13} /> OK</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="cards-view">
                  {asistencias.map((item, idx) => {
                    const pct = item.limite ? Math.min(item.diasUsados / item.limite, 1) : 0;
                    return (
                      <div key={idx} className="asist-card" style={{ borderColor: item.tieneAlerta ? '#FF450060' : '#222' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                          <div style={{ fontWeight: 600 }}>{item.socio.nombre} {item.socio.apellido}</div>
                          {item.tieneAlerta
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,69,0,0.15)', color: '#FF4500', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}><AlertTriangle size={11} /> Excedido</span>
                            : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#22c55e', fontSize: '0.78rem' }}><CheckCircle size={12} /> OK</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{ background: '#FF450020', color: '#FF4500', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{PLANES.find(p => p.value === item.socio.plan)?.label || item.socio.plan}</span>
                          <span style={{ fontSize: '0.78rem', color: item.tieneAlerta ? '#FF4500' : '#aaa', fontWeight: 700 }}>{item.diasUsados} / {item.limite ?? '∞'} días</span>
                        </div>
                        {item.limite && <div style={{ height: 5, background: '#333', borderRadius: 3, overflow: 'hidden', marginBottom: '0.5rem' }}><div style={{ width: `${pct * 100}%`, height: '100%', background: item.tieneAlerta ? '#FF4500' : '#22c55e', borderRadius: 3 }} /></div>}
                        {item.ultimaVisita && <div style={{ fontSize: '0.75rem', color: '#555', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={11} /> {new Date(item.ultimaVisita).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</div>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ TAB CAJA ══ */}
        {tab === 'caja' && (
          <div>
            {/* Header */}
            <div className="caja-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#FF4500', fontWeight: 600, margin: '0 0 0.3rem', textTransform: 'uppercase', letterSpacing: 1 }}>Finanzas</p>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', margin: 0 }}>Caja — {MESES[cajaMes - 1]} {cajaAnio}</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={cajaMes} onChange={e => setCajaMes(Number(e.target.value))} className="caja-input" style={{ width: 'auto', padding: '0.5rem 0.8rem' }}>
                  {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={cajaAnio} onChange={e => setCajaAnio(Number(e.target.value))} className="caja-input" style={{ width: 'auto', padding: '0.5rem 0.8rem' }}>
                  {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <button onClick={() => setNuevoModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', background: '#FF4500', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  <PlusCircle size={15} /> Nuevo movimiento
                </button>
              </div>
            </div>

            {cajaLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Cargando caja...</div>
            ) : (
              <>
                {/* Cards resumen */}
                <div className="caja-resumen-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Ingresos', value: resumen?.totalIngresos ?? 0, color: '#22c55e', bg: 'linear-gradient(135deg,#1a1a1a,#025220)', border: '#22c55e30', Icon: TrendingUp },
                    { label: 'Egresos', value: resumen?.totalEgresos ?? 0, color: '#ef4444', bg: 'linear-gradient(135deg,#1a1a1a,#3d0000)', border: '#ef444430', Icon: TrendingDown },
                    { label: 'Balance', value: resumen?.balance ?? 0, color: (resumen?.balance ?? 0) >= 0 ? '#22c55e' : '#ef4444', bg: 'linear-gradient(135deg,#1a1a1a,#1a0d00)', border: '#FF450030', Icon: DollarSign },
                  ].map(({ label, value, color, bg, border, Icon }) => (
                    <div key={label} className="stat-card" style={{ background: bg, borderColor: border }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontSize: '0.78rem', color: '#999', margin: '0 0 0.4rem', fontWeight: 500 }}>{label}</p>
                          <p style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', margin: 0, fontWeight: 'bold', color, lineHeight: 1 }}>{fmt(value)}</p>
                        </div>
                        <Icon size={26} color={color} strokeWidth={1.5} style={{ opacity: 0.7 }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gráfico */}
                {resumen?.grafico?.length > 0 && (
                  <div style={{ background: '#1a1a1a', border: '1px solid #FF450030', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.8rem', color: '#FF4500', fontWeight: 600, margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: 1 }}>Evolución últimos 6 meses</p>
                    <GraficoBarras data={resumen.grafico} />
                    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#999' }}><span style={{ width: 12, height: 12, background: '#22c55e', borderRadius: 2, display: 'inline-block' }} /> Ingresos</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#999' }}><span style={{ width: 12, height: 12, background: '#ef4444', borderRadius: 2, display: 'inline-block' }} /> Egresos</span>
                    </div>
                  </div>
                )}

                {/* Movimientos */}
                <div style={{ background: '#1a1a1a', border: '1px solid #FF450030', borderRadius: '8px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <p style={{ fontSize: '0.8rem', color: '#FF4500', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Movimientos del mes</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['TODOS', 'INGRESO', 'EGRESO'].map(t => (
                        <button key={t} onClick={() => setFiltroTipo(t)} style={{ padding: '0.4rem 0.9rem', background: filtroTipo === t ? '#FF4500' : 'transparent', color: '#fff', border: `1px solid ${filtroTipo === t ? '#FF4500' : '#444'}`, borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s' }}>{t}</button>
                      ))}
                    </div>
                  </div>

                  {movsFiltrados.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#555', padding: '2rem' }}>No hay movimientos para mostrar</p>
                  ) : (
                    <>
                      {/* Desktop */}
                      <div className="table-view" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #FF4500' }}>
                              {['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', ''].map((col, i) => (
                                <th key={i} style={{ padding: '0.8rem 0.75rem', textAlign: i >= 4 ? 'center' : 'left', fontWeight: 'bold', color: '#FF4500', fontSize: '0.82rem' }}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {movsFiltrados.map(m => (
                              <tr key={m.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                                <td style={{ padding: '0.8rem 0.75rem', color: '#aaa', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{new Date(m.fecha).toLocaleDateString('es-AR')}</td>
                                <td style={{ padding: '0.8rem 0.75rem' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: m.tipo === 'INGRESO' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: m.tipo === 'INGRESO' ? '#22c55e' : '#ef4444' }}>
                                    {m.tipo === 'INGRESO' ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {m.tipo}
                                  </span>
                                </td>
                                <td style={{ padding: '0.8rem 0.75rem', color: '#888', fontSize: '0.82rem' }}>{m.categoria}</td>
                                <td style={{ padding: '0.8rem 0.75rem', color: '#ccc', fontSize: '0.85rem' }}>
                                  {m.descripcion}
                                  {m.pago && <span style={{ fontSize: '0.72rem', color: '#555', marginLeft: '0.4rem' }}>({m.pago.socio?.nombre} {m.pago.socio?.apellido})</span>}
                                </td>
                                <td style={{ padding: '0.8rem 0.75rem', textAlign: 'center', fontWeight: 700, color: m.tipo === 'INGRESO' ? '#22c55e' : '#ef4444', whiteSpace: 'nowrap' }}>{fmt(m.monto)}</td>
                                <td style={{ padding: '0.8rem 0.75rem', textAlign: 'center' }}>
                                  {!m.pagoId && (
                                    <button onClick={() => setDeleteMovModal({ show: true, id: m.id, loading: false })}
                                      style={{ padding: '0.35rem 0.45rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef444460', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                                      onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}>
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile */}
                      <div className="cards-view">
                        {movsFiltrados.map(m => (
                          <div key={m.id} className="mov-card" style={{ borderColor: m.tipo === 'INGRESO' ? '#22c55e30' : '#ef444430' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: m.tipo === 'INGRESO' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: m.tipo === 'INGRESO' ? '#22c55e' : '#ef4444' }}>
                                {m.tipo === 'INGRESO' ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {m.tipo}
                              </span>
                              <span style={{ fontWeight: 700, color: m.tipo === 'INGRESO' ? '#22c55e' : '#ef4444', fontSize: '1rem' }}>{fmt(m.monto)}</span>
                            </div>
                            <div style={{ fontSize: '0.88rem', color: '#ddd', marginBottom: '0.3rem' }}>{m.descripcion}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.75rem', color: '#555' }}>{m.categoria} · {new Date(m.fecha).toLocaleDateString('es-AR')}</div>
                              {!m.pagoId && (
                                <button onClick={() => setDeleteMovModal({ show: true, id: m.id, loading: false })} style={{ padding: '0.3rem 0.4rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef444460', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'noticias' && <AdminNoticias />}
        {tab === 'ejercicios' && <AdminEjercicios />}
        {tab === 'rutinas' && <AdminRutinas onVolver={() => setTab('socios')} />}
      </div>

      {/* ── Modal nuevo movimiento ── */}
      {nuevoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #FF450060', borderRadius: '8px', maxWidth: 480, width: '100%', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', color: '#FF4500', margin: 0, letterSpacing: 1 }}>Nuevo Movimiento</h3>
              <button onClick={() => setNuevoModal(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {nuevoError && <div style={{ background: 'rgba(239,68,68,0.12)', color: '#ff8a8a', padding: '0.7rem 1rem', borderRadius: '6px', marginBottom: '1rem', borderLeft: '4px solid #ef4444', fontSize: '0.85rem' }}>{nuevoError}</div>}

            {/* Tipo */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>Tipo</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['INGRESO', 'EGRESO'].map(t => (
                  <button key={t} onClick={() => setNuevoForm(f => ({ ...f, tipo: t, categoria: '' }))}
                    style={{ flex: 1, padding: '0.65rem', background: nuevoForm.tipo === t ? (t === 'INGRESO' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') : '#0a0a0a', border: `2px solid ${nuevoForm.tipo === t ? (t === 'INGRESO' ? '#22c55e' : '#ef4444') : '#333'}`, borderRadius: '6px', color: nuevoForm.tipo === t ? (t === 'INGRESO' ? '#22c55e' : '#ef4444') : '#aaa', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    {t === 'INGRESO' ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Monto */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>Monto</label>
              <input className="caja-input" type="number" min="0" placeholder="Ej: 15000" value={nuevoForm.monto} onChange={e => setNuevoForm(f => ({ ...f, monto: e.target.value }))} />
            </div>

            {/* Categoría */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>Categoría</label>
              <select className="caja-input" value={nuevoForm.categoria} onChange={e => setNuevoForm(f => ({ ...f, categoria: e.target.value }))}>
                <option value="">Seleccioná una categoría</option>
                {(nuevoForm.tipo === 'INGRESO' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Descripción */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>Descripción</label>
              <input className="caja-input" type="text" placeholder="Ej: Pago alquiler marzo" value={nuevoForm.descripcion} onChange={e => setNuevoForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>

            {/* Fecha */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>Fecha</label>
              <input className="caja-input" type="date" value={nuevoForm.fecha} onChange={e => setNuevoForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setNuevoModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', color: '#aaa', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleNuevoMovimiento} disabled={nuevoLoading}
                style={{ flex: 1, padding: '0.75rem', background: '#FF4500', color: '#fff', border: 'none', borderRadius: '6px', cursor: nuevoLoading ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: nuevoLoading ? 0.7 : 1 }}>
                {nuevoLoading ? 'Guardando...' : <><PlusCircle size={15} /> Guardar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal eliminar movimiento ── */}
      {deleteMovModal.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #ef4444', borderRadius: '8px', maxWidth: 400, width: '100%', padding: '2rem' }}>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', color: '#ef4444', margin: '0 0 1rem' }}>Eliminar movimiento</h3>
            <p style={{ color: '#ccc', lineHeight: 1.6, marginBottom: '1.5rem' }}>¿Estás seguro? Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteMovModal({ show: false, id: null, loading: false })} style={{ padding: '0.65rem 1.2rem', background: 'transparent', color: '#aaa', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleDeleteMovimiento} disabled={deleteMovModal.loading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.2rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {deleteMovModal.loading ? 'Eliminando...' : <><Trash2 size={14} /> Eliminar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal eliminar socio ── */}
      {deleteModal.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #ef4444', borderRadius: '8px', maxWidth: 480, width: '100%', padding: '2rem', boxShadow: '0 8px 32px rgba(239,68,68,0.2)' }}>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#ef4444', margin: '0 0 1rem', letterSpacing: 1 }}>Confirmar Eliminación</h3>
            <p style={{ color: '#ccc', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              ¿Estás seguro que querés eliminar a <strong style={{ color: '#fff' }}>{deleteModal.socio?.nombre} {deleteModal.socio?.apellido}</strong>?<br />Esta acción no se puede deshacer.
            </p>
            {deleteModal.error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ff8a8a', padding: '0.8rem', borderRadius: '4px', marginBottom: '1.2rem', borderLeft: '4px solid #ef4444', fontSize: '0.88rem' }}>{deleteModal.error}</div>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button disabled={deleteModal.loading} onClick={() => setDeleteModal({ show: false, socio: null, loading: false, error: '' })} style={{ padding: '0.7rem 1.4rem', background: 'transparent', color: '#aaa', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button disabled={deleteModal.loading} onClick={handleDeleteSocio}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.7rem 1.4rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: deleteModal.loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                {deleteModal.loading
                  ? <><span style={{ width: 15, height: 15, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Eliminando...</>
                  : <><Trash2 size={15} /> Eliminar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── PlanManager ── */
function PlanManager({ socio, planSelects, planLoadings, planMsgs, setPlanSelects, handleProgramarPlan, handleCancelarPlan, mobile }) {
  const getPlanPrecio = p => ({ UN_DIA: '$24.000', DOS_DIAS: '$28.000', TRES_DIAS: '$30.000', LIBRE: '$34.000' }[p] || '');
  return (
    <div style={{ padding: mobile ? '0' : '1.5rem 1.5rem 1.5rem 2rem', borderTop: mobile ? 'none' : '1px solid #FF450040' }}>
      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '2px', color: '#FF4500', margin: '0 0 0.9rem' }}>Gestión de Plan — {socio.nombre}</p>
      {planMsgs[socio.id] && (
        <div style={{ padding: '0.6rem 0.9rem', borderRadius: '4px', marginBottom: '0.9rem', fontSize: '0.83rem', background: planMsgs[socio.id].tipo === 'ok' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', borderLeft: `4px solid ${planMsgs[socio.id].tipo === 'ok' ? '#22c55e' : '#ef4444'}`, color: planMsgs[socio.id].tipo === 'ok' ? '#4ade80' : '#ff8a8a' }}>
          {planMsgs[socio.id].texto}
        </div>
      )}
      <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 150 }}>
          <span style={{ fontSize: '0.72rem', color: '#666', letterSpacing: 1, textTransform: 'uppercase' }}>Plan actual</span>
          <span style={{ background: '#FF450020', color: '#FF4500', padding: '0.35rem 0.7rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700, width: 'fit-content' }}>
            {PLANES.find(p => p.value === socio.plan)?.label} — {getPlanPrecio(socio.plan)}
          </span>
          {socio.planPendiente && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#FF4500', color: '#fff', padding: '0.35rem 0.7rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, width: 'fit-content' }}>
                <RefreshCw size={11} /> Cambio a {PLANES.find(p => p.value === socio.planPendiente)?.label} pendiente
              </span>
              <button onClick={e => { e.stopPropagation(); handleCancelarPlan(socio.id); }} disabled={planLoadings[socio.id]}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.7rem', background: 'transparent', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, width: 'fit-content' }}>
                <Trash2 size={11} /> {planLoadings[socio.id] ? '...' : 'Cancelar cambio'}
              </button>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: mobile ? '100%' : 260 }}>
          <span style={{ fontSize: '0.72rem', color: '#666', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Programar cambio</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.7rem' }}>
            {PLANES.map(p => (
              <button key={p.value} onClick={e => { e.stopPropagation(); setPlanSelects(prev => ({ ...prev, [socio.id]: p.value })); }}
                style={{ padding: '0.5rem 0.7rem', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, background: planSelects[socio.id] === p.value ? '#FF450020' : '#0a0a0a', border: `2px solid ${planSelects[socio.id] === p.value ? '#FF4500' : '#333'}`, color: planSelects[socio.id] === p.value ? '#FF4500' : '#aaa', cursor: 'pointer', transition: 'all 0.15s' }}>
                {p.label} <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>{p.precio}</span>
                {p.value === socio.plan && <span style={{ fontSize: '0.68rem', opacity: 0.45, marginLeft: '0.25rem' }}>(actual)</span>}
              </button>
            ))}
          </div>
          <button onClick={e => { e.stopPropagation(); handleProgramarPlan(socio.id); }}
            disabled={planLoadings[socio.id] || !planSelects[socio.id] || planSelects[socio.id] === socio.plan}
            style={{ padding: '0.55rem 1.1rem', background: (planLoadings[socio.id] || !planSelects[socio.id] || planSelects[socio.id] === socio.plan) ? '#333' : '#FF4500', color: (planLoadings[socio.id] || !planSelects[socio.id] || planSelects[socio.id] === socio.plan) ? '#666' : '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '0.9rem', letterSpacing: '2px', transition: 'all 0.2s' }}>
            {planLoadings[socio.id] ? 'Procesando...' : 'Programar Cambio →'}
          </button>
        </div>
      </div>
    </div>
  );
}