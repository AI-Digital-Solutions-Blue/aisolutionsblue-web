export const company = {
  name: 'AI Digital Solutions Blue',
  legalName: 'AI Digital Solutions Blue, S.L.',
  email: 'marketing@aisolutionsblue.com',
  phone: '+34 618 67 91 80',
  phoneHref: '+34618679180',
  address: 'Calle Carvajal, 26, Bajo. 35004 Las Palmas de Gran Canaria (Las Palmas). España.',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Calle+Carvajal+26+35004+Las+Palmas+de+Gran+Canaria+Espa%C3%B1a',
};

export const services = [
  {
    number: '01',
    title: 'Atención y reservas con asistentes de voz',
    category: 'ATENCIÓN AL CLIENTE',
    icon: 'voice',
    text: 'Atiende consultas, orienta a tus clientes y gestiona reservas con un asistente de voz adaptado a tu negocio. También fuera de tu horario.',
    tags: ['Atención al cliente', 'Reservas', 'Disponibilidad 24/7'],
    image: '/assets/siweb/siweb.2.webp',
    alt: 'Gestión de llamadas programadas en Call Center Siweb',
    projectLabel: 'Ver Call Center Siweb',
    projectHref: '#siweb',
  },
  {
    number: '02',
    title: 'Documentos y procesos organizados',
    category: 'AUTOMATIZACIÓN DOCUMENTAL',
    icon: 'document',
    text: 'Simplifica la gestión de documentos y conecta tus procesos. Reducimos el trabajo manual para que puedas dedicar tu tiempo a lo que hace crecer tu negocio.',
    tags: ['Documentos', 'Procesos conectados', 'Ahorro de tiempo'],
    image: '/assets/sygna/sygna4.webp',
    alt: 'Perfil y gestión de solicitudes de un empleado en Sygna',
    projectLabel: 'Ver Sygna',
    projectHref: '#sygna',
  },
  {
    number: '03',
    title: 'Información útil para tu actividad comercial',
    category: 'IA COMERCIAL',
    icon: 'chart',
    text: 'Entiende mejor tu actividad, detecta oportunidades y mejora la atención a tus clientes. Soluciones de IA comercial adaptadas a tus objetivos y a tu forma de trabajar.',
    tags: ['Oportunidades', 'Visión de negocio', 'Atención personalizada'],
    image: '/assets/siweb/siweb3.webp',
    alt: 'Selección de productos en la plataforma comercial Siweb',
    projectLabel: 'Ver la plataforma Siweb',
    projectHref: '#siweb',
  },
];

export const projects = [
  {
    id: 'sygna',
    number: '01',
    name: 'Sygna',
    website: 'https://sygna.es/',
    category: 'GESTIÓN LABORAL',
    title: 'La gestión de tu equipo, en un solo lugar.',
    challenge: 'Contratos, turnos y comunicaciones repartidos entre varias herramientas.',
    text: 'Contratos, turnos y comunicación interna, reunidos en una plataforma de gestión laboral.',
    tags: ['Recursos humanos', 'Automatización', 'IA'],
    color: 'blue',
    images: [
      '/assets/sygna/sygna3.webp',
      '/assets/sygna/sygna2.webp',
      '/assets/sygna/sygna1.webp',
      '/assets/sygna/sygna4.webp',
    ],
    alts: [
      'Vista de jornada y actividad reciente de Sygna',
      'Panel de control horario de Sygna',
      'Acceso a Sygna en un ordenador portátil',
      'Perfil de empleado y solicitudes en Sygna',
    ],
  },
  {
    id: 'tumesaya',
    number: '02',
    name: 'Tu Mesa Ya!',
    website: 'https://tumesaya.centraldereservas.ai',
    category: 'RESTAURACIÓN',
    title: 'Reservas organizadas. Atención disponible.',
    challenge: 'Consultas y reservas que llegan mientras el equipo atiende el restaurante.',
    text: 'Conecta restaurantes y clientes para gestionar reservas, organizar la disponibilidad y automatizar la atención.',
    tags: ['Reservas', 'Atención 24/7', 'Hostelería'],
    color: 'yellow',
    images: [
      '/assets/tumesaya/tumesaya1.webp',
      '/assets/tumesaya/tumesaya2.webp',
      '/assets/tumesaya/tumesaya3.webp',
    ],
    alts: [
      'Restaurantes y opciones de reserva en la aplicación Tu Mesa Ya!',
      'Gestión de mesas, reservas y perfil de Tu Mesa Ya!',
      'Carta, acceso y reservas de Tu Mesa Ya!',
    ],
  },
  {
    id: 'siweb',
    number: '03',
    name: 'Call Center Siweb',
    website: 'https://siweb.es',
    category: 'ATENCIÓN AL CLIENTE',
    title: 'Cada llamada, en el lugar adecuado.',
    challenge: 'Un volumen de consultas que requiere recoger datos y dirigir cada llamada.',
    text: 'Automatiza la atención telefónica, recoge los datos del cliente y dirige cada consulta al equipo adecuado.',
    tags: ['Asistentes de voz', 'Call center', 'A medida'],
    color: 'lavender',
    images: [
      '/assets/siweb/siweb.2.webp',
      '/assets/siweb/siweb1.webp',
      '/assets/siweb/siweb3.webp',
    ],
    alts: [
      'Gestión de llamadas programadas en Call Center Siweb',
      'Pantalla de acceso de Call Center Siweb',
      'Selección de productos en la plataforma Siweb',
    ],
  },
];

export const faqs = [
  {
    question: '¿La inteligencia artificial encaja en un negocio pequeño?',
    answer:
      'El punto de partida es lo que necesita tu negocio. Podemos estudiar tareas concretas, como responder consultas, gestionar reservas o simplificar documentos, y valorar contigo dónde tiene sentido aplicar IA o automatización.',
  },
  {
    question: '¿Necesito conocimientos técnicos?',
    answer:
      'No necesitas conocer la tecnología para contarnos qué quieres mejorar. Nuestro equipo analiza tu caso contigo y te explica las opciones de forma clara.',
  },
  {
    question: '¿Podéis trabajar con las herramientas que ya utilizo?',
    answer:
      'Revisaremos tus herramientas y sus posibilidades de integración antes de proponer una solución. La compatibilidad depende de cada sistema y se confirma durante el análisis del proyecto.',
  },
  {
    question: '¿Cuánto cuesta una solución a medida?',
    answer:
      'Depende del alcance, las integraciones y las necesidades de tu negocio. En la primera conversación evaluamos tu caso para poder preparar una propuesta ajustada a tu proyecto.',
  },
];
