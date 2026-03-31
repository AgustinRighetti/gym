// Voy a buscar el línea exacta que renderiza un objeto
// Patrón: buscar cualquier {variable} que NO sea:
// - propiedades (.algo)
// - funciones
// - números
// - strings que se sabe que son strings

import fs from 'fs';

const content = fs.readFileSync('/Users/agustinrighetti/Workspace/Gym/frontend/src/pages/Admin.jsx', 'utf8');
const lines = content.split('\n');

// Expresión regular para encontrar {word} sin . después
const pattern = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}(?![\?.])/g;

const skipVars = new Set([
  'i', 'idx', 'key', 'size', 'Icon', 'color', 'value', 'label', 'precio',
  'col', 'f', 't', 'm', 'c', 'p', 'd', 's', 'e', 'error', 'estadoPago',
  'lastPago', 'isExpanded', 'RefreshCw', 'Trash2', 'ChevronUp', 'ChevronDown',
  'Home', 'LogOut', 'Plus', 'X', 'AlertTriangle', 'CheckCircle', 'Clock',
  'TrendingUp', 'TrendingDown', 'AlertCircle', 'cajaAnio', 'MESES', 'nombre',
  'apellido', 'email', 'Icon', 'handleLogout', 'label', 'value', 'color'
]);

console.log('=== SEARCHING FOR SUSPICIOUS RENDERS ===\n');

lines.forEach((line, i) => {
  if (line.includes('import') || line.includes('const ') || line.includes('function')) return;
  
  let match;
  const regex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}(?![\?.])/g;
  while ((match = regex.exec(line)) !== null) {
    const varName = match[1];
    if (!skipVars.has(varName) && !varName.match(/^[A-Z]/)) {
      console.log(`Line ${i + 1}: {${varName}} - ${line.trim().substring(0, 80)}`);
    }
  }
});
