const axios = require('axios');

const WGER_API_BASE = 'https://wger.de/api/v2';

// Buscar ejercicio en Wger y obtener base_id
async function buscarEjercicioWger(nombre) {
  try {
    const response = await axios.get(`${WGER_API_BASE}/exercise/search/`, {
      params: {
        term: nombre,
        language: 2, // English
        format: 'json'
      }
    });

    if (response.data.suggestions && response.data.suggestions.length > 0) {
      return response.data.suggestions[0].data.id; // base_id
    }
    return null;
  } catch (error) {
    console.error('Error buscando ejercicio en Wger:', error.message);
    return null;
  }
}

// Obtener imagen del ejercicio
async function obtenerImagenEjercicio(wgerBaseId) {
  try {
    const response = await axios.get(`${WGER_API_BASE}/exerciseimage/`, {
      params: {
        exercise_base: wgerBaseId,
        format: 'json'
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0].image;
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo imagen de Wger:', error.message);
    return null;
  }
}

module.exports = {
  buscarEjercicioWger,
  obtenerImagenEjercicio
};
