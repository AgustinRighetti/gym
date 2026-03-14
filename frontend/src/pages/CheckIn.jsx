import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { CheckCircle, AlertTriangle, XCircle, Delete } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function CheckIn() {
    const [estado, setEstado] = useState('ingreso');
    const [dni, setDni] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [nombre, setNombre] = useState('');
    const [countdown, setCountdown] = useState(null);

    const checkIn = useCallback(async () => {
        if (!dni || dni.length < 7) {
            setEstado('error');
            setMensaje('DNI inválido. Debe tener al menos 7 números.');
            setCountdown(3);
            return;
        }
        setEstado('cargando');
        setMensaje('');
        setNombre('');
        setCountdown(null);
        try {
            const { data } = await axios.post(`${BASE}/asistencias/checkin`, { dni });
            setNombre(data.nombre || '');
            setMensaje(data.mensaje || '');
            if (!data.acceso) setEstado('inactivo');
            else if (data.alerta) setEstado('alerta');
            else setEstado('ok');
            setCountdown(3);
        } catch (err) {
            setEstado('error');
            setMensaje(err.response?.data?.mensaje || 'Error de conexión. Intentá de nuevo.');
            setCountdown(3);
        }
    }, [dni]);

    const handleKeypad = (num) => {
        if (dni.length < 10) setDni(d => d + num);
    };
    const handleDelete = () => setDni(d => d.slice(0, -1));

    useEffect(() => {
        if (estado !== 'ingreso') return;
        const handleKeyDown = (e) => {
            if (e.key >= '0' && e.key <= '9') handleKeypad(e.key);
            else if (e.key === 'Backspace') handleDelete();
            else if (e.key === 'Enter') checkIn();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [estado, checkIn, dni]);

    useEffect(() => {
        if (countdown === null) return;
        if (countdown === 0) {
            setEstado('ingreso');
            setDni('');
            setCountdown(null);
            return;
        }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const BG = {
        ingreso:  '#0a0a0a',
        cargando: '#0a0a0a',
        ok:       '#14532d',
        alerta:   '#7c2d12',
        error:    '#7f1d1d',
        inactivo: '#7f1d1d',
    };

    const ResultIcon = () => {
        const props = { strokeWidth: 1, style: { display: 'block', margin: '0 auto' } };
        if (estado === 'ok')    return <CheckCircle    size={120} color="#4ade80" {...props} />;
        if (estado === 'alerta') return <AlertTriangle size={120} color="#fb923c" {...props} />;
        return <XCircle size={120} color="#f87171" {...props} />;
    };

    return (
        <div style={{
            minHeight: '100svh',
            background: BG[estado],
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
            transition: 'background 0.3s',
            padding: '1rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;600;700&display=swap');

                @keyframes pulse-in {
                    0%   { opacity: 0; transform: scale(0.9); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .check-in-content { animation: pulse-in 0.3s ease forwards; }

                @keyframes spin { to { transform: rotate(360deg); } }
                .spinner {
                    width: 72px; height: 72px;
                    border: 6px solid rgba(255,255,255,0.1);
                    border-top-color: #FF4500;
                    border-radius: 50%;
                    animation: spin 0.9s linear infinite;
                    margin: 0 auto 2rem;
                }

                @keyframes countdown-shrink {
                    from { width: 100%; }
                    to   { width: 0%; }
                }
                .countdown-bar { animation: countdown-shrink 3s linear forwards; }

                .keypad-btn {
                    background: #1a1a1a;
                    border: 1px solid #333;
                    color: #fff;
                    font-family: 'Inter', sans-serif;
                    font-weight: 600;
                    border-radius: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.1s, transform 0.1s;
                    user-select: none;
                    /* mínimo táctil 52px */
                    min-height: 52px;
                    font-size: clamp(1.4rem, 5vw, 2.2rem);
                }
                .keypad-btn:active { background: #333; transform: scale(0.95); }
                .keypad-btn.action { background: #2a2a2a; }
                .keypad-btn.enter  {
                    background: #FF4500; border-color: #FF4500;
                    font-family: 'Bebas Neue', sans-serif;
                    letter-spacing: 2px;
                    font-size: clamp(1rem, 3.5vw, 1.6rem);
                }
                .keypad-btn.enter:active { background: #cc3400; }

                /* ── RESPONSIVE ── */
                @media (max-width: 480px) {
                    .dni-display {
                        font-size: clamp(2rem, 10vw, 3.5rem) !important;
                        padding: 1rem !important;
                        min-height: 70px !important;
                        letter-spacing: 3px !important;
                    }
                    .checkin-title {
                        font-size: clamp(2rem, 8vw, 3rem) !important;
                        margin-bottom: 1rem !important;
                    }
                    .result-title {
                        font-size: clamp(2.8rem, 14vw, 6rem) !important;
                    }
                    .result-subtitle {
                        font-size: clamp(1rem, 4vw, 1.6rem) !important;
                    }
                }
            `}</style>

            {/* Logo */}
            <div style={{
                position: 'absolute', top: '1.2rem', left: '50%', transform: 'translateX(-50%)',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(1.4rem, 5vw, 2rem)',
                letterSpacing: 4,
                color: 'rgba(255,255,255,0.7)',
                zIndex: 10,
                whiteSpace: 'nowrap',
            }}>
                IM<span style={{ color: '#FF4500' }}>PULSO</span>
            </div>

            {/* ── INGRESO ── */}
            {estado === 'ingreso' && (
                <div className="check-in-content" style={{ width: '100%', maxWidth: '460px', marginTop: '3rem' }}>
                    <h1 className="checkin-title" style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '3.5rem', color: '#fff', letterSpacing: 2, marginBottom: '1.5rem'
                    }}>
                        INGRESÁ TU DNI
                    </h1>

                    {/* DNI Display */}
                    <div className="dni-display" style={{
                        background: '#050505',
                        border: '2px solid #333',
                        borderRadius: '16px',
                        padding: '1.2rem',
                        fontSize: '3.5rem',
                        fontWeight: 700,
                        color: dni ? '#fff' : '#444',
                        letterSpacing: '5px',
                        marginBottom: '1.5rem',
                        minHeight: '90px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {dni || '········'}
                    </div>

                    {/* Keypad */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 'clamp(0.5rem, 2vw, 1rem)',
                    }}>
                        {[1,2,3,4,5,6,7,8,9].map(num => (
                            <button key={num} onClick={() => handleKeypad(num.toString())} className="keypad-btn">
                                {num}
                            </button>
                        ))}
                        {/* Fila 4 */}
                        <button onClick={handleDelete} className="keypad-btn action" aria-label="Borrar">
                            <Delete size={22} strokeWidth={1.5} />
                        </button>
                        <button onClick={() => handleKeypad('0')} className="keypad-btn">0</button>
                        <button onClick={checkIn} className="keypad-btn enter">ENTRAR</button>
                    </div>
                </div>
            )}

            {/* ── CARGANDO ── */}
            {estado === 'cargando' && (
                <div className="check-in-content">
                    <div className="spinner" />
                    <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 8vw, 3rem)', color: '#fff', letterSpacing: 3 }}>
                        VERIFICANDO...
                    </p>
                </div>
            )}

            {/* ── RESULTADO ── */}
            {estado !== 'ingreso' && estado !== 'cargando' && (
                <div className="check-in-content" key={estado + mensaje} style={{ zIndex: 10, padding: '0 1rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <ResultIcon />
                    </div>

                    <h1 className="result-title" style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 'clamp(3.5rem, 12vw, 8rem)',
                        color: '#fff',
                        lineHeight: 0.95,
                        letterSpacing: 2,
                        marginBottom: '1rem',
                        textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        whiteSpace: 'pre-line',
                    }}>
                        {estado === 'ok'      && `¡Bienvenido,\n${nombre}!`}
                        {estado === 'alerta'  && 'LÍMITE\nALCANZADO'}
                        {(estado === 'error' || estado === 'inactivo') && 'ACCESO\nDENEGADO'}
                    </h1>

                    <p className="result-subtitle" style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 'clamp(1rem, 4vw, 1.8rem)',
                        color: 'rgba(255,255,255,0.9)',
                        maxWidth: 600,
                        margin: '0 auto 2rem',
                        lineHeight: 1.4,
                    }}>
                        {mensaje}
                    </p>
                </div>
            )}

            {/* Progress bar */}
            {estado !== 'ingreso' && estado !== 'cargando' && countdown !== null && (
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 10,
                    background: 'rgba(255,255,255,0.1)', zIndex: 10
                }}>
                    <div className="countdown-bar" style={{
                        height: '100%',
                        background: estado === 'ok' ? '#22c55e' : '#FF4500',
                    }} />
                </div>
            )}
        </div>
    );
}