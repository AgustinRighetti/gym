# GYM APP - Aplicación Web Completa para Gimnasio

Aplicación web moderna para gestión de gimnasios con panel de socios y panel administrativo.

## 🏗️ Estructura del Proyecto

```
gym-app/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── prisma.js
│   │   └── index.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── context/
    │   ├── pages/
    │   ├── components/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env
    ├── vite.config.js
    └── package.json
```

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+
- PostgreSQL 12+
- npm o yarn

### Configuración del Backend

1. Navega a la carpeta backend:

```bash
cd backend
```

2. Crea un archivo `.env` con tus credenciales de PostgreSQL (ya incluido):

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/gymdb?schema=public"
JWT_SECRET="your_jwt_secret_here"
PORT=3000
```

3. Instala las dependencias:

```bash
npm install
```

4. Ejecuta las migraciones de Prisma:

```bash
npx prisma migrate dev --name init
```

5. Inicia el servidor backend:

```bash
npm run dev
```

El backend estará disponible en `http://localhost:3000`

### Configuración del Frontend

1. En otra terminal, navega a la carpeta frontend:

```bash
cd frontend
```

2. Instala las dependencias (ya debería estar hecho):

```bash
npm install
```

3. Inicia el servidor de desarrollo:

```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## 📊 Funcionalidades

> **Nota:** se agregó lógica de cambios de plan en el ciclo de facturación. Vea más abajo para detalles.

### Backend (API REST)

#### Autenticación
- `POST /auth/register` - Registrar nuevo usuario/socio
- `POST /auth/login` - Iniciar sesión

#### Socios
- `GET /socios` - Obtener todos los socios (requiere autenticación)
- `POST /socios` - Crear nuevo socio (requiere autenticación)
- `GET /socios/me` - Obtener datos del socio logueado
- `PUT /socios/:id/plan` - Programar cambio de plan (admin o socio propio)
- `DELETE /socios/:id/plan-pendiente` - Cancelar plan pendiente (solo admin)

#### Pagos
- `GET /pagos` - Obtener todos los pagos (requiere autenticación)
- `POST /pagos` - Registrar nuevo pago (requiere autenticación)
- `PUT /pagos/:id` - Actualizar estado de pago (requiere autenticación)

### Frontend

#### Landing Page
- Página inicial con enlaces a login y registro

#### Login
- Autenticación con email y contraseña
- Redirecionamiento según rol (admin → /admin, socio → /dashboard)
- Gestión de token JWT

#### Registro
- Formulario completo: nombre, apellido, email, password, teléfono, plan
- Creación automática de perfil de socio

#### Panel de Socio (`/dashboard`)
- Ver información personal
- Consultar estado de pago
- Fecha de vencimiento del plan
- Indicador visual del estado (pagado, pendiente, vencido)

#### Panel Admin (`/admin`)
- Tabla con todos los socios
- Filtros por estado de pago
- Contadores resumen (total, pagados, pendientes, vencidos)
- Botón para marcar pagos como realizados

## 🎨 Estilo Visual

- **Fondo**: #0a0a0a (gris oscuro)
- **Acento**: #FF4500 (naranja)
- **Títulos**: Bebas Neue (Google Fonts)
- **Texto**: Inter (Google Fonts)
- **Estética**: Industrial/Oscura

## 🔐 Seguridad

- Passwords hasheados con bcrypt (10 rounds)
- Autenticación JWT con expiración de 8 horas
- Rutas protegidas con middleware de autenticación
- Validación de roles en rutas específicas

## 📅 Lógica de Pagos

- Los socios se marcan como "VENCIDO" si pasaron 30 días desde el último pago
- Estados de pago: PAGADO, PENDIENTE, VENCIDO
- El admin puede marcar un pago como realizado
- Al crear un pago, automáticamente se marca como PAGADO y se actualiza el estado del socio a ACTIVO

## 💳 Planes de Membresía

- **Básico**: $15.000 (acceso sala musculación)
- **Full**: $22.000 (musculación + clases funcionales)
- **Elite**: $30.000 (acceso total + beneficios especiales)

### Cambio de plan
- Los socios pueden solicitar un nuevo plan una sola vez por ciclo. El cambio se aplica al momento de registrar el siguiente pago y no afecta el plan activo actual.
- El admin puede programar o cancelar cualquier plan pendiente en cualquier momento.

## 🛠️ Tecnologías Utilizadas

### Backend
- Node.js + Express
- PostgreSQL
- Prisma ORM
- JWT (jsonwebtoken)
- bcrypt

### Frontend
- React 18
- Vite
- React Router DOM v6
- Axios

## 📝 Variables de Entorno

### Backend (.env)
```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/gymdb?schema=public
JWT_SECRET=your_jwt_secret_here
PORT=3000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

## 🧪 Pruebas Manuales

1. Registra un nuevo usuario desde `/register`
2. Inicia sesión desde `/login`
3. Explora tu panel personal en `/dashboard`
4. (Si eres admin) Accede a `/admin` para ver todos los socios

## 📦 Scripts Útiles

### Backend
```bash
npm run dev          # Inicia servidor en modo desarrollo
npm start            # Inicia servidor en producción
npx prisma studio   # Abre Prisma Studio para ver la BD
npx prisma migrate  # Ejecutar migraciones
```

### Frontend
```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Vista previa de build
```

## 🤝 Contribuciones

Este proyecto fue creado como demostración de una aplicación full-stack moderna.

## 📄 Licencia

Libre para usar y modificar.
