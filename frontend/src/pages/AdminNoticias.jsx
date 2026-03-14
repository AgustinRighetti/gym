import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  PlusCircle, Trash2, Edit2, X, Save, 
  Image as ImageIcon, Loader, CheckCircle, AlertCircle,
  Eye, EyeOff, Calendar
} from 'lucide-react';

export default function AdminNoticias() {
  const { token } = useAuth();
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    estado: 'BORRADOR',
    imagen: null
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchNoticias();
  }, []);

  const fetchNoticias = async () => {
    try {
      const { data } = await axios.get(`${BASE}/noticias`, { headers });
      setNoticias(data);
    } catch (err) {
      setError('Error al cargar las noticias');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      contenido: '',
      estado: 'BORRADOR',
      imagen: null
    });
    setEditingId(null);
    setError('');
  };

  const handleEdit = (noticia) => {
    setFormData({
      titulo: noticia.titulo,
      contenido: noticia.contenido,
      estado: noticia.estado,
      imagen: null // No precargamos la imagen para no subirla de nuevo si no cambia
    });
    setEditingId(noticia.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');

    const data = new FormData();
    data.append('titulo', formData.titulo);
    data.append('contenido', formData.contenido);
    data.append('estado', formData.estado);
    if (formData.imagen) {
      data.append('imagen', formData.imagen);
    }

    try {
      if (editingId) {
        await axios.put(`${BASE}/noticias/${editingId}`, data, {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Noticia actualizada correctamente');
      } else {
        if (!formData.imagen) {
          setError('La imagen es obligatoria para nuevas noticias');
          setSubmitLoading(false);
          return;
        }
        await axios.post(`${BASE}/noticias`, data, {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Noticia creada correctamente');
      }
      setShowModal(false);
      resetForm();
      fetchNoticias();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la noticia');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    setSubmitLoading(true);
    try {
      await axios.delete(`${BASE}/noticias/${deleteModal.id}`, { headers });
      setSuccess('Noticia eliminada correctamente');
      setDeleteModal({ show: false, id: null });
      fetchNoticias();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al eliminar la noticia');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
      <Loader className="spin" size={32} />
      <p style={{ marginTop: '1rem' }}>Cargando noticias...</p>
    </div>
  );

  return (
    <div style={{ padding: '1.5rem', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #FF450030' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.8rem', color: '#FF4500', fontWeight: '600', margin: '0 0 0.3rem', textTransform: 'uppercase', letterSpacing: '1px' }}>ADMINISTRACIÓN</p>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', margin: 0, letterSpacing: '1px' }}>Gestión de Noticias</h3>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.2rem', background: '#FF4500', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '1px' }}
        >
          <PlusCircle size={18} /> Nueva Noticia
        </button>
      </div>

      {success && (
        <div style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', borderLeft: '4px solid #22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {error && !showModal && (
        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', borderLeft: '4px solid #ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #FF4500' }}>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#FF4500' }}>Imagen</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#FF4500' }}>Título</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#FF4500' }}>Fecha</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: '#FF4500' }}>Estado</th>
              <th style={{ padding: '1rem', textAlign: 'right', color: '#FF4500' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {noticias.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#555' }}>No hay noticias registradas</td>
              </tr>
            ) : noticias.map(n => (
              <tr key={n.id} style={{ borderBottom: '1px solid #2a2a2a', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#222'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <img src={n.imagen} alt={n.titulo} style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #333' }} />
                </td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{n.titulo}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#888' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} />
                    {new Date(n.fecha).toLocaleDateString('es-AR')}
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  <span style={{ 
                    padding: '0.3rem 0.7rem', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold',
                    background: n.estado === 'PUBLICADO' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                    color: n.estado === 'PUBLICADO' ? '#22c55e' : '#eab308'
                  }}>
                    {n.estado === 'PUBLICADO' ? <><Eye size={12} style={{marginRight: 4}}/> PUBLICADO</> : <><EyeOff size={12} style={{marginRight: 4}}/> BORRADOR</>}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleEdit(n)}
                      style={{ padding: '0.5rem', background: '#2a2a2a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => setDeleteModal({ show: true, id: n.id })}
                      style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', cursor: 'pointer' }}
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Creación/Edición */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #FF450060', borderRadius: '12px', maxWidth: '600px', width: '100%', padding: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#FF4500', margin: 0, letterSpacing: '1px' }}>
                {editingId ? 'Editar Noticia' : 'Nueva Noticia'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.4rem', fontWeight: 600 }}>TÍTULO</label>
                <input 
                  type="text" 
                  value={formData.titulo}
                  onChange={e => setFormData({...formData, titulo: e.target.value})}
                  required
                  style={{ width: '100%', padding: '0.8rem', background: '#0a0a0a', border: '1px solid #333', borderRadius: '6px', color: '#fff', outline: 'none' }}
                  placeholder="Ej: Gran apertura de la nueva sala de pesas"
                />
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.4rem', fontWeight: 600 }}>CONTENIDO</label>
                <textarea 
                  value={formData.contenido}
                  onChange={e => setFormData({...formData, contenido: e.target.value})}
                  required
                  style={{ width: '100%', padding: '0.8rem', background: '#0a0a0a', border: '1px solid #333', borderRadius: '6px', color: '#fff', outline: 'none', minHeight: '150px', resize: 'vertical', fontFamily: "'Inter', sans-serif" }}
                  placeholder="Escribe el contenido de la noticia aquí..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.4rem', fontWeight: 600 }}>ESTADO</label>
                  <select 
                    value={formData.estado}
                    onChange={e => setFormData({...formData, estado: e.target.value})}
                    style={{ width: '100%', padding: '0.8rem', background: '#0a0a0a', border: '1px solid #333', borderRadius: '6px', color: '#fff', outline: 'none' }}
                  >
                    <option value="BORRADOR">Borrador</option>
                    <option value="PUBLICADO">Publicado</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.4rem', fontWeight: 600 }}>IMAGEN {editingId && '(opcional)'}</label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem', 
                    padding: '0.82rem', 
                    background: '#2a2a2a', 
                    border: '1px dashed #555', 
                    borderRadius: '6px', 
                    color: formData.imagen ? '#FF4500' : '#888', 
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setFormData({...formData, imagen: e.target.files[0]})}
                      style={{ display: 'none' }}
                    />
                    <ImageIcon size={16} /> 
                    {formData.imagen ? formData.imagen.name : 'Vincular imagen'}
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '0.8rem', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={submitLoading}
                  style={{ flex: 1, padding: '0.8rem', background: '#FF4500', color: '#fff', border: 'none', borderRadius: '6px', cursor: submitLoading ? 'not-allowed' : 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: submitLoading ? 0.7 : 1 }}
                >
                  {submitLoading ? <Loader className="spin" size={18} /> : <><Save size={18} /> {editingId ? 'Actualizar' : 'Publicar'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteModal.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #ef444460', borderRadius: '10px', maxWidth: '400px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', color: '#ef4444', margin: '0 0 1rem' }}>¿Eliminar noticia?</h3>
            <p style={{ color: '#aaa', lineHeight: 1.5, marginBottom: '2rem' }}>Esta acción es permanente y eliminará la noticia y su imagen de forma definitiva.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setDeleteModal({ show: false, id: null })}
                style={{ padding: '0.6rem 1.2rem', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' }}
              >
                No, cancelar
              </button>
              <button 
                onClick={handleDelete}
                disabled={submitLoading}
                style={{ padding: '0.6rem 1.2rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: submitLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                {submitLoading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
