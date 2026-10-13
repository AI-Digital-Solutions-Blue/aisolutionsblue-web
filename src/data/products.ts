// Products and client cases shown on the home page and on /productos/[slug].
// Only confirmed facts: no figures, testimonials or results that the team has not provided.

export type ServiceLine = 'agentes' | 'automatizacion' | 'software';

export interface Product {
  slug: string;
  name: string;
  relation: 'Producto de Blue' | 'Caso de cliente';
  website: string;
  sector: string;
  headline: string;
  summary: string;
  challenge: string;
  lines: ServiceLine[];
  benefits: { title: string; text: string }[];
  images: { src: string; alt: string; width: number; height: number }[];
}

export const serviceLines: Record<
  ServiceLine,
  { id: ServiceLine; title: string; tech: string; text: string; examples: string[] }
> = {
  agentes: {
    id: 'agentes',
    title: 'Atender a cada cliente',
    tech: 'asistentes de IA',
    text: 'Un asistente que contesta llamadas y mensajes a cualquier hora, resuelve dudas y gestiona citas y reservas. Y te pasa a ti lo que necesita una persona.',
    examples: ['Llamadas', 'Mensajes', 'Citas y reservas'],
  },
  automatizacion: {
    id: 'automatizacion',
    title: 'Quitarte trabajo de encima',
    tech: 'automatización',
    text: 'Lo que haces a mano una y otra vez, que se haga solo: avisos, recordatorios, documentos y datos que pasan de una herramienta a otra.',
    examples: ['Recordatorios', 'Documentos', 'Avisos automáticos'],
  },
  software: {
    id: 'software',
    title: 'Herramientas hechas para ti',
    tech: 'software a medida',
    text: 'Cuando lo que existe no encaja con tu forma de trabajar, construimos la herramienta que necesitas: tu panel, tu aplicación, tu sistema.',
    examples: ['Paneles de gestión', 'Aplicaciones', 'Sistemas a medida'],
  },
};

