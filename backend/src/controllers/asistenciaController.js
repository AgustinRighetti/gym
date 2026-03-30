const prisma = require('../prisma');

// Función para calcular semana ISO del año
function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const PLAN_LIMITE = {
    UN_DIA: 1,
    DOS_DIAS: 2,
    TRES_DIAS: 3,
    LIBRE: null, // sin límite
};

// POST /asistencias/checkin — público (sin JWT)
async function registrarAsistenciaDNI(req, res) {
    try {
        const { dni } = req.body;
        if (!dni) {
            return res.status(400).json({ acceso: false, mensaje: 'Debe ingresar un DNI' });
        }

        // Buscar al User por DNI y traernos el Socio
        const user = await prisma.user.findUnique({
            where: { dni },
            include: {
                socio: {
                    include: {
                        pagos: { orderBy: { fecha: 'desc' }, take: 1 },
                        plan: { select: { codigo: true } },
                    }
                }
            }
        });

        if (!user || !user.socio) {
            return res.status(404).json({ acceso: false, mensaje: 'DNI no encontrado o no asociado a un socio.' });
        }

        const socio = user.socio;

        // Verificar pago activo: estado PAGADO y no vencido
        const lastPago = socio.pagos[0];
        const now = new Date();
        const tieneAcceso =
            lastPago &&
            lastPago.estado === 'PAGADO' &&
            new Date(lastPago.vencimiento) >= now;

        if (!tieneAcceso) {
            return res.json({
                acceso: false,
                mensaje: 'Membresía inactiva o vencida.',
            });
        }

        // Calcular semana ISO y año actual
        const semana = getISOWeek(now);
        const anio = now.getFullYear();

        // Contar asistencias de esta semana para este socio
        const asistenciasSemana = await prisma.asistencia.count({
            where: { socioId: socio.id, semana, anio },
        });

        const limite = PLAN_LIMITE[socio.plan?.codigo];
        const excedio = limite !== null && asistenciasSemana >= limite;

        // Registrar asistencia siempre (con o sin alerta)
        await prisma.asistencia.create({
            data: { socioId: socio.id, semana, anio, alerta: excedio },
        });

        if (excedio) {
            return res.json({
                acceso: true,
                alerta: true,
                nombre: socio.nombre,
                mensaje: `Límite semanal alcanzado (${limite} día${limite > 1 ? 's' : ''}). Ingreso registrado con alerta.`,
            });
        }

        return res.json({
            acceso: true,
            alerta: false,
            nombre: socio.nombre,
            mensaje: `¡Bienvenido!`,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ acceso: false, mensaje: 'Error interno del servidor.' });
    }
}

// GET /asistencias/socio/:socioId — admin o el propio socio
async function getAsistenciasSocio(req, res) {
    try {
        const socioId = parseInt(req.params.socioId);
        const { rol, userId } = req.user;

        // Si es SOCIO, verificar que sea su propio perfil
        const socio = await prisma.socio.findUnique({ where: { id: socioId } });
        if (!socio) return res.status(404).json({ message: 'Socio no encontrado' });

        if (rol === 'SOCIO') {
            if (socio.usuarioId !== userId) {
                return res.status(403).json({ message: 'No tenés permiso para ver estas asistencias' });
            }
        }

        const asistencias = await prisma.asistencia.findMany({
            where: { socioId },
            orderBy: { fecha: 'desc' },
            include: { socio: { select: { nombre: true, apellido: true, plan: { select: { codigo: true, nombre: true } } } } },
        });

        res.json(asistencias);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener asistencias' });
    }
}

// GET /asistencias/semana — solo admin
// Soporta ?alerta=true para filtrar solo alertas
async function getAsistenciasSemana(req, res) {
    try {
        if (req.user.rol !== 'ADMIN') {
            return res.status(403).json({ message: 'Solo el admin puede ver las asistencias de la semana' });
        }

        const now = new Date();
        const semana = getISOWeek(now);
        const anio = now.getFullYear();

        const filtroAlerta = req.query.alerta === 'true' ? true : undefined;

        const where = {
            semana,
            anio,
            ...(filtroAlerta !== undefined && { alerta: filtroAlerta }),
        };

        const asistencias = await prisma.asistencia.findMany({
            where,
            orderBy: { fecha: 'desc' },
            include: {
                socio: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        plan: { select: { codigo: true, nombre: true } },
                    },
                },
            },
        });

        // Agrupar por socio para contar días usados
        const resumen = {};
        for (const a of asistencias) {
            const key = a.socioId;
            if (!resumen[key]) {
                resumen[key] = {
                    socio: a.socio,
                    diasUsados: 0,
                    limite: PLAN_LIMITE[a.socio.plan?.codigo],
                    ultimaVisita: a.fecha,
                    tieneAlerta: false,
                    asistencias: [],
                };
            }
            resumen[key].diasUsados++;
            if (a.alerta) resumen[key].tieneAlerta = true;
            resumen[key].asistencias.push(a);
        }

        res.json(Object.values(resumen));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener asistencias de la semana' });
    }
}

module.exports = {
    registrarAsistenciaDNI,
    getAsistenciasSocio,
    getAsistenciasSemana,
};
