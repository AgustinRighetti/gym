import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPlanes = () => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanes = async () => {
      const { data } = await axios.get('/api/planes');
      setPlanes(data);
      setLoading(false);
    };
    fetchPlanes();
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h1>Gestión de Planes</h1>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Días/Semana</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {planes.map(plan => (
            <tr key={plan.id}>
              <td>{plan.codigo}</td>
              <td>{plan.nombre}</td>
              <td>{plan.diasSemana ?? 'Ilimitado'}</td>
              <td>${plan.precio.toLocaleString('es-AR')}</td>
              <td>{plan.activo ? 'Activo' : 'Inactivo'}</td>
              <td>
                <button>Editar</button>
                <button disabled={plan.countSocios > 0}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPlanes;