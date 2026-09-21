interface Showcase {
  headline: string;
  description: string;
  views: {
    label: string;
    icon: string;
    image: string;
    alt: string;
    caption: string;
    kind: string;
  }[];
  benefits: { icon: string; title: string; text: string }[];
}

export const showcases: Record<string, Showcase> = {
  sygna: {
    headline: 'Todo tu negocio. Una visión clara.',
    description:
      'Facturación, equipo y finanzas conectados en una plataforma. Menos herramientas dispersas y más información para decidir.',
    views: [
      {
        label: 'Tu equipo',
        icon: 'calendar',
        image: '/assets/sygna/sygna3.webp',
        alt: 'Pantalla de jornada y actividad del equipo en Sygna',
        caption: 'Jornadas y actividad del equipo, en un mismo lugar.',
        kind: 'device',
      },
    ],
    benefits: [
      {
        icon: 'document',
        title: 'Facturación conectada',
        text: 'Presupuestos, facturas y documentos organizados.',
      },
      {
        icon: 'calendar',
        title: 'Tu equipo, al día',
        text: 'Control horario, ausencias y gestión de personas.',
      },
      {
        icon: 'connections',
        title: 'Respuestas con IA',
        text: 'Consulta los datos de tu empresa con Sara AI.',
      },
    ],
  },
  tumesaya: {
    headline: 'Tú atiendes la mesa. La IA, la llamada.',
    description:
      'Un asistente de voz que atiende por teléfono, consulta la disponibilidad y gestiona reservas. También cuando tu equipo está ocupado.',
    views: [
      {
        label: 'Las reservas',
        icon: 'calendar',
        image: '/assets/tumesaya/tumesaya2.webp',
        alt: 'Aplicación oficial de Tu Mesa Ya con mesas, reservas y perfil del restaurante',
        caption: 'Mesas, reservas y disponibilidad conectadas.',
        kind: 'device',
      },
    ],
    benefits: [
      {
        icon: 'voice',
        title: 'Atiende por ti',
        text: 'Responde llamadas y recoge nuevas reservas las 24 horas.',
      },
      {
        icon: 'calendar',
        title: 'Una agenda conectada',
        text: 'Consulta disponibilidad y confirma cada mesa.',
      },
      {
        icon: 'check',
        title: 'Cada reserva, al día',
        text: 'Gestiona recordatorios, cambios y cancelaciones.',
      },
    ],
  },
  siweb: {
    headline: 'Cada conversación, con contexto.',
    description:
      'Centraliza llamadas, contactos y campañas para que tu equipo tenga la información que necesita en cada conversación.',
    views: [
      {
        label: 'Las llamadas',
        icon: 'phone',
        image: '/assets/siweb/siweb.2.webp',
        alt: 'Interfaz de Call Center Siweb con llamadas programadas y ficha de contacto',
        caption: 'La llamada y la información del cliente, juntas.',
        kind: 'device',
      },
      {
        label: 'La gestión',
        icon: 'connections',
        image: '/assets/siweb/siweb3.webp',
        alt: 'Selección de productos en la plataforma de gestión comercial Siweb',
        caption: 'Un entorno conectado para la actividad comercial.',
        kind: 'device',
      },
    ],
    benefits: [
      {
        icon: 'phone',
        title: 'Llamadas organizadas',
        text: 'Planifica la atención y el seguimiento de contactos.',
      },
      {
        icon: 'connections',
        title: 'Campañas conectadas',
        text: 'Reúne contactos y actividad en una sola plataforma.',
      },
      {
        icon: 'chart',
        title: 'Una visión del servicio',
        text: 'Consulta estadísticas para seguir la actividad.',
      },
    ],
  },
};
