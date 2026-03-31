import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Eye, EyeOff, Zap, ArrowLeft } from 'lucide-react';

const VALID_PLANS = ['UN_DIA', 'DOS_DIAS', 'TRES_DIAS', 'LIBRE'];

const PLAN_LABELS = {
  UN_DIA:    { label: '1 Día / semana',    price: '$24.000', color: '#888' },
  DOS_DIAS:  { label: '2 Días / semana',   price: '$28.000', color: '#888' },
  TRES_DIAS: { label: '3 Días / semana',   price: '$30.000', color: '#FF4500' },
  LIBRE:     { label: 'Libre (ilimitado)', price: '$34.000', color: '#FFD700' },
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const planParam = searchParams.get('plan')?.toUpperCase();
  const plan = VALID_PLANS.includes(planParam) ? planParam : null;
  // Ensure plan is an object with expected keys
  const planObject = plan ? PLAN_LABELS[plan] : null;

  useEffect(() => {
    if (!planObject) navigate('/#planes', { replace: true });
  }, [planObject, navigate]);

  const [dni, setDni]           = useState('');
  const [nombre, setNombre]     = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const { data } = await axios.post(`${BASE}/auth/register`, {
        dni, nombre,
        email: email || undefined,
        password,
        telefono: telefono || undefined,
        plan: plan?.codigo,
        rol: 'SOCIO',
      });
      login(data.token, data.user);
      navigate(data.user.rol === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  if (!planObject) return null;

  const planInfo = planObject;

  const inputStyle = {
    width: '100%',
    padding: '0.8rem 1rem',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#f0f0f0',
    fontSize: '1rem',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.4rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '1px',
    color: '#888',
    textTransform: 'uppercase',
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div style={{
      background: '#0a0a0a',
      color: '#f0f0f0',
      minHeight: '100svh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: '2rem 1rem',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .reg-input:focus { border-color: #FF4500 !important; }
        .reg-btn { transition: background 0.2s, transform 0.1s; }
        .reg-btn:hover:not(:disabled) { background: #e03d00 !important; transform: translateY(-1px); }
        .reg-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .back-link:hover { color: #FF4500 !important; }
        .pass-toggle { position: absolute; right: 0.9rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #666; display: flex; align-items: center; padding: 0; transition: color 0.2s; }
        .pass-toggle:hover { color: #FF4500; }

        .login-grid {
          position: fixed; inset: 0;
          background-image: linear-gradient(#1a1a1a 1px, transparent 1px),
                            linear-gradient(90deg, #1a1a1a 1px, transparent 1px);
          background-size: 50px 50px;
          opacity: 0.25;
          pointer-events: none;
        }
        .glow {
          position: fixed; top: -20%; left: 50%; transform: translateX(-50%);
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(255,69,0,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
      `}</style>

      <div className="login-grid" />
      <div className="glow" />

      <div style={{
        background: '#141414',
        border: '1px solid #222',
        borderRadius: '12px',
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: '460px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ width: 32, height: 32, background: '#FF4500', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} color="white" fill="white" />
          </div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: 3 }}>
            IM<span style={{ color: '#FF4500' }}>PULSO</span>
          </span>
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#f0f0f0', margin: '0.3rem 0 1.8rem', textAlign: 'center', letterSpacing: 3 }}>
          CREAR CUENTA
        </h1>

        {/* Badge plan */}
        <div style={{
          background: '#0a0a0a',
          border: `1px solid ${planInfo.color}`,
          borderRadius: '6px',
          padding: '0.9rem 1rem',
          marginBottom: '1.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '2px', color: '#666', marginBottom: '0.2rem', textTransform: 'uppercase' }}>
              Plan seleccionado
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', letterSpacing: 2, color: planInfo.color }}>
              {planInfo.label}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', color: planInfo.color }}>
              {planInfo.price}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#555', letterSpacing: 1 }}>/ mes</div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', color: '#ff8a8a', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.2rem', borderLeft: '4px solid #ef4444', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={labelStyle}>DNI</label>
            <input className="reg-input" type="text" inputMode="numeric" pattern="[0-9]*"
              value={dni} onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 35123456" style={inputStyle} required minLength={7} />
          </div>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={labelStyle}>Nombre completo</label>
            <input className="reg-input" type="text"
              value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Tu nombre" style={inputStyle} required />
          </div>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={labelStyle}>Email <span style={{ color: '#555', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
            <input className="reg-input" type="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={labelStyle}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input className="reg-input" type={showPass ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" style={{ ...inputStyle, paddingRight: '2.8rem' }}
                required minLength={6} />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(v => !v)} tabIndex={-1} aria-label="Mostrar contraseña">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={labelStyle}>Teléfono <span style={{ color: '#555', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
            <input className="reg-input" type="tel"
              value={telefono} onChange={e => setTelefono(e.target.value)}
              placeholder="+54 9 351 123-4567" style={inputStyle} />
          </div>

          <button
            type="submit"
            className="reg-btn"
            disabled={loading}
            style={{
              width: '100%', padding: '0.9rem',
              background: '#FF4500', color: '#fff', border: 'none',
              borderRadius: '6px',
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: '3px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {loading ? 'Registrando...' : <><UserPlus size={16} /> Crear mi cuenta</>}
          </button>
        </form>

        <div style={{ marginTop: '1.4rem', textAlign: 'center', fontSize: '0.85rem', color: '#555' }}>
          ¿Ya tenés cuenta?{' '}
          <a href="/login" style={{ color: '#FF4500', textDecoration: 'none', fontWeight: 600 }}>Iniciá sesión</a>
        </div>

        <div style={{ marginTop: '0.8rem', textAlign: 'center' }}>
          <span
            className="back-link"
            onClick={() => navigate('/#planes')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#555', cursor: 'pointer', transition: 'color 0.2s' }}
          >
            <ArrowLeft size={13} /> Cambiar plan
          </span>
        </div>
      </div>
    </div>
  );
}