export const products: Product[] = [
  {
    slug: 'siweb',
    name: 'Call Center Siweb',
    relation: 'Caso de cliente',
    website: 'https://siweb.es',
    sector: 'Atención al cliente',
    headline: 'Cada llamada, en el lugar adecuado.',
    summary:
      'Automatiza la atención telefónica, recoge los datos del cliente y dirige cada consulta al equipo adecuado. Llamadas, contactos y campañas en una sola plataforma.',
    challenge: 'Un volumen de consultas que requiere recoger datos y dirigir cada llamada.',
    lines: ['agentes', 'software'],
    benefits: [
      {
        title: 'Llamadas organizadas',
        text: 'Planifica la atención y el seguimiento de contactos.',
      },
      { title: 'Campañas conectadas', text: 'Reúne contactos y actividad en una sola plataforma.' },
      { title: 'Una visión del servicio', text: 'Consulta estadísticas para seguir la actividad.' },
    ],
    images: [
      {
        src: '/assets/siweb/siweb.2.webp',
        alt: 'Interfaz de Call Center Siweb con llamadas programadas y ficha de contacto',
        width: 1200,
        height: 900,
      },
      {
        src: '/assets/siweb/siweb3.webp',
        alt: 'Selección de productos en la plataforma de gestión comercial Siweb',
        width: 1200,
        height: 900,
      },
      {
        src: '/assets/siweb/siweb1.webp',
        alt: 'Pantalla de acceso de Call Center Siweb',
        width: 1200,
        height: 900,
      },
    ],
  },
  {
    slug: 'tumesaya',
    name: 'Tu Mesa Ya!',
    relation: 'Producto de Blue',
    website: 'https://tumesaya.centraldereservas.ai',
    sector: 'Restauración',
    headline: 'Tú atiendes la mesa. La IA, la llamada.',
    summary:
      'Un asistente de voz que atiende por teléfono, consulta la disponibilidad y gestiona reservas. También cuando tu equipo está ocupado.',
    challenge: 'Consultas y reservas que llegan mientras el equipo atiende el restaurante.',
    lines: ['agentes', 'software'],
    benefits: [
      { title: 'Atiende por ti', text: 'Responde llamadas y recoge nuevas reservas las 24 horas.' },
      { title: 'Una agenda conectada', text: 'Consulta disponibilidad y confirma cada mesa.' },
      { title: 'Cada reserva, al día', text: 'Gestiona recordatorios, cambios y cancelaciones.' },
    ],
    images: [
      {
        src: '/assets/tumesaya/tumesaya2.webp',
        alt: 'Aplicación de Tu Mesa Ya! con mesas, reservas y perfil del restaurante',
        width: 1200,
        height: 800,
      },
      {
        src: '/assets/tumesaya/tumesaya1.webp',
        alt: 'Restaurantes y opciones de reserva en la aplicación Tu Mesa Ya!',
        width: 1200,
        height: 800,
      },
      {
        src: '/assets/tumesaya/tumesaya3.webp',
        alt: 'Carta, acceso y reservas de Tu Mesa Ya!',
        width: 1200,
        height: 800,
      },
    ],
  },
  {
    slug: 'sygna',
    name: 'Sygna',
    relation: 'Producto de Blue',
    website: 'https://sygna.es/',
    sector: 'Gestión laboral',
    headline: 'La gestión de tu equipo, en un solo lugar.',
    summary:
      'Contratos, turnos, control horario y comunicación interna reunidos en una plataforma, con un asistente de IA para consultar los datos de tu empresa.',
    challenge: 'Contratos, turnos y comunicaciones repartidos entre varias herramientas.',
    lines: ['automatizacion', 'software'],
    benefits: [
      { title: 'Tu equipo, al día', text: 'Control horario, ausencias y gestión de personas.' },
      {
        title: 'Documentos organizados',
        text: 'Contratos y documentos laborales en un mismo lugar.',
      },
      { title: 'Respuestas con IA', text: 'Consulta los datos de tu empresa con Sara AI.' },
    ],
    images: [
      {
        src: '/assets/sygna/sygna3.webp',
        alt: 'Pantalla de jornada y actividad del equipo en Sygna',
        width: 1200,
        height: 900,
      },
      {
        src: '/assets/sygna/sygna2.webp',
        alt: 'Panel de control horario de Sygna',
        width: 1200,
        height: 900,
      },
      {
        src: '/assets/sygna/sygna4.webp',
        alt: 'Perfil de empleado y solicitudes en Sygna',
        width: 1200,
        height: 900,
      },
    ],
  },
  {
    slug: 'adscena',
    name: 'Adscena',
    relation: 'Producto de Blue',
    website: 'https://adscena.es/',
    sector: 'Marketing para negocios locales',
    headline: 'Pega tu web. Tu campaña, publicada.',
    summary:
      'Convierte la web de un restaurante, gimnasio o comercio en una campaña de Meta Ads completa y publicada en Facebook e Instagram, sin saber de diseño ni del gestor de anuncios.',
    challenge:
      'Negocios sin equipo de marketing que quieren anunciarse sin depender de una agencia.',
    lines: ['automatizacion', 'software'],
    benefits: [
      { title: 'Lee tu negocio', text: 'Extrae nombre, fotos y tono a partir de tu web.' },
      { title: 'Crea los anuncios', text: 'Genera imagen y texto adaptados a tu objetivo.' },
      { title: 'Publica la campaña', text: 'La deja activa en Meta sin configurar nada a mano.' },
    ],
    images: [
      {
        src: '/assets/adscena/hero-loop-poster.jpg',
        alt: 'Adscena en el móvil: pega la web de tu negocio y empieza tu campaña',
        width: 1040,
        height: 1360,
      },
      {
        src: '/assets/adscena/adscena.jpg',
        alt: 'Portada de Adscena con la propuesta para negocios sin equipo de marketing',
        width: 1200,
        height: 900,
      },
    ],
  },
];

export const productBySlug = (slug: string) => products.find((product) => product.slug === slug);
export const productsForLine = (line: ServiceLine) =>
  products.filter((product) => product.lines.includes(line));
