import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, Zap } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const navigate = useNavigate();
  const { login, token, user } = useAuth();

  if (token) {
    if (user?.rol === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const { data } = await axios.post(`${BASE}/auth/login`, { identifier, password });
      const decoded  = JSON.parse(atob(data.token.split('.')[1]));
      login(data.token, { userId: decoded.userId, rol: decoded.rol });
      navigate(decoded.rol === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.8rem 1rem',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div style={{
      background: '#0a0a0a',
      color: '#fff',
      minHeight: '100svh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: '1rem',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .login-input:focus { border-color: #FF4500 !important; }

        .login-btn {
          width: 100%;
          padding: 0.85rem;
          background: #FF4500;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: bold;
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background 0.2s, transform 0.1s;
        }
        .login-btn:hover:not(:disabled) { background: #e03d00; transform: translateY(-1px); }
        .login-btn:disabled { background: #cc3400; cursor: not-allowed; opacity: 0.7; }

        .pass-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .pass-toggle {
          position: absolute;
          right: 0.9rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.2s;
        }
        .pass-toggle:hover { color: #FF4500; }

        /* Grid background */
        .login-grid {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(#1a1a1a 1px, transparent 1px),
                            linear-gradient(90deg, #1a1a1a 1px, transparent 1px);
          background-size: 50px 50px;
          opacity: 0.25;
          pointer-events: none;
        }
        .glow {
          position: fixed;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255,69,0,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
      `}</style>

      <div className="login-grid" />
      <div className="glow" />

      <div style={{
        background: '#141414',
        padding: '2.5rem 2rem',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid #222',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <div style={{ width: 32, height: 32, background: '#FF4500', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} color="white" fill="white" />
          </div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: 3 }}>
            IM<span style={{ color: '#FF4500' }}>PULSO</span>
          </span>
        </div>

        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#fff', margin: '0 0 0.3rem', textAlign: 'center', letterSpacing: 2 }}>
          INICIAR SESIÓN
        </h1>
        <p style={{ textAlign: 'center', color: '#555', fontSize: '0.85rem', margin: '0 0 2rem' }}>
          Ingresá con tu DNI o email
        </p>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', color: '#ff8a8a', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.2rem', borderLeft: '4px solid #ef4444', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.82rem', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>
              DNI o Email
            </label>
            <input
              className="login-input"
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="Tu DNI o email"
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: '1.8rem' }}>
            <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.82rem', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>
              Contraseña
            </label>
            <div className="pass-wrapper">
              <input
                className="login-input"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: '2.8rem' }}
                required
              />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(v => !v)} tabIndex={-1} aria-label="Mostrar contraseña">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Ingresando...' : <><LogIn size={16} /> Ingresar</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: '#555' }}>
          ¿No tenés cuenta?{' '}
          <a href="/register" style={{ color: '#FF4500', textDecoration: 'none', fontWeight: 'bold' }}>
            Registrate aquí
          </a>
        </p>
      </div>
    </div>
  );
}