import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  User, Dumbbell, CreditCard, CalendarDays, RefreshCw,
  AlertTriangle, Info, LogOut, Clock, CheckCircle, Activity, ChevronRight, Home
} from 'lucide-react';
import EjercicioCard from '../components/EjercicioCard';

const PLANES = [
  { value: 'UN_DIA', label: '1 Día', precio: '$24.000' },
  { value: 'DOS_DIAS', label: '2 Días', precio: '$28.000' },
  { value: 'TRES_DIAS', label: '3 Días', precio: '$30.000' },
  { value: 'LIBRE', label: 'Libre', precio: '$34.000' },
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  @keyframes pulse-vencido {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.6; }
  }
  .estado-vencido { animation: pulse-vencido 2s infinite; }

  /* ── Cards ── */
  .dash-card {
    background: #1a1a1a;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid rgba(255,69,0,0.18);
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    transition: border-color 0.25s;
  }
  .dash-card:hover { border-color: #FF4500; }

  .card-label {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.8rem;
    color: #FF4500;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 1.2rem;
  }

  /* ── Layout grids ── */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .grid-pago {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .planes-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  /* ── Visita row ── */
  .visita-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.7rem 1rem;
    background: #0a0a0a;
    border-radius: 6px;
    border: 1px solid #1e1e1e;
    gap: 0.5rem;
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 640px) {
    .grid-2    { grid-template-columns: 1fr; }
    .grid-pago { grid-template-columns: 1fr; }

    .planes-row { flex-direction: column; }
    .planes-row button { flex: unset !important; width: 100%; }

    .nav-title { font-size: 1.5rem !important; }
    .welcome-name { font-size: 2.5rem !important; }

    .visita-row { flex-wrap: wrap; gap: 0.3rem; }
    .visita-date { font-size: 0.85rem; }
    .visita-time { font-size: 0.8rem; }
    
    .nav-btns { flex-direction: column !important; width: 100%; }
    .nav-btns button { width: 100% !important; }
  }
`;

export default function Dashboard() {
  const [socio, setSocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planSeleccionado, setPlanSeleccionado] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [planMsg, setPlanMsg] = useState({ tipo: '', texto: '' });
  const [asistencias, setAsistencias] = useState([]);
  const [asistenciasLoading, setAsistenciasLoading] = useState(false);
  const [asistenciaSemana, setAsistenciaSemana] = useState({ diasUsados: 0, limite: null });
  const [rutinas, setRutinas] = useState([]);
  const [rutinasLoading, setRutinasLoading] = useState(false);

  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchSocio = useCallback(async () => {
    try {
      const { data } = await axios.get(`${BASE}/socios/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSocio(data);
      setPlanSeleccionado(data.plan);
    } catch {
      setError('Error al cargar información del socio');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAsistencias = useCallback(async (socioData) => {
    if (!socioData) return;
    setAsistenciasLoading(true);
    try {
      const { data } = await axios.get(`${BASE}/asistencias/socio/${socioData.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAsistencias(data);
      const ahora = new Date();
      const getISOWeek = (d) => {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
      };
      const semanaActual = getISOWeek(ahora);
      const anioActual = ahora.getFullYear();
      const thisWeek = data.filter(a => a.semana === semanaActual && a.anio === anioActual);
      const LIMITE = { UN_DIA: 1, DOS_DIAS: 2, TRES_DIAS: 3, LIBRE: null };
      setAsistenciaSemana({ diasUsados: thisWeek.length, limite: LIMITE[socioData.plan] ?? null });
    } catch { /* no crítico */ }
    finally { setAsistenciasLoading(false); }
  }, [token]);

  const fetchRutinas = useCallback(async (socioData) => {
    if (!socioData) return;
    setRutinasLoading(true);
    try {
      const { data } = await axios.get(`${BASE}/rutinas/socio/${socioData.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRutinas(data);
    } catch { /* no crítico */ }
    finally { setRutinasLoading(false); }
  }, [token]);

  useEffect(() => { if (token) fetchSocio(); }, [token, fetchSocio]);
  useEffect(() => {
    if (socio) {
      fetchAsistencias(socio);
      fetchRutinas(socio);
    }
  }, [socio?.id, fetchAsistencias, fetchRutinas]);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleCambiarPlan = async () => {
    if (!planSeleccionado || planSeleccionado === socio?.plan) return;
    setPlanLoading(true);
    setPlanMsg({ tipo: '', texto: '' });
    try {
      const { data } = await axios.put(
        `${BASE}/socios/${socio.id}/plan`,
        { plan: planSeleccionado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlanMsg({ tipo: 'ok', texto: data.message });
      await fetchSocio();
    } catch (err) {
      setPlanMsg({ tipo: 'err', texto: err.response?.data?.message || 'Error al solicitar cambio de plan' });
    } finally {
      setPlanLoading(false);
    }
  };

  const estadoColor = { PAGADO: '#22c55e', PENDIENTE: '#eab308', VENCIDO: '#ef4444' };
  const estadoLabel = { PAGADO: 'PAGADO', PENDIENTE: 'PENDIENTE DE PAGO', VENCIDO: 'VENCIDO' };
  const planPrecio = { UN_DIA: '$24.000', DOS_DIAS: '$28.000', TRES_DIAS: '$30.000', LIBRE: '$34.000' };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
      <p>Cargando información...</p>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '1rem' }}>
      <div style={{ background: '#1a1a1a', padding: '2rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #FF4500', maxWidth: 400, width: '100%' }}>
        <p style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '1.1rem' }}>{error}</p>
        <button onClick={handleLogout} style={{ padding: '0.75rem 1.5rem', background: '#FF4500', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Volver al inicio
        </button>
      </div>
    </div>
  );

  const lastPago = socio?.pagos?.[0];
  const estadoPago = lastPago?.estado || 'PENDIENTE';

  return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{styles}</style>

      {/* ── Navbar ── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 1.5rem',
        background: '#1a1a1a',
        borderBottom: '2px solid #FF4500',
        boxShadow: '0 4px 12px rgba(255,69,0,0.1)',
        gap: '1rem',
      }}>
        <h1
          className="nav-title"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#FF4500', margin: 0, letterSpacing: '2px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          IMPULSO
        </h1>
        <div className="nav-btns" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
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
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', background: '#FF4500', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = '#ff6625'}
            onMouseLeave={e => e.currentTarget.style.background = '#FF4500'}
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </nav>

      {/* ── Contenido ── */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#FF4500', fontWeight: '600', margin: '0 0 0.4rem' }}>BIENVENIDO</p>
          <h2
            className="welcome-name"
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3.5rem', color: '#fff', margin: 0, lineHeight: 1.1 }}
          >
            {socio?.nombre} {socio?.apellido}
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#999', margin: '0.4rem 0 0' }}>Tu información de membresía y estado de pago</p>
        </div>

        {/* ── Info Personal + Plan ── */}
        <div className="grid-2">
          {/* Info Personal */}
          <div className="dash-card">
            <div className="card-label"><User size={14} /> Información Personal</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.78rem', color: '#999', margin: '0 0 0.25rem', fontWeight: 500 }}>Email</p>
                <p style={{ fontSize: '1rem', margin: 0, fontWeight: 600, wordBreak: 'break-word' }}>{socio?.email || 'No registrado'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', color: '#999', margin: '0 0 0.25rem', fontWeight: 500 }}>Teléfono</p>
                <p style={{ fontSize: '1rem', margin: 0, fontWeight: 600 }}>{socio?.telefono || 'No registrado'}</p>
              </div>
            </div>
          </div>

          {/* Plan */}
          <div className="dash-card">
            <div className="card-label"><Dumbbell size={14} /> Tu Plan</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.78rem', color: '#999', margin: '0 0 0.25rem', fontWeight: 500 }}>Membresía</p>
                <p style={{ fontSize: '1.3rem', margin: 0, fontWeight: 'bold', color: '#FF4500' }}>{socio?.plan}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', color: '#999', margin: '0 0 0.25rem', fontWeight: 500 }}>Precio Mensual</p>
                <p style={{ fontSize: '1.2rem', margin: 0, fontWeight: 600 }}>{planPrecio[socio?.plan]}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Estado de Pago ── */}
        <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-label"><CreditCard size={14} /> Estado de Pago</div>

          <div className="grid-pago">
            {/* Badge estado */}
            <div style={{
              background: '#0a0a0a', padding: '1.2rem', borderRadius: '8px',
              border: `2px solid ${estadoColor[estadoPago] || '#999'}`,
              textAlign: 'center',
              ...(estadoPago === 'VENCIDO' && { animation: 'pulse-vencido 2s infinite' }),
            }}>
              <p style={{ fontSize: '0.78rem', color: '#999', margin: '0 0 0.4rem', fontWeight: 500 }}>Estado Actual</p>
              <p style={{ fontSize: '1.6rem', margin: 0, fontWeight: 'bold', color: estadoColor[estadoPago] || '#999' }}>
                {estadoLabel[estadoPago] || estadoPago}
              </p>
            </div>

            {/* Vencimiento */}
            <div style={{ background: '#0a0a0a', padding: '1.2rem', borderRadius: '8px', border: '2px solid #333', textAlign: 'center' }}>
              <p style={{ fontSize: '0.78rem', color: '#999', margin: '0 0 0.4rem', fontWeight: 500 }}>Vencimiento</p>
              <p style={{ fontSize: '1.3rem', margin: 0, fontWeight: 'bold' }}>
                {lastPago
                  ? new Date(lastPago.vencimiento).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Sin registro'}
              </p>
            </div>
          </div>

          {/* Último pago */}
          {lastPago && (
            <div style={{ padding: '0.9rem 1rem', background: '#0a0a0a', borderRadius: '6px', borderLeft: `4px solid ${estadoColor[estadoPago]}`, marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.78rem', color: '#999', margin: '0 0 0.3rem', fontWeight: 500 }}>Último Pago</p>
              <p style={{ fontSize: '1rem', margin: 0, fontWeight: 'bold' }}>
                ${lastPago.monto.toLocaleString('es-AR', { minimumFractionDigits: 0 })} • {new Date(lastPago.fecha).toLocaleDateString('es-AR')}
              </p>
            </div>
          )}

          {/* Alertas */}
          {estadoPago === 'VENCIDO' && (
            <div style={{ padding: '0.9rem 1rem', background: 'rgba(239,68,68,0.12)', borderLeft: '4px solid #ef4444', borderRadius: '6px', color: '#ff8a8a' }}>
              <p style={{ fontSize: '0.95rem', margin: '0 0 0.4rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} /> Tu plan ha vencido
              </p>
              <p style={{ fontSize: '0.85rem', margin: 0, color: '#ff7070' }}>
                Regularizá tu situación contactando con administración para reactivar tu membresía.
              </p>
            </div>
          )}

          {estadoPago === 'PENDIENTE' && (
            <div style={{ padding: '0.9rem 1rem', background: 'rgba(234,179,8,0.12)', borderLeft: '4px solid #eab308', borderRadius: '6px', color: '#ffd744' }}>
              <p style={{ fontSize: '0.95rem', margin: '0 0 0.4rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={16} /> Pago pendiente
              </p>
              <p style={{ fontSize: '0.85rem', margin: 0, color: '#ffc947' }}>
                Completá tu pago antes de la fecha de vencimiento para mantener activa tu membresía.
              </p>
            </div>
          )}
        </div>

        {/* ── Cambiar Plan ── */}
        <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-label"><RefreshCw size={14} /> Cambiar Plan</div>

          {/* Plan actual + pendiente */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: '#777' }}>Plan actual:</span>
            <span style={{ background: '#FF450020', color: '#FF4500', padding: '0.3rem 0.75rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '1px' }}>
              {PLANES.find(p => p.value === socio?.plan)?.label || socio?.plan}
            </span>
            {socio?.planPendiente && (
              <span style={{ background: '#FF4500', color: '#fff', padding: '0.3rem 0.75rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <RefreshCw size={12} /> Cambio a {PLANES.find(p => p.value === socio.planPendiente)?.label || socio.planPendiente} en renovación
              </span>
            )}
          </div>

          {/* Feedback */}
          {planMsg.texto && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1.2rem', fontSize: '0.9rem',
              background: planMsg.tipo === 'ok' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              borderLeft: `4px solid ${planMsg.tipo === 'ok' ? '#22c55e' : '#ef4444'}`,
              color: planMsg.tipo === 'ok' ? '#4ade80' : '#ff8a8a',
            }}>
              {planMsg.texto}
            </div>
          )}

          {/* Selector planes */}
          <div className="planes-row">
            {PLANES.map(p => {
              const esActual = p.value === socio?.plan;
              const esPendiente = p.value === socio?.planPendiente;
              const seleccionado = p.value === planSeleccionado;
              const bloqueado = !!socio?.planPendiente || esActual;
              return (
                <button
                  key={p.value}
                  onClick={() => !bloqueado && setPlanSeleccionado(p.value)}
                  disabled={bloqueado}
                  style={{
                    flex: 1, minWidth: 90, padding: '0.85rem 0.75rem',
                    background: seleccionado ? '#FF450020' : '#0a0a0a',
                    border: `2px solid ${seleccionado ? '#FF4500' : esActual ? '#444' : '#222'}`,
                    borderRadius: '6px',
                    color: esActual ? '#555' : seleccionado ? '#FF4500' : '#aaa',
                    cursor: bloqueado ? 'not-allowed' : 'pointer',
                    opacity: (socio?.planPendiente && !esPendiente && !esActual) ? 0.4 : 1,
                    transition: 'all 0.2s', textAlign: 'center',
                  }}
                >
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '1px' }}>{p.label}</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.78rem', marginTop: '0.2rem' }}>{p.precio}/mes</div>
                  {esActual && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: '#555', marginTop: '0.2rem' }}>Plan actual</div>}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCambiarPlan}
            disabled={planLoading || !!socio?.planPendiente || planSeleccionado === socio?.plan}
            style={{
              marginTop: '1.2rem', width: '100%', padding: '0.85rem',
              background: (planLoading || !!socio?.planPendiente || planSeleccionado === socio?.plan) ? '#333' : '#FF4500',
              color: (planLoading || !!socio?.planPendiente || planSeleccionado === socio?.plan) ? '#666' : '#fff',
              border: 'none', borderRadius: '4px',
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '2px',
              cursor: (planLoading || !!socio?.planPendiente || planSeleccionado === socio?.plan) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {planLoading ? 'Procesando...' : socio?.planPendiente ? 'Ya tenés un cambio pendiente' : 'Solicitar Cambio de Plan →'}
          </button>

          {socio?.planPendiente && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', color: '#666', textAlign: 'center', marginTop: '0.8rem' }}>
              El nuevo plan se activará en tu próxima renovación. Contactá al admin para cancelar el cambio.
            </p>
          )}
        </div>

        {/* ── Asistencia ── */}
        <div className="dash-card" style={{ marginBottom: '2rem' }}>
          <div className="card-label"><CalendarDays size={14} /> Mi Asistencia</div>

          {asistenciasLoading ? (
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Cargando asistencias...</p>
          ) : (
            <>
              {/* Barra semanal */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#999', fontWeight: 500 }}>Días usados esta semana</span>
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem',
                    color: asistenciaSemana.limite && asistenciaSemana.diasUsados >= asistenciaSemana.limite ? '#FF4500' : '#22c55e',
                  }}>
                    {asistenciaSemana.diasUsados} / {asistenciaSemana.limite ?? '∞'}
                  </span>
                </div>
                {asistenciaSemana.limite && (
                  <div style={{ height: 10, background: '#222', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min((asistenciaSemana.diasUsados / asistenciaSemana.limite) * 100, 100)}%`,
                      background: asistenciaSemana.diasUsados >= asistenciaSemana.limite
                        ? 'linear-gradient(90deg, #FF4500, #ff6a35)'
                        : 'linear-gradient(90deg, #22c55e, #4ade80)',
                      borderRadius: 5,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                )}
                {asistenciaSemana.limite && asistenciaSemana.diasUsados >= asistenciaSemana.limite && (
                  <p style={{ fontSize: '0.8rem', color: '#FF4500', margin: '0.5rem 0 0', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={13} /> Límite semanal alcanzado para tu plan
                  </p>
                )}
              </div>

              {/* Historial */}
              <p style={{ fontSize: '0.78rem', color: '#666', fontWeight: 600, margin: '0 0 0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Últimas visitas
              </p>
              {asistencias.slice(0, 10).length === 0 ? (
                <p style={{ color: '#555', fontSize: '0.9rem' }}>No tenés visitas registradas aún.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {asistencias.slice(0, 10).map((a, i) => (
                    <div key={i} className="visita-row" style={{ border: `1px solid ${a.alerta ? '#FF450040' : '#1e1e1e'}` }}>
                      <span className="visita-date" style={{ fontSize: '0.9rem', color: '#ddd', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle size={13} color="#22c55e" />
                        {new Date(a.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="visita-time" style={{ fontSize: '0.85rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} />
                        {new Date(a.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {a.alerta && (
                        <span style={{ fontSize: '0.75rem', color: '#FF4500', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <AlertTriangle size={12} /> Excedido
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Mis Rutinas ── */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="card-label"><Activity size={14} /> Mi Rutina de Entrenamiento</div>

          {rutinasLoading ? (
            <div className="dash-card"><p style={{ color: '#666' }}>Cargando rutinas...</p></div>
          ) : rutinas.length === 0 ? (
            <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <Dumbbell size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
              <p style={{ color: '#555' }}>Aún no tenés rutinas asignadas.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {rutinas.map((rutina) => {
                const ejerciciosPorDia = rutina.ejercicios.reduce((acc, re) => {
                  if (!acc[re.diaSemana]) acc[re.diaSemana] = [];
                  acc[re.diaSemana].push(re);
                  return acc;
                }, {});

                const ordenDias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

                return (
                  <div key={rutina.id}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#fff', margin: '0 0 0.5rem', letterSpacing: '1px' }}>
                        {rutina.nombre}
                      </h3>
                      {rutina.descripcion && <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>{rutina.descripcion}</p>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {ordenDias.map(dia => {
                        const ejercicios = ejerciciosPorDia[dia];
                        if (!ejercicios) return null;

                        return (
                          <div key={dia}>
                            <h4 style={{
                              background: '#FF450015', color: '#FF4500', padding: '0.5rem 1rem',
                              borderRadius: '4px', borderLeft: '3px solid #FF4500',
                              fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem',
                              display: 'inline-block'
                            }}>
                              {dia}
                            </h4>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                              gap: '1.5rem'
                            }}>
                              {ejercicios.map(re => (
                                <EjercicioCard
                                  key={re.id}
                                  ejercicio={re.ejercicio}
                                  rutinaEjercicio={re}
                                />
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

      </div>
    </div>
  );
}