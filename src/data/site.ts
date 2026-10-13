export const company = {
  name: 'AI Digital Solutions Blue',
  legalName: 'AI Digital Solutions Blue, S.L.',
  email: 'info@aisolutionsblue.com',
  phone: '+34 689 23 27 92',
  phoneHref: '+34689232792',
  address: 'Calle Juan Rejón, 67, Planta 3. 35008 Las Palmas de Gran Canaria (Las Palmas). España.',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Calle+Juan+Rej%C3%B3n+67+35008+Las+Palmas+de+Gran+Canaria+Espa%C3%B1a',
};

// Stage: three chapters, each a problem the owner lives that turns into its solution, and the
// real product that does it. The field in the stage takes one form per chapter
// (src/scripts/shapes.ts, same order).
export const useCases = [
  {
    label: 'Atiende',
    pain: 'Llamadas perdidas.',
    title: 'Todas atendidas.',
    who: 'Call Center Siweb',
    relation: 'Lo hace',
    href: '/productos/siweb',
  },
  {
    label: 'Atrae',
    pain: 'Sin tiempo para anunciarte.',
    title: 'Anuncios listos en minutos.',
    who: 'Adscena',
    relation: 'Lo hace',
    href: '/productos/adscena',
  },
  {
    label: 'Organiza',
    pain: 'Papeles hasta la noche.',
    title: 'Gestión que se hace sola.',
    who: 'Sygna',
    relation: 'Lo hace',
    href: '/productos/sygna',
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

// How a project runs, from first conversation to launch. The order carries meaning.
export const process = [
  {
    title: 'Escuchamos',
    text: 'Conocemos tu negocio, cómo trabajas y qué te quita tiempo. Sin coste y sin compromiso.',
  },
  {
    title: 'Diseñamos',
    text: 'Te proponemos una solución concreta, con plazos y precio claros.',
  },
  {
    title: 'Construimos',
    text: 'La desarrollamos y te enseñamos avances por el camino, para ajustar antes de terminar.',
  },
  {
    title: 'Lanzamos',
    text: 'La ponemos en marcha con tu equipo y seguimos a tu lado para ajustarla.',
  },
];

// Hidden until there is real content. Add entries here and the sections appear on their own.
export const team: { name: string; role: string; photo: string }[] = [];
export const testimonial: { quote: string; name: string; role: string; company: string } | null =
  null;
