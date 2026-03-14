import React from 'react';

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='200' viewBox='0 0 280 200'%3E%3Crect width='280' height='200' fill='%231a1a1a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-size='13' font-family='sans-serif'%3ESin imagen%3C/text%3E%3C/svg%3E";

export default function EjercicioCard({ ejercicio, rutinaEjercicio, onDelete, onImageError, editable = false }) {
  return (
    <div style={{
      background: '#1a1a1a',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #2a2a2a',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>

      {/* Imagen — altura fija siempre */}
      <div style={{
        width: '100%',
        height: '180px',
        overflow: 'hidden',
        background: '#111',
        flexShrink: 0,
      }}>
        <img
          src={ejercicio.imageUrl || PLACEHOLDER}
          alt={ejercicio.nombre}
          onError={e => {
            e.target.onerror = null;
            e.target.src = PLACEHOLDER;
            onImageError?.();
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>

      {/* Contenido */}
      <div style={{
        padding: '0.85rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        flex: 1,
      }}>
        <h3 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1rem',
          letterSpacing: '1px',
          color: '#fff',
          lineHeight: 1.2,
          margin: 0,
        }}>
          {ejercicio.nombre}
        </h3>

        <p style={{
          fontSize: '0.8rem',
          color: '#FF4500',
          margin: 0,
          fontWeight: 500,
        }}>
          {ejercicio.grupoMuscular}
        </p>

        {ejercicio.descripcion && (
          <p style={{
            fontSize: '0.78rem',
            color: '#888',
            margin: 0,
            marginTop: '0.25rem',
            lineHeight: 1.4,
          }}>
            {ejercicio.descripcion}
          </p>
        )}

        {/* Detalles de rutina */}
        {rutinaEjercicio && (
          <div style={{
            marginTop: '0.5rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid #2a2a2a',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: '#888' }}>Día</span>
              <span style={{ color: '#fff' }}>{rutinaEjercicio.diaSemana}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: '#888' }}>Series × Reps</span>
              <span style={{ color: '#fff' }}>{rutinaEjercicio.series} × {rutinaEjercicio.repeticiones}</span>
            </div>
            {rutinaEjercicio.notas && (
              <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.2rem' }}>
                {rutinaEjercicio.notas}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botón eliminar (modo editable) */}
      {editable && onDelete && (
        <button onClick={onDelete} style={{
          margin: '0 1rem 1rem',
          background: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '0.5rem',
          cursor: 'pointer',
          fontSize: '0.8rem',
        }}>
          Eliminar
        </button>
      )}
    </div>
  );
}