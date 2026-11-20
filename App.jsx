import React, { useState, useEffect, useMemo, useRef, Component } from 'react';
import {
  BookOpen,
  Layers,
  PenTool,
  Bookmark,
  Plus,
  Trash2,
  Volume2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Download,
  Upload,
  Folder,
  Play,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  User,
  Globe,
  Compass,
  CheckCircle2,
  Info,
  Eye
} from 'lucide-react';

// ============================================================================
// 0. FILTRO ESTRICTO DE MALAS PALABRAS (EXCLUSIVO PARA EL NOMBRE DE USUARIO)
// ============================================================================

const FORBIDDEN_USERNAME_TERMS = [
  'mierda', 'puta', 'puto', 'pendejo', 'pendeja', 'culero', 'culera', 'verga',
  'cabron', 'cabrona', 'chingar', 'chinga', 'joder', 'coño', 'marica', 'maricon',
  'estupido', 'estupida', 'idiota', 'imbecil', 'carajo', 'hijueputa', 'hijodeputa',
  'hdp', 'malparido', 'malparida', 'mamaguevo', 'cerote', 'maje', 'pija', 'culo',
  'tetas', 'pene', 'vagina', 'zorra', 'perra', 'prostituta', 'fuck', 'shit',
  'bitch', 'asshole', 'dick', 'cunt', 'whore', 'bastard', 'slut', 'kuso', 'baka',
  'aho', 'chinko', 'manko', 'oppai', 'yariman'
];

function normalizeForProfanityCheck(rawStr) {
  if (!rawStr) return '';
  return rawStr
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/[^a-zñ]/g, '')
    .replace(/(.)\1+/g, '$1');
}

function validateUsernameProfanity(nameInput) {
  const trimmed = (nameInput || '').trim();
  if (!trimmed) {
    return { valid: false, reason: 'empty', message: 'Escribe tu nombre o apodo para continuar.' };
  }
  if (trimmed.length < 2) {
    return { valid: false, reason: 'short', message: 'El nombre debe tener al menos 2 letras.' };
  }
  if (trimmed.length > 24) {
    return { valid: false, reason: 'long', message: 'El nombre debe tener máximo 24 caracteres.' };
  }
  const normalized = normalizeForProfanityCheck(trimmed);
  const rawLower = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const hasBadWord = FORBIDDEN_USERNAME_TERMS.some((term) => {
    const cleanTerm = term.replace(/(.)\1+/g, '$1');
    return rawLower.includes(term) || (cleanTerm.length >= 3 && normalized.includes(cleanTerm));
  });

  if (hasBadWord) {
    return {
      valid: false,
      reason: 'profanity',
      message: 'Ese nombre contiene palabras no permitidas. Elige un nombre apropiado.'
    };
  }
  return { valid: true, reason: null, message: '' };
}

// ============================================================================
// 0.1 ROTACIÓN DE MENSAJES MOTIVACIONALES PARA USUARIOS RECURRENTES
// ============================================================================

const RETURNING_MOTIVATIONAL_MESSAGES = [
  {
    headline: (name) => `¡BIENVENIDO DE VUELTA, ${name.toUpperCase()}!`,
    subtext: '¡Listo para seguir estudiando y dominando nuevas estructuras hoy!'
  },
  {
    headline: (name) => `¡LISTO PARA SEGUIR ESTUDIANDO, ${name.toUpperCase()}!`,
    subtext: 'Cada oración que construís te acerca más a tu meta de N5 a N1.'
  },
  {
    headline: (name) => `¡QUÉ BUENO VERTE OTRA VEZ, ${name.toUpperCase()}!`,
    subtext: 'Tu inventario y tus carpetas te esperan para una nueva sesión.'
  },
  {
    headline: (name) => `¡LA CONSTANCIA ES EL CAMINO (道), ${name.toUpperCase()}!`,
    subtext: 'Unos minutos de práctica hoy hacen toda la diferencia mañana.'
  },
  {
    headline: (name) => `¡A CREAR NUEVAS ORACIONES, ${name.toUpperCase()}!`,
    subtext: 'Poné a prueba tu vocabulario y perfeccioná cada partícula.'
  },
  {
    headline: (name) => `¡SIGAMOS AVANZANDO DE NIVEL, ${name.toUpperCase()}!`,
    subtext: 'Tu disciplina diaria es la llave para dominar el japonés.'
  },
  {
    headline: (name) => `¡TU PRÁCTICA DE HOY CUENTA, ${name.toUpperCase()}!`,
    subtext: 'Repasá tus palabras guardadas o desafiá la sala de práctica libre.'
  },
  {
    headline: (name) => `¡EXCELENTE DÍA PARA APRENDER, ${name.toUpperCase()}!`,
    subtext: 'Vamos paso a paso puliendo tu gramática japonesa sin límites.'
  }
];

// ============================================================================
// 1. CATÁLOGOS DE REFERENCIA RÁPIDA (PARTÍCULAS, こそあど, TIEMPO Y GRAMÁTICA)
// ============================================================================

const PARTICLE_CATALOG = [
  { word: 'は', reading: 'わ (wa)', meaning: 'Tema de la oración', folder: '助詞 · Partículas', role: 'particle', notes: 'Marca el tema principal sobre el que se afirma algo.' },
  { word: 'が', reading: 'が (ga)', meaning: 'Sujeto gramatical / Identificación', folder: '助詞 · Partículas', role: 'particle', notes: 'Identifica al sujeto específico, gustos (好き), habilidad o existencia (ある/いる).' },
  { word: 'を', reading: 'お (o)', meaning: 'Objeto directo', folder: '助詞 · Partículas', role: 'particle', notes: 'Marca el sustantivo que recibe directamente la acción de un verbo transitivo.' },
  { word: 'に', reading: 'に (ni)', meaning: 'Destino / Punto temporal / Receptor', folder: '助詞 · Partículas', role: 'particle', notes: 'Indica punto exacto en el tiempo, destino puntual, receptor o ubicación de existencia.' },
  { word: 'で', reading: 'で (de)', meaning: 'Lugar de acción / Medio o herramienta', folder: '助詞 · Partículas', role: 'particle', notes: 'Indica dónde se ejecuta una acción activa o con qué instrumento/transporte.' },
  { word: 'へ', reading: 'え (e)', meaning: 'Dirección hacia un destino', folder: '助詞 · Partículas', role: 'particle', notes: 'Enfatiza la dirección del movimiento hacia un lugar.' },
  { word: 'の', reading: 'の (no)', meaning: 'Posesión / Modificador nominal', folder: '助詞 · Partículas', role: 'particle', notes: 'Conecta dos sustantivos indicando posesión o pertenencia (ej: 私 + の + 車 = mi auto).' },
  { word: 'と', reading: 'と (to)', meaning: 'Compañía (con) / Lista exhaustiva (y) / Condicional natural', folder: '助詞 · Partículas', role: 'particle', notes: 'Une sustantivos en lista cerrada, indica compañía o consecuencia automática tras verbo.' },
  { word: 'も', reading: 'も (mo)', meaning: 'Inclusión (también / tampoco)', folder: '助詞 · Partículas', role: 'particle', notes: 'Sustituye a は, が u を para agregar un elemento equivalente.' },
  { word: 'から', reading: 'から (kara)', meaning: 'Origen (desde) / Causa (porque)', folder: '助詞 · Partículas', role: 'particle', notes: 'Marca punto de inicio temporal/espacial o la razón de una acción.' },
  { word: 'まで', reading: 'まで (made)', meaning: 'Límite (hasta)', folder: '助詞 · Partículas', role: 'particle', notes: 'Marca el límite final en tiempo o espacio.' },
  { word: 'より', reading: 'より (yori)', meaning: 'Punto de comparación (más que...)', folder: '助詞 · Partículas', role: 'particle', notes: 'Establece el estándar contra el cual se compara.' },
  { word: 'か', reading: 'か (ka)', meaning: 'Interrogación / Disyunción (o)', folder: '助詞 · Partículas', role: 'particle', notes: 'Al final de la oración marca pregunta; entre sustantivos significa "o".' },
  { word: 'ね', reading: 'ね (ne)', meaning: 'Confirmación compartida (¿verdad?)', folder: '助詞 · Partículas', role: 'particle', notes: 'Partícula final para pedir acuerdo o confirmar información con el oyente.' },
  { word: 'よ', reading: 'よ (yo)', meaning: 'Énfasis / Dato nuevo al oyente', folder: '助詞 · Partículas', role: 'particle', notes: 'Partícula final para transmitir convicción o advertir algo que el oyente desconoce.' }
];

const KOSOADO_CATALOG = [
  { word: 'これ', reading: 'kore', meaning: 'Esto (pronombre cerca de mí)', folder: '指示語 · Demostrativos こそあど', role: 'pronoun', notes: 'Pronombre independiente; va seguido de partícula (ej: これは...).' },
  { word: 'それ', reading: 'sore', meaning: 'Eso (pronombre cerca de vos)', folder: '指示語 · Demostrativos こそあど', role: 'pronoun', notes: 'Pronombre independiente (ej: それは...).' },
  { word: 'あれ', reading: 'are', meaning: 'Aquello (lejos de ambos)', folder: '指示語 · Demostrativos こそあど', role: 'pronoun', notes: 'Pronombre independiente (ej: あれは...).' },
  { word: 'どれ', reading: 'dore', meaning: '¿Cuál? (entre 3 o más)', folder: '指示語 · Demostrativos こそあど', role: 'pronoun', notes: 'Pronombre interrogativo; exige la partícula が (どれが...).' },
  { word: 'この', reading: 'kono', meaning: 'Este / Esta (+ Sustantivo)', folder: '連体詞 · Prenominales', role: 'prenominal', notes: 'Exige obligatoriamente un sustantivo justo después (ej: この車).' },
  { word: 'その', reading: 'sono', meaning: 'Ese / Esa (+ Sustantivo)', folder: '連体詞 · Prenominales', role: 'prenominal', notes: 'Exige obligatoriamente un sustantivo justo después (ej: その本).' },
  { word: 'あの', reading: 'ano', meaning: 'Aquel / Aquella (+ Sustantivo)', folder: '連体詞 · Prenominales', role: 'prenominal', notes: 'Exige obligatoriamente un sustantivo justo después (ej: あの人).' },
  { word: 'どの', reading: 'dono', meaning: '¿Qué / Cuál (+ Sustantivo)?', folder: '連体詞 · Prenominales', role: 'prenominal', notes: 'Exige obligatoriamente un sustantivo justo después (ej: どの車).' },
  { word: 'ここ', reading: 'koko', meaning: 'Aquí (este lugar)', folder: '指示語 · Demostrativos こそあど', role: 'noun', notes: 'Sustantivo demostrativo de lugar cercano al hablante.' },
  { word: 'そこ', reading: 'soko', meaning: 'Ahí (ese lugar)', folder: '指示語 · Demostrativos こそあど', role: 'noun', notes: 'Sustantivo demostrativo de lugar cercano al oyente.' },
  { word: 'あそこ', reading: 'asoko', meaning: 'Allí (aquel lugar)', folder: '指示語 · Demostrativos こそあど', role: 'noun', notes: 'Sustantivo demostrativo de lugar lejano.' },
  { word: 'どこ', reading: 'doko', meaning: '¿Dónde? (¿qué lugar?)', folder: '指示語 · Demostrativos こそあど', role: 'noun', notes: 'Interrogativo de ubicación.' },
  { word: 'こちら', reading: 'kochira', meaning: 'Por aquí / Esta persona (cortés)', folder: '指示語 · Demostrativos こそあど', role: 'pronoun', notes: 'Equivalente formal de ここ / これ.' },
  { word: 'そちら', reading: 'sochira', meaning: 'Por ahí / Esa opción (cortés)', folder: '指示語 · Demostrativos こそあど', role: 'pronoun', notes: 'Equivalente formal de そこ / それ.' },
  { word: 'あちら', reading: 'achira', meaning: 'Por allí / Aquella persona (cortés)', folder: '指示語 · Demostrativos こそあど', role: 'pronoun', notes: 'Equivalente formal de あそこ / あれ.' },
  { word: 'どちら', reading: 'dochira', meaning: '¿Por dónde? / ¿Cuál de los dos?', folder: '指示語 · Demostrativos こそあど', role: 'pronoun', notes: 'Interrogativo cortés o de elección entre 2 opciones.' },
  { word: 'こんな', reading: 'konna', meaning: 'Este tipo de (+ Sustantivo)', folder: '連体詞 · Prenominales', role: 'prenominal', notes: 'Prenominal de categoría; va antes de un sustantivo.' },
  { word: 'そんな', reading: 'sonna', meaning: 'Ese tipo de (+ Sustantivo)', folder: '連体詞 · Prenominales', role: 'prenominal', notes: 'Prenominal de categoría; va antes de un sustantivo.' },
  { word: 'あんな', reading: 'anna', meaning: 'Aquel tipo de (+ Sustantivo)', folder: '連体詞 · Prenominales', role: 'prenominal', notes: 'Prenominal de categoría; va antes de un sustantivo.' },
  { word: 'どんな', reading: 'donna', meaning: '¿Qué tipo de (+ Sustantivo)?', folder: '連体詞 · Prenominales', role: 'prenominal', notes: 'Pregunta por las cualidades de un sustantivo.' },
  { word: 'こう', reading: 'kou', meaning: 'Así (de este modo)', folder: '副詞 · Adverbios', role: 'adverb', notes: 'Adverbio demostrativo que modifica directamente al verbo.' },
  { word: 'そう', reading: 'sou', meaning: 'Así (de ese modo)', folder: '副詞 · Adverbios', role: 'adverb', notes: 'Adverbio demostrativo de manera.' },
  { word: 'ああ', reading: 'aa', meaning: 'De aquella manera', folder: '副詞 · Adverbios', role: 'adverb', notes: 'Adverbio demostrativo lejano.' },
  { word: 'どう', reading: 'dou', meaning: '¿Cómo? / ¿De qué manera?', folder: '副詞 · Adverbios', role: 'adverb', notes: 'Interrogativo de manera o estado.' }
];

const TIME_CATALOG = [
  { word: '今', reading: 'いま (ima)', meaning: 'Ahora', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Momento presente.' },
  { word: '今日', reading: 'きょう (kyou)', meaning: 'Hoy', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Día actual.' },
  { word: '明日', reading: 'あした (ashita)', meaning: 'Mañana', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Día siguiente (rige conjugación no-pasada).' },
  { word: '昨日', reading: 'きのう (kinou)', meaning: 'Ayer', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Día anterior (rige conjugación en pasado).' },
  { word: '毎日', reading: 'まいにち (mainichi)', meaning: 'Todos los días', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Frecuencia diaria.' },
  { word: '毎朝', reading: 'まいあさ (maiasa)', meaning: 'Todas las mañanas', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Frecuencia matutina.' },
  { word: '毎晩', reading: 'まいばん (maiban)', meaning: 'Todas las noches', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Frecuencia nocturna.' },
  { word: '今週', reading: 'こんしゅう (konshuu)', meaning: 'Esta semana', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Semana actual.' },
  { word: '来週', reading: 'らいしゅう (raishuu)', meaning: 'La próxima semana', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Semana siguiente.' },
  { word: '先週', reading: 'せんしゅう (senshuu)', meaning: 'La semana pasada', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Semana previa (rige pasado).' },
  { word: 'いつも', reading: 'itsumo', meaning: 'Siempre', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Adverbio de frecuencia constante.' },
  { word: 'よく', reading: 'yoku', meaning: 'A menudo / Bien', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Alta frecuencia o grado positivo.' },
  { word: '時々', reading: 'ときどき (tokidoki)', meaning: 'A veces', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Frecuencia intermitente.' },
  { word: 'もう', reading: 'mou', meaning: 'Ya', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Acción ya realizada.' },
  { word: 'まだ', reading: 'mada', meaning: 'Todavía / Aún', folder: '時間・頻度 · Marcadores de Tiempo', role: 'time', notes: 'Estado que continúa o acción pendiente.' }
];

const GRAMMAR_QUICK_CATALOG = [
  { word: '～ている', reading: 'te iru', meaning: 'Continuo / Estado resultante (Estar haciendo)', folder: '活用・文法 · Usos Gramaticales y Conjugaciones', role: 'grammar', grammarId: 'te_iru', notes: 'Une la forma て con いる/います.' },
  { word: '～よう / ～ましょう', reading: 'volitivo', meaning: 'Volitivo (Vamos a... / Propuesta)', folder: '活用・文法 · Usos Gramaticales y Conjugaciones', role: 'grammar', grammarId: 'volitional', notes: 'Expresa voluntad o invitación directa.' },
  { word: '～ようとする', reading: 'you to suru', meaning: 'Intencional / Conato (Intentar o estar a punto de)', folder: '活用・文法 · Usos Gramaticales y Conjugaciones', role: 'grammar', grammarId: 'intentional', notes: 'Forma volitiva + とする.' },
  { word: '～たい', reading: 'tai', meaning: 'Desiderativo (Querer hacer)', folder: '活用・文法 · Usos Gramaticales y Conjugaciones', role: 'grammar', grammarId: 'tai', notes: 'Raíz ます + たい (se conjuga como adjetivo -い).' },
  { word: '～させる', reading: 'causativo', meaning: 'Causativo (Hacer o dejar que alguien haga)', folder: '活用・文法 · Usos Gramaticales y Conjugaciones', role: 'grammar', grammarId: 'causative', notes: 'Raíz -a (G1) + せる / Raíz (G2) + させる.' },
  { word: '～られる', reading: 'pasivo', meaning: 'Pasivo (Ser hecho por...)', folder: '活用・文法 · Usos Gramaticales y Conjugaciones', role: 'grammar', grammarId: 'passive', notes: 'Raíz -a (G1) + れる / Raíz (G2) + られる.' },
  { word: '～させられる', reading: 'causativo-pasivo', meaning: 'Causativo-Pasivo (Ser obligado a hacer)', folder: '活用・文法 · Usos Gramaticales y Conjugaciones', role: 'grammar', grammarId: 'causative_passive', notes: 'Expresa obligación impuesta externa.' },
  { word: '可能形 (Potencial)', reading: 'potencial', meaning: 'Potencial (Poder hacer)', folder: '活用・文法 · Usos Gramaticales y Conjugaciones', role: 'grammar', grammarId: 'potential', notes: 'Vocal -u cambia a -eru (G1) o +られる (G2).' },
  { word: '～と (Condicional)', reading: 'to', meaning: 'Condicional Natural (Siempre que X, ocurre Y)', folder: '活用・文法 · Usos Gramaticales y Conjugaciones', role: 'grammar', grammarId: 'cond_to', notes: 'Forma diccionario + と.' },
  { word: '～たら', reading: 'tara', meaning: 'Condicional Situacional (Si / Cuando...)', folder: '活用・文法 · Usos Gramaticales y Conjugaciones', role: 'grammar', grammarId: 'cond_tara', notes: 'Forma pasada ～た + ら.' },
  { word: '～ば', reading: 'ba', meaning: 'Condicional Hipotético (Si se cumple la condición)', folder: '活用・文法 · Usos Gramaticales y Conjugaciones', role: 'grammar', grammarId: 'cond_ba', notes: 'Vocal -u cambia a -eba.' },
  { word: '命令形 (Imperativo)', reading: 'imperativo', meaning: 'Imperativo (Orden directa)', folder: '活用・文法 · Usos Gramaticales y Conjugaciones', role: 'grammar', grammarId: 'imperative', notes: 'Vocal -u a -e (G1) / +ろ (G2).' }
];

// ============================================================================
// 2. LAS 9 CATEGORÍAS GRAMATICALES ORDENADAS (N5 A N1)
// ============================================================================

const GRAMMAR_CATEGORIES = [
  {
    id: 'cat_voice_action',
    number: 1,
    title: 'Conjugaciones Verbales y Modificación',
    subtitle: 'Forma Base, Continuo (～ている), Desiderativo (～たい), Potencial, Imperativo',
    items: [
      { id: 'base', level: 'N5', name: 'Forma Base / Estándar', formula: 'Verbo / Adjetivo / Sustantivo directo', desc: 'Construcción estándar sin sufijos auxiliares adicionales' },
      { id: 'te_iru', level: 'N5', name: 'Continuo (～ている)', formula: 'Forma て + いる / います', desc: 'Acción en curso o estado resultante' },
      { id: 'tai', level: 'N5', name: 'Desiderativo (～たい)', formula: 'Raíz ます + たい (です)', desc: 'Deseo propio de ejecutar la acción ("quiero...")' },
      { id: 'potential', level: 'N4', name: 'Potencial (Poder hacer)', formula: 'Sonido -u → -e + る / られる', desc: 'Capacidad o posibilidad' },
      { id: 'imperative', level: 'N4', name: 'Imperativo (命令形 / ～なさい)', formula: 'Sonido -u → -e / ろ / なさい', desc: 'Orden directa' }
    ]
  },
  {
    id: 'cat_causative_passive',
    number: 2,
    title: 'Causativo, Pasivo y Causativo-Pasivo',
    subtitle: '～させる (hacer/dejar hacer), ～られる (voz pasiva), ～させられる (ser obligado)',
    items: [
      { id: 'causative', level: 'N4', name: 'Causativo (～させる)', formula: 'Raíz -a + せる / させる', desc: 'Hacer que alguien ejecute la acción o permitírselo' },
      { id: 'passive', level: 'N4', name: 'Pasivo (～られる)', formula: 'Raíz -a + れる / られる', desc: 'Voz pasiva ("ser hecho por...")' },
      { id: 'causative_passive', level: 'N4', name: 'Causativo-Pasivo (～させられる)', formula: 'Raíz -a + せられる / させられる', desc: 'Ser obligado a hacer algo sin desearlo' }
    ]
  },
  {
    id: 'cat_volitional_intent',
    number: 3,
    title: 'Volitivo e Intencional (～よう / ～ようとする)',
    subtitle: 'Propuesta directa (～よう / ～ましょう) e intento inminente (～ようとする)',
    items: [
      { id: 'volitional', level: 'N4', name: 'Volitivo (～よう / ～ましょう)', formula: 'Raíz -o + う / よう / ましょう', desc: 'Propuesta o determinación ("hagamos..." / "voy a...")' },
      { id: 'intentional', level: 'N4', name: 'Intencional (～ようとする)', formula: 'Forma Volitiva + とする', desc: 'Intentar realizar la acción o estar a punto de hacerla' }
    ]
  },
  {
    id: 'cat_conditionals',
    number: 4,
    title: 'Condicionales (と・ば・たら・なら)',
    subtitle: 'Consecuencia natural, condición lógica, situacional y contextual',
    items: [
      { id: 'cond_to', level: 'N4', name: 'Condicional Natural (～と)', formula: 'Forma Diccionario + と', desc: 'Consecuencia constante o inmediata ("cuando/siempre que...")' },
      { id: 'cond_ba', level: 'N4', name: 'Condicional Hipotético (～ば)', formula: 'Sonido -u → -eba / ～ければ', desc: 'Condición lógica necesaria ("si se cumple X...")' },
      { id: 'cond_tara', level: 'N4', name: 'Condicional Situacional (～たら)', formula: 'Forma Pasada Corta (～た) + ら', desc: 'Condicional de caso particular ("si / cuando ocurra X")' },
      { id: 'cond_nara', level: 'N4', name: 'Condicional Contextual (～なら)', formula: 'Forma Plana / Sustantivo + なら', desc: 'Dado el contexto mencionado ("en caso de que sea X")' }
    ]
  },
  {
    id: 'cat_te_helpers',
    number: 5,
    title: 'Auxiliares con Forma ～て y Favores',
    subtitle: '～てみる (probar), ～ておく (preparar), ～てしまう (completar)',
    items: [
      { id: 'te_miru', level: 'N4', name: 'Probar a hacer (～てみる)', formula: 'Forma て + みる / みます', desc: 'Realizar una acción para comprobar qué tal resulta' },
      { id: 'te_oku', level: 'N4', name: 'Preparación Previa (～ておく)', formula: 'Forma て + おく / おきます', desc: 'Dejar una acción lista por adelantado' },
      { id: 'te_shimau', level: 'N4', name: 'Completitud Total (～てしまう)', formula: 'Forma て + しまう / しまいます', desc: 'Concluir totalmente una acción o hacerla involuntariamente' }
    ]
  },
  {
    id: 'cat_obligation',
    number: 6,
    title: 'Obligación, Permiso y Consejo',
    subtitle: '～なければならない, ～てもいい, ～てはいけない, ～たほうがいい, ～べきだ',
    items: [
      { id: 'must_nakereba', level: 'N5', name: 'Obligación (～なければならない)', formula: 'Raíz ない + ければならない', desc: 'Deber ineludible ("tener que hacer")' },
      { id: 'perm_temoii', level: 'N5', name: 'Permiso (～てもいい)', formula: 'Forma て + もいいです', desc: 'Autorización ("está permitido hacer")' },
      { id: 'prohib_tewaikenai', level: 'N5', name: 'Prohibición (～てはいけない)', formula: 'Forma て + はいけません', desc: 'Restricción ("no se debe hacer")' },
      { id: 'advice_tahou', level: 'N4', name: 'Consejo (～たほうがいい)', formula: 'Forma た + ほうがいいです', desc: 'Recomendación ("es mejor hacer")' },
      { id: 'should_beki', level: 'N3', name: 'Deber Normativo (～べきだ)', formula: 'Forma Diccionario + べきだ', desc: 'Lo que corresponde moral o lógicamente (N3)' }
    ]
  },
  {
    id: 'cat_cause_contrast',
    number: 7,
    title: 'Partículas de Causa, Razón y Relación (の・ので・のに)',
    subtitle: 'Posesión con の, causa suave ～ので, contraste ～のに, ～おかげで',
    items: [
      { id: 'cause_node', level: 'N4', name: 'Causa Objetiva (～ので)', formula: 'Forma Plana / な + ので', desc: 'Expone el motivo de forma suave' },
      { id: 'contrast_noni', level: 'N4', name: 'Contraste (～のに)', formula: 'Forma Plana / な + のに', desc: 'A pesar de la premisa, ocurre lo contrario' },
      { id: 'cause_okagede', level: 'N3', name: 'Gracias a (～おかげで)', formula: 'Forma Plana / の + おかげで', desc: 'Causa que produce un desenlace favorable' }
    ]
  },
  {
    id: 'cat_conjecture',
    number: 8,
    title: 'Adjetivos い/な, Demostrativos こそあど y Conjetura',
    subtitle: '～かもしれない, ～そうだ, ～ようだ, ～に違いない',
    items: [
      { id: 'conj_kamoshirenai', level: 'N4', name: 'Posibilidad (～かもしれない)', formula: 'Forma Plana + かもしれない', desc: 'Es posible que / Tal vez' },
      { id: 'conj_souda', level: 'N4', name: 'Inminencia / Apariencia (～そうだ)', formula: 'Raíz ます / Raíz Adj + そうだ', desc: 'Parece estar a punto de ocurrir' },
      { id: 'conj_nichigainai', level: 'N3', name: 'Certeza Fuerte (～に違いない)', formula: 'Forma Plana + に違いない', desc: 'No cabe duda de que es así (N3)' }
    ]
  },
  {
    id: 'cat_advanced_keigo',
    number: 9,
    title: 'Estructuras Avanzadas (N3–N1) y Keigo',
    subtitle: '～わけだ (N3), ～ざるを得ない (N2), ～にほかならない (N1), Sonkeigo',
    items: [
      { id: 'adv_wakeda', level: 'N3', name: 'Conclusión Lógica (～わけだ)', formula: 'Forma Plana + わけだ', desc: 'Es comprensible/lógico que ocurra así' },
      { id: 'adv_zaruwoenai', level: 'N2', name: 'Inevitabilidad (～ざるを得ない)', formula: 'Raíz ない + ざるを得ない', desc: 'No queda más alternativa que hacerlo (N2)' },
      { id: 'adv_nihokanaranai', level: 'N1', name: 'Afirmación Absoluta (～にほかならない)', formula: 'Cláusula / Sustantivo + にほかならない', desc: 'No es otra cosa sino X (N1)' },
      { id: 'keigo_sonkeigo', level: 'N4', name: 'Honorífico (尊敬語 · お～になる)', formula: 'お + Raíz ます + になる', desc: 'Eleva respetuosamente la acción del sujeto' }
    ]
  }
];

const ALL_GRAMMAR_MAP = GRAMMAR_CATEGORIES.reduce((acc, cat) => {
  cat.items.forEach((item) => {
    acc[item.id] = item;
  });
  return acc;
}, {});

// ============================================================================
// 3. LÉXICO BASE EXTENDIDO (PARA CLASIFICACIÓN AUTOMÁTICA E INVENTARIO)
// ============================================================================

const BUILTIN_LEXICON = {
  '私': { reading: 'わたし (watashi)', meaning: 'Yo', folder: '代名詞 · Pronombres', role: 'pronoun', notes: 'Pronombre personal de primera persona.' },
  '僕': { reading: 'ぼく (boku)', meaning: 'Yo (masculino)', folder: '代名詞 · Pronombres', role: 'pronoun', notes: 'Pronombre personal masculino.' },
  'あなた': { reading: 'anata', meaning: 'Usted / Vos / Tú', folder: '代名詞 · Pronombres', role: 'pronoun', notes: 'Pronombre de segunda persona.' },
  '彼': { reading: 'かれ (kare)', meaning: 'Él', folder: '代名詞 · Pronombres', role: 'pronoun', notes: 'Pronombre de tercera persona masculino.' },
  '彼女': { reading: 'かのじょ (kanojo)', meaning: 'Ella', folder: '代名詞 · Pronombres', role: 'pronoun', notes: 'Pronombre de tercera persona femenino.' },
  '私たち': { reading: 'わたしたち (watashitachi)', meaning: 'Nosotros', folder: '代名詞 · Pronombres', role: 'pronoun', notes: 'Pronombre de primera persona plural.' },
  '車': { reading: 'くるま (kuruma)', meaning: 'Auto', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo concreto (vehículo).' },
  '本': { reading: 'ほん (hon)', meaning: 'Libro', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo concreto.' },
  '水': { reading: 'みず (mizu)', meaning: 'Agua', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo concreto.' },
  'コーヒー': { reading: 'koohii', meaning: 'Café', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo en katakana.' },
  'ご飯': { reading: 'ごはん (gohan)', meaning: 'Comida / Arroz cocido', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo concreto.' },
  '日本語': { reading: 'にほんご (nihongo)', meaning: 'Idioma japonés', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo.' },
  '学校': { reading: 'がっこう (gakkou)', meaning: 'Escuela', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo de lugar.' },
  '家': { reading: 'いえ (ie)', meaning: 'Casa', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo de lugar.' },
  '図書館': { reading: 'としょかん (toshokan)', meaning: 'Biblioteca', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo de lugar.' },
  '先生': { reading: 'せんせい (sensei)', meaning: 'Profesor', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo de persona.' },
  '友達': { reading: 'ともだち (tomodachi)', meaning: 'Amigo', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo de persona.' },
  '学生': { reading: 'がくせい (gakusei)', meaning: 'Estudiante', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo de persona.' },
  '映画': { reading: 'えいが (eiga)', meaning: 'Película', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo concreto.' },
  '音楽': { reading: 'おんがく (ongaku)', meaning: 'Música', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo.' },
  '手紙': { reading: 'てがみ (tegami)', meaning: 'Carta', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo concreto.' },
  '電車': { reading: 'でんしゃ (densha)', meaning: 'Tren', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo de transporte.' },
  '部屋': { reading: 'へや (heya)', meaning: 'Habitación', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo de lugar.' },
  '仕事': { reading: 'しごと (shigoto)', meaning: 'Trabajo', folder: '名詞 · Sustantivos', role: 'noun', notes: 'Sustantivo.' },
  '食べる': { reading: 'たべる (taberu)', meaning: 'Comer', folder: '一段動詞 · Verbos Ichidan (G2)', role: 'verb_g2', notes: 'Verbo transitivo Grupo 2 (raíz: 食べ-).' },
  '見る': { reading: 'みる (miru)', meaning: 'Ver / Mirar', folder: '一段動詞 · Verbos Ichidan (G2)', role: 'verb_g2', notes: 'Verbo transitivo Grupo 2 (raíz: 見-).' },
  '寝る': { reading: 'ねる (neru)', meaning: 'Dormir', folder: '一段動詞 · Verbos Ichidan (G2)', role: 'verb_g2', notes: 'Verbo intransitivo Grupo 2.' },
  '起きる': { reading: 'おきる (okiru)', meaning: 'Levantarse / Despertarse', folder: '一段動詞 · Verbos Ichidan (G2)', role: 'verb_g2', notes: 'Verbo intransitivo Grupo 2.' },
  '教える': { reading: 'おしえる (oshieru)', meaning: 'Enseñar', folder: '一段動詞 · Verbos Ichidan (G2)', role: 'verb_g2', notes: 'Verbo transitivo Grupo 2.' },
  '開ける': { reading: 'あける (akeru)', meaning: 'Abrir', folder: '一段動詞 · Verbos Ichidan (G2)', role: 'verb_g2', notes: 'Verbo transitivo Grupo 2.' },
  '閉める': { reading: 'しめる (shimeru)', meaning: 'Cerrar', folder: '一段動詞 · Verbos Ichidan (G2)', role: 'verb_g2', notes: 'Verbo transitivo Grupo 2.' },
  '飲む': { reading: 'のむ (nomu)', meaning: 'Beber / Tomar', folder: '五段動詞 · Verbos Godan (G1)', role: 'verb_g1', notes: 'Verbo transitivo Grupo 1 terminado en む.' },
  '読む': { reading: 'よむ (yomu)', meaning: 'Leer', folder: '五段動詞 · Verbos Godan (G1)', role: 'verb_g1', notes: 'Verbo transitivo Grupo 1 terminado en む.' },
  '買う': { reading: 'かう (kau)', meaning: 'Comprar', folder: '五段動詞 · Verbos Godan (G1)', role: 'verb_g1', notes: 'Verbo transitivo Grupo 1 terminado en う.' },
  '行く': { reading: 'いく (iku)', meaning: 'Ir', folder: '五段動詞 · Verbos Godan (G1)', role: 'verb_g1', notes: 'Verbo de desplazamiento Grupo 1 (て: 行って).' },
  '書く': { reading: 'かく (kaku)', meaning: 'Escribir', folder: '五段動詞 · Verbos Godan (G1)', role: 'verb_g1', notes: 'Verbo transitivo Grupo 1 terminado en く.' },
  '聞く': { reading: 'きく (kiku)', meaning: 'Escuchar / Preguntar', folder: '五段動詞 · Verbos Godan (G1)', role: 'verb_g1', notes: 'Verbo transitivo Grupo 1 terminado en く.' },
  '話す': { reading: 'はなす (hanasu)', meaning: 'Hablar', folder: '五段動詞 · Verbos Godan (G1)', role: 'verb_g1', notes: 'Verbo Grupo 1 terminado en す.' },
  '帰る': { reading: 'かえる (kaeru)', meaning: 'Regresar', folder: '五段動詞 · Verbos Godan (G1)', role: 'verb_g1', notes: 'Verbo Grupo 1 (excepción fonética en -eru).' },
  '作る': { reading: 'つくる (tsukuru)', meaning: 'Preparar / Fabricar', folder: '五段動詞 · Verbos Godan (G1)', role: 'verb_g1', notes: 'Verbo transitivo Grupo 1 terminado en る.' },
  '待つ': { reading: 'まつ (matsu)', meaning: 'Esperar', folder: '五段動詞 · Verbos Godan (G1)', role: 'verb_g1', notes: 'Verbo Grupo 1 terminado en つ.' },
  '走る': { reading: 'はしる (hashiru)', meaning: 'Correr', folder: '五段動詞 · Verbos Godan (G1)', role: 'verb_g1', notes: 'Verbo Grupo 1 terminado en る.' },
  'する': { reading: 'suru', meaning: 'Hacer', folder: '不規則動詞 · Verbos Irregulares (G3)', role: 'verb_g3', notes: 'Verbo irregular Grupo 3.' },
  '勉強する': { reading: 'べんきょうする (benkyou suru)', meaning: 'Estudiar', folder: '不規則動詞 · Verbos Irregulares (G3)', role: 'verb_g3', notes: 'Verbo irregular compuesto con する.' },
  '来る': { reading: 'くる (kuru)', meaning: 'Venir', folder: '不規則動詞 · Verbos Irregulares (G3)', role: 'verb_g3', notes: 'Verbo irregular Grupo 3.' },
  '高い': { reading: 'たかい (takai)', meaning: 'Caro / Alto', folder: 'い形容詞 · Adjetivos -い', role: 'adj_i', notes: 'Adjetivo verdadero terminado en い.' },
  '安い': { reading: 'やすい (yasui)', meaning: 'Barato', folder: 'い形容詞 · Adjetivos -い', role: 'adj_i', notes: 'Adjetivo verdadero terminado en い.' },
  '大きい': { reading: 'おおきい (ookii)', meaning: 'Grande', folder: 'い形容詞 · Adjetivos -い', role: 'adj_i', notes: 'Adjetivo verdadero terminado en い.' },
  '小さい': { reading: 'ちいさい (chiisai)', meaning: 'Pequeño', folder: 'い形容詞 · Adjetivos -い', role: 'adj_i', notes: 'Adjetivo verdadero terminado en い.' },
  '新しい': { reading: 'あたらしい (atarashii)', meaning: 'Nuevo', folder: 'い形容詞 · Adjetivos -い', role: 'adj_i', notes: 'Adjetivo verdadero terminado en い.' },
  '古い': { reading: 'ふるい (furui)', meaning: 'Viejo / Antiguo', folder: 'い形容詞 · Adjetivos -い', role: 'adj_i', notes: 'Adjetivo verdadero terminado en い.' },
  '美味しい': { reading: 'おいしい (oishii)', meaning: 'Delicioso', folder: 'い形容詞 · Adjetivos -い', role: 'adj_i', notes: 'Adjetivo verdadero terminado en い.' },
  '難しい': { reading: 'むずかしい (muzukashii)', meaning: 'Difícil', folder: 'い形容詞 · Adjetivos -い', role: 'adj_i', notes: 'Adjetivo verdadero terminado en い.' },
  '静か': { reading: 'しずか (shizuka)', meaning: 'Tranquilo / Silencioso', folder: 'な形容詞 · Adjetivos -な', role: 'adj_na', notes: 'Adjetivo nominal (inserta な antes de sustantivo).' },
  '好き': { reading: 'すき (suki)', meaning: 'Gustar / Agradable', folder: 'な形容詞 · Adjetivos -な', role: 'adj_na', notes: 'Adjetivo nominal (marca el objeto con が).' },
  '綺麗': { reading: 'きれい (kirei)', meaning: 'Limpio / Hermoso', folder: 'な形容詞 · Adjetivos -な', role: 'adj_na', notes: 'Adjetivo nominal -な aunque termine en い.' },
  '便利': { reading: 'べんり (benri)', meaning: 'Práctico / Conveniente', folder: 'な形容詞 · Adjetivos -な', role: 'adj_na', notes: 'Adjetivo nominal -な.' },
  '元気': { reading: 'げんき (genki)', meaning: 'Con energía / Saludable', folder: 'な形容詞 · Adjetivos -な', role: 'adj_na', notes: 'Adjetivo nominal -な.' },
  '有名': { reading: 'ゆうめい (yuumei)', meaning: 'Famoso', folder: 'な形容詞 · Adjetivos -な', role: 'adj_na', notes: 'Adjetivo nominal -な.' }
};

const COMMON_JAPANESE_EXPRESSIONS = {
  'すみません': {
    reading: 'すみません (sumimasen)',
    translation: 'Disculpe / Lo siento / Con permiso',
    level: 'N5',
    tokens: [
      { surface: 'すみません', role: 'Expresión fija de cortesía (定型表現)', detail: 'Se utiliza de forma natural para pedir disculpas, llamar la atención ("disculpe") o agradecer una molestia.' }
    ],
    feedback: 'Tu frase es gramaticalmente perfecta y es la forma más natural de decir "disculpe" o "lo siento" en japonés.'
  },
  'ありがとうございます': {
    reading: 'ありがとうございます (arigatou gozaimasu)',
    translation: 'Muchas gracias',
    level: 'N5',
    tokens: [
      { surface: 'ありがとう', role: 'Expresión de gratitud', detail: 'Significa "gracias" en registro cercano.' },
      { surface: 'ございます', role: 'Auxiliar de cortesía (丁寧語)', detail: 'Aporta el registro formal ("muchas gracias").' }
    ],
    feedback: 'Expresión formal de gratitud completamente correcta y natural.'
  },
  'こんにちは': {
    reading: 'こんにちは (konnichiwa)',
    translation: 'Hola',
    level: 'N5',
    tokens: [
      { surface: 'こんにちは', role: 'Saludo estándar natural (挨拶)', detail: 'Equivale de forma directa y natural a "Hola" durante el día. La は final se pronuncia "wa".' }
    ],
    feedback: 'Saludo natural correctamente escrito. En japonés cotidiano こんにちは equivale directamente a "Hola" (mientras que "Buenos días" es おはよう / おはようございます).'
  },
  'おはよう': {
    reading: 'おはよう (ohayou)',
    translation: 'Buenos días (informal)',
    level: 'N5',
    tokens: [
      { surface: 'おはよう', role: 'Saludo matutino (挨拶)', detail: 'Saludo natural de la mañana ("Buenos días") entre amigos o familia.' }
    ],
    feedback: 'Saludo matutino natural correctamente escrito ("Buenos días").'
  },
  'おはようございます': {
    reading: 'おはようございます (ohayou gozaimasu)',
    translation: 'Buenos días',
    level: 'N5',
    tokens: [
      { surface: 'おはよう', role: 'Base del saludo matutino', detail: 'Buenos días.' },
      { surface: 'ございます', role: 'Cortesía formal (丁寧語)', detail: 'Convierte el saludo matutino en formal y cortés.' }
    ],
    feedback: 'Forma cortés y natural de decir "Buenos días" en japonés.'
  },
  'こんばんは': {
    reading: 'こんばんは (konbanwa)',
    translation: 'Buenas noches',
    level: 'N5',
    tokens: [
      { surface: 'こんばんは', role: 'Saludo nocturno (挨拶)', detail: 'Saludo natural al llegar o encontrarse por la noche ("Buenas noches"). Se escribe con は final pronunciada "wa".' }
    ],
    feedback: 'Saludo nocturno natural correctamente escrito con は final.'
  }
};

// ============================================================================
// 4. LOS 7 PASOS DEL TUTORIAL COMPACTO CON SUB-PESTAÑAS Y PUNTERO REAL
// ============================================================================

const TUTORIAL_STEPS = [
  {
    step: 1,
    tab: 'inventory',
    targetId: 'tour-input-box',
    pointerPos: 'top',
    badge: '1/7 · Caja de Ingreso',
    title: 'Ingreso y Clasificación Automática',
    what: 'Acá escribís o pegás tus palabras, partículas o usos gramaticales (1 sola o 80+ de golpe) y podés escuchar cómo suenan con los botones 🔊 Leer en JP y 🔊 Leer en ES.',
    how: 'Escribí términos separados por coma (ej: 私, 車, 食べる, は, を, ている) y tocá "Analizar y Clasificar Automáticamente".',
    why: 'Detecta automáticamente la familia gramatical de cada palabra y crea su carpeta sin que clasifiques nada a mano.'
  },
  {
    step: 2,
    tab: 'inventory',
    targetId: 'tour-quick-catalogs',
    pointerPos: 'top',
    badge: '2/7 · Catálogos 1 Toque',
    title: 'Botones Rápidos (+助詞, +こそあど, +時間, +文法)',
    what: 'Cuatro catálogos interactivos para activar de un toque las partículas, demostrativos, palabras de tiempo y conjugaciones que ya conocés.',
    how: 'Tocá cualquiera de los 4 botones y marcá los elementos que dominás para sumarlos a tu inventario.',
    why: 'Te permite cargar tus partículas (は, が, を, の, に, で) o reglas como Causativo y Condicionales en segundos.'
  },
  {
    step: 3,
    tab: 'inventory',
    targetId: 'tour-folders',
    pointerPos: 'top',
    badge: '3/7 · Carpetas Dinámicas',
    title: 'Carpetas Creadas a tu Medida',
    what: 'Tu inventario inicia en 0 (sin carpetas vacías de adorno) y solo existen las carpetas de lo que vos agregás.',
    how: 'Tocá cualquier carpeta para desplegar tus palabras y presioná JP o ES en cada tarjeta para oír su pronunciación.',
    why: 'Organiza tu estudio por función real (Sustantivos, Verbos G1/G2/G3, Adjetivos -い/-な, Partículas y Usos).'
  },
  {
    step: 4,
    tab: 'generator',
    targetId: 'tour-gen-modes',
    pointerPos: 'top',
    badge: '4/7 · Modos del Generador',
    title: 'Deducción Automática vs. Selección Manual',
    what: 'Dos modos para elegir cómo se construyen tus oraciones cerradas.',
    how: 'Elegí "1. Según mi Inventario" para deducción automática, o "2. Elegir Usos Gramaticales" para elegir vos mismo la regla de N5 a N1.',
    why: 'Garantiza que puedas practicar tanto de forma automática con tus palabras actuales como filtrando una regla específica.'
  },
  {
    step: 5,
    tab: 'generator',
    targetId: 'tour-gen-categories',
    pointerPos: 'top',
    badge: '5/7 · Gramática N5–N1',
    title: '9 Categorías Gramaticales y Formalidad',
    what: 'Panel con las 9 familias gramaticales (Continuo, Volitivo, Causativo, Pasivo, Condicionales, etc.) y selector Formal/Informal.',
    how: 'Abrí una categoría, marcá los usos que querés practicar y elegí tiempo (Presente, Pasado, Negativo o Pregunta).',
    why: 'Conjuga los verbos y adjetivos de tu inventario mostrando la fórmula estructural exacta sin relleno.'
  },
  {
    step: 6,
    tab: 'generator',
    targetId: 'tour-gen-button',
    pointerPos: 'bottom',
    badge: '6/7 · Generar Cerrado',
    title: 'Creación de Oraciones 100% Cerrada',
    what: 'Construye las oraciones empleando únicamente el vocabulario y las partículas de tu inventario.',
    how: 'Elegí 1, 3 o 5 oraciones y presioná "Generar Oraciones (100% Cerrado)".',
    why: 'Evita que aparezcan palabras desconocidas y desglosa literalmente la función de cada partícula y conjugación.'
  },
  {
    step: 7,
    tab: 'practice',
    targetId: 'tour-practice-room',
    pointerPos: 'top',
    badge: '7/7 · Práctica y JSON',
    title: 'Sala de Práctica Libre (N5–N1) y Respaldo JSON',
    what: 'Evaluador abierto a todo el japonés con la bocina 🔊 Leer en JP en la casilla de japonés para escuchar tu pronunciación ANTES de comprobar.',
    how: 'Escribí tu oración en japonés arriba (podés escucharla con Leer en JP), anotá tu traducción en español abajo sin pistas y tocá Revisar.',
    why: 'Te permite verificar cualquier oración libremente y respaldar tu progreso en un archivo JSON.'
  }
];

// ============================================================================
// 5. MOTOR DE CONJUGACIÓN ESTRUCTURAL EXACTA (G1, G2, G3, ADJETIVOS)
// ============================================================================

function getGodanStem(word, targetVowel) {
  const lastChar = word.slice(-1);
  const base = word.slice(0, -1);
  const table = {
    'う': { a: 'わ', i: 'い', u: 'う', e: 'え', o: 'おう', te: 'って', ta: 'った' },
    'く': { a: 'か', i: 'き', u: 'く', e: 'け', o: 'こう', te: 'いて', ta: 'いた' },
    'ぐ': { a: 'が', i: 'ぎ', u: 'ぐ', e: 'げ', o: 'ごう', te: 'いで', ta: 'いだ' },
    'す': { a: 'さ', i: 'し', u: 'す', e: 'せ', o: 'そう', te: 'して', ta: 'した' },
    'つ': { a: 'た', i: 'ち', u: 'つ', e: 'て', o: 'とう', te: 'って', ta: 'った' },
    'ぬ': { a: 'な', i: 'に', u: 'ぬ', e: 'ね', o: 'のう', te: 'んで', ta: 'んだ' },
    'ぶ': { a: 'ば', i: 'び', u: 'ぶ', e: 'べ', o: 'ぼう', te: 'んで', ta: 'んだ' },
    'む': { a: 'ま', i: 'み', u: 'む', e: 'め', o: 'もう', te: 'んで', ta: 'んだ' },
    'る': { a: 'ら', i: 'り', u: 'る', e: 'れ', o: 'ろう', te: 'って', ta: 'った' }
  };
  if (word === '行く' && (targetVowel === 'te' || targetVowel === 'ta')) {
    return targetVowel === 'te' ? '行って' : '行った';
  }
  const row = table[lastChar] || table['る'];
  return base + (row[targetVowel] || lastChar);
}

function conjugateJapaneseVerb(verbItem, grammarId, formality, polarityTense) {
  const word = verbItem.word;
  const role = verbItem.role || 'verb_g1';
  const isFormal = formality === 'formal';
  const isNegative = polarityTense.includes('neg');
  const isPast = polarityTense.includes('past');
  const isQuestion = polarityTense === 'question';

  let masuStem = '';
  let teForm = '';
  let taForm = '';
  let naiStem = '';
  let volitionalPlain = '';
  let potentialPlain = '';
  let causativePlain = '';
  let passivePlain = '';
  let causativePassivePlain = '';
  let baForm = '';
  let imperativePlain = '';

  if (role === 'verb_g2') {
    const stem = word.slice(0, -1);
    masuStem = stem;
    teForm = stem + 'て';
    taForm = stem + 'た';
    naiStem = stem;
    volitionalPlain = stem + 'よう';
    potentialPlain = stem + 'られる';
    causativePlain = stem + 'させる';
    passivePlain = stem + 'られる';
    causativePassivePlain = stem + 'させられる';
    baForm = stem + 'れば';
    imperativePlain = stem + 'ろ';
  } else if (role === 'verb_g3') {
    if (word.endsWith('する')) {
      const prefix = word.slice(0, -2);
      masuStem = prefix + 'し';
      teForm = prefix + 'して';
      taForm = prefix + 'した';
      naiStem = prefix + 'し';
      volitionalPlain = prefix + 'しよう';
      potentialPlain = prefix + 'できる';
      causativePlain = prefix + 'させる';
      passivePlain = prefix + 'される';
      causativePassivePlain = prefix + 'させられる';
      baForm = prefix + 'すれば';
      imperativePlain = prefix + 'しろ';
    } else {
      masuStem = '来';
      teForm = '来て';
      taForm = '来た';
      naiStem = '来';
      volitionalPlain = '来よう';
      potentialPlain = '来られる';
      causativePlain = '来させる';
      passivePlain = '来られる';
      causativePassivePlain = '来させられる';
      baForm = '来れば';
      imperativePlain = '来い';
    }
  } else {
    masuStem = getGodanStem(word, 'i');
    teForm = getGodanStem(word, 'te');
    taForm = getGodanStem(word, 'ta');
    naiStem = getGodanStem(word, 'a');
    volitionalPlain = getGodanStem(word, 'o');
    potentialPlain = getGodanStem(word, 'e') + 'る';
    causativePlain = naiStem + 'せる';
    passivePlain = naiStem + 'れる';
    causativePassivePlain = word.endsWith('す') ? naiStem + 'せられる' : naiStem + 'される';
    baForm = getGodanStem(word, 'e') + 'ば';
    imperativePlain = getGodanStem(word, 'e');
  }

  const qSuffix = isQuestion ? 'か' : '';

  const finishIchidanLike = (plainIchidan) => {
    const stem = plainIchidan.slice(0, -1);
    let surface = '';
    if (isFormal) {
      if (!isPast && !isNegative) surface = `${stem}ます`;
      else if (!isPast && isNegative) surface = `${stem}ません`;
      else if (isPast && !isNegative) surface = `${stem}ました`;
      else surface = `${stem}ませんでした`;
    } else {
      if (!isPast && !isNegative) surface = plainIchidan;
      else if (!isPast && isNegative) surface = `${stem}ない`;
      else if (isPast && !isNegative) surface = `${stem}た`;
      else surface = `${stem}なかった`;
    }
    return surface + qSuffix;
  };

  switch (grammarId) {
    case 'te_iru':
      return {
        surface: finishIchidanLike(teForm + 'いる'),
        formula: `${word} → Forma て (${teForm}) + ${isFormal ? 'います' : 'いる'}`,
        esTransform: (m) => `está ejecutando la acción de ${m.toLowerCase()}`
      };
    case 'tai': {
      let surface = '';
      if (!isPast && !isNegative) surface = isFormal ? `${masuStem}たいです` : `${masuStem}たい`;
      else if (!isPast && isNegative) surface = isFormal ? `${masuStem}たくないです` : `${masuStem}たくない`;
      else if (isPast && !isNegative) surface = isFormal ? `${masuStem}たかったです` : `${masuStem}たかった`;
      else surface = isFormal ? `${masuStem}たくなかったです` : `${masuStem}たくなかった`;
      return {
        surface: surface + qSuffix,
        formula: `${word} → Raíz ます (${masuStem}) + たい`,
        esTransform: (m) => `${isNegative ? 'no ' : ''}${isPast ? 'quería' : 'quiere'} ${m.toLowerCase()}`
      };
    }
    case 'volitional': {
      const surface = isFormal ? `${masuStem}ましょう` : volitionalPlain;
      return {
        surface: surface + qSuffix,
        formula: `${word} → Forma Volitiva (${surface})`,
        esTransform: (m) => `vamos a ${m.toLowerCase()}`
      };
    }
    case 'intentional': {
      const surface = isFormal ? `${volitionalPlain}としています` : `${volitionalPlain}としている`;
      return {
        surface: surface + qSuffix,
        formula: `${word} → Volitivo (${volitionalPlain}) + とする`,
        esTransform: (m) => `intenta / está por ${m.toLowerCase()}`
      };
    }
    case 'potential':
      return {
        surface: finishIchidanLike(potentialPlain),
        formula: `${word} → Forma Potencial (${potentialPlain})`,
        esTransform: (m) => `${isNegative ? 'no ' : ''}${isPast ? 'pudo' : 'puede'} ${m.toLowerCase()}`
      };
    case 'causative':
      return {
        surface: finishIchidanLike(causativePlain),
        formula: `${word} → Raíz Causativa (${causativePlain})`,
        esTransform: (m) => `${isNegative ? 'no ' : ''}hace/deja ${m.toLowerCase()}`
      };
    case 'passive':
      return {
        surface: finishIchidanLike(passivePlain),
        formula: `${word} → Raíz Pasiva (${passivePlain})`,
        esTransform: (m) => `es ${m.toLowerCase()} (voz pasiva)`
      };
    case 'causative_passive':
      return {
        surface: finishIchidanLike(causativePassivePlain),
        formula: `${word} → Causativo-Pasivo (${causativePassivePlain})`,
        esTransform: (m) => `${isNegative ? 'no ' : ''}es obligado a ${m.toLowerCase()}`
      };
    case 'imperative': {
      const surface = isFormal ? `${masuStem}なさい` : imperativePlain;
      return {
        surface,
        formula: `${word} → Imperativo (${surface})`,
        esTransform: (m) => `¡Ejecuta la acción de ${m.toLowerCase()}!`
      };
    }
    case 'cond_to':
      return {
        surface: `${word}と、${isFormal ? 'いいです' : 'いい'}`,
        formula: `${word} (Diccionario) + と (Condicional Natural)`,
        esTransform: (m) => `siempre que se ejecuta ${m.toLowerCase()}, resulta bien`
      };
    case 'cond_ba':
      return {
        surface: `${baForm}、${isFormal ? 'いいです' : 'いい'}`,
        formula: `${word} → Condicional Hipotético (${baForm})`,
        esTransform: (m) => `si se cumple ${m.toLowerCase()}, está bien`
      };
    case 'cond_tara':
      return {
        surface: `${taForm}ら、${isFormal ? 'いいです' : 'いい'}`,
        formula: `${word} → Pasado (${taForm}) + ら`,
        esTransform: (m) => `si / cuando (${m.toLowerCase()}), estará bien`
      };
    case 'cond_nara':
      return {
        surface: `${word}なら、${isFormal ? 'いいです' : 'いい'}`,
        formula: `${word} + なら (Contextual)`,
        esTransform: (m) => `dado el caso de ${m.toLowerCase()}, está bien`
      };
    case 'te_miru':
      return {
        surface: finishIchidanLike(teForm + 'みる'),
        formula: `${word} → ${teForm} + みる`,
        esTransform: (m) => `prueba a ${m.toLowerCase()}`
      };
    case 'te_oku':
      return {
        surface: (isFormal ? `${teForm}おきます` : `${teForm}おく`) + qSuffix,
        formula: `${word} → ${teForm} + おく (Preparación)`,
        esTransform: (m) => `deja preparado (${m.toLowerCase()}) por adelantado`
      };
    case 'te_shimau':
      return {
        surface: (isFormal ? `${teForm}しまいました` : `${teForm}しまった`) + qSuffix,
        formula: `${word} → ${teForm} + しまう (Completitud)`,
        esTransform: (m) => `completó totalmente la acción de ${m.toLowerCase()}`
      };
    case 'must_nakereba':
      return {
        surface: (isFormal ? `${naiStem}なければなりません` : `${naiStem}なければならない`) + qSuffix,
        formula: `${word} → ${naiStem}ない + ければならない`,
        esTransform: (m) => `tiene que ${m.toLowerCase()}`
      };
    case 'perm_temoii':
      return {
        surface: (isFormal ? `${teForm}もいいです` : `${teForm}もいい`) + qSuffix,
        formula: `${word} → ${teForm} + もいい`,
        esTransform: (m) => `tiene permiso para ${m.toLowerCase()}`
      };
    case 'prohib_tewaikenai':
      return {
        surface: isFormal ? `${teForm}はいけません` : `${teForm}はいけない`,
        formula: `${word} → ${teForm} + はいけない`,
        esTransform: (m) => `está prohibido ${m.toLowerCase()}`
      };
    case 'advice_tahou':
      return {
        surface: (isFormal ? `${taForm}ほうがいいです` : `${taForm}ほうがいい`) + qSuffix,
        formula: `${word} → ${taForm} + ほうがいい`,
        esTransform: (m) => `es recomendable ${m.toLowerCase()}`
      };
    case 'should_beki': {
      const baseBeki = word === 'する' ? 'すべき' : `${word}べき`;
      return {
        surface: (isFormal ? `${baseBeki}です` : `${baseBeki}だ`) + qSuffix,
        formula: `${word} + べきだ (Deber N3)`,
        esTransform: (m) => `corresponde / debe ${m.toLowerCase()}`
      };
    }
    case 'cause_node':
      return {
        surface: `${word}ので、${isFormal ? 'いいです' : 'いい'}`,
        formula: `${word} + ので (Causa suave)`,
        esTransform: (m) => `como ${m.toLowerCase()}, está bien`
      };
    case 'contrast_noni':
      return {
        surface: `${word}のに、${isFormal ? '大変です' : '大変だ'}`,
        formula: `${word} + のに (Contraste)`,
        esTransform: (m) => `a pesar de ${m.toLowerCase()}`
      };
    case 'cause_okagede':
      return {
        surface: `${word}おかげで、${isFormal ? '助かります' : '助かる'}`,
        formula: `${word} + おかげで (Gracias a)`,
        esTransform: (m) => `gracias a ${m.toLowerCase()}`
      };
    case 'conj_kamoshirenai':
      return {
        surface: (isFormal ? `${word}かもしれません` : `${word}かもしれない`) + qSuffix,
        formula: `${word} + かもしれない (Posibilidad)`,
        esTransform: (m) => `tal vez / puede que (${m.toLowerCase()})`
      };
    case 'conj_souda':
      return {
        surface: (isFormal ? `${masuStem}そうです` : `${masuStem}そうだ`) + qSuffix,
        formula: `Raíz ます (${masuStem}) + そうだ (Apariencia)`,
        esTransform: (m) => `parece estar por ${m.toLowerCase()}`
      };
    case 'conj_nichigainai':
      return {
        surface: (isFormal ? `${word}に違いありません` : `${word}に違いない`) + qSuffix,
        formula: `${word} + に違いない (Certeza N3)`,
        esTransform: (m) => `sin duda alguna (${m.toLowerCase()})`
      };
    case 'adv_wakeda':
      return {
        surface: (isFormal ? `${word}わけです` : `${word}わけだ`) + qSuffix,
        formula: `${word} + わけだ (Conclusión lógica N3)`,
        esTransform: (m) => `es lógico que (${m.toLowerCase()})`
      };
    case 'adv_zaruwoenai': {
      const stem = word === 'する' ? 'せ' : naiStem;
      return {
        surface: isFormal ? `${stem}ざるを得ません` : `${stem}ざるを得ない`,
        formula: `${word} → ${stem} + ざるを得ない (N2)`,
        esTransform: (m) => `no tiene otra alternativa que ${m.toLowerCase()}`
      };
    }
    case 'adv_nihokanaranai':
      return {
        surface: isFormal ? `${word}にほかなりません` : `${word}にほかならない`,
        formula: `${word} + にほかならない (Afirmación absoluta N1)`,
        esTransform: (m) => `no es otra cosa sino ${m.toLowerCase()}`
      };
    case 'keigo_sonkeigo':
      return {
        surface: (isFormal ? `お${masuStem}になります` : `お${masuStem}になる`) + qSuffix,
        formula: `お + Raíz ます (${masuStem}) + になる (Honorífico)`,
        esTransform: (m) => `realiza honorablemente ${m.toLowerCase()}`
      };
    default: {
      let surface = '';
      if (isFormal) {
        if (!isPast && !isNegative) surface = `${masuStem}ます`;
        else if (!isPast && isNegative) surface = `${masuStem}ません`;
        else if (isPast && !isNegative) surface = `${masuStem}ました`;
        else surface = `${masuStem}ませんでした`;
      } else {
        if (!isPast && !isNegative) surface = word;
        else if (!isPast && isNegative) surface = `${naiStem}ない`;
        else if (isPast && !isNegative) surface = taForm;
        else surface = `${naiStem}なかった`;
      }
      return {
        surface: surface + qSuffix,
        formula: `${word} → ${isFormal ? 'Forma Cortés (ます)' : 'Forma Plana'} (${surface})`,
        esTransform: (m) => `${isNegative ? 'no ' : ''}${isPast ? '(pasado) ' : ''}${m.toLowerCase()}`
      };
    }
  }
}

// ============================================================================
// 5.1 ERROR BOUNDARY PARA EVITAR PANTALLAS EN BLANCO
// ============================================================================

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Ocurrió un error inesperado al renderizar.'
    };
  }

  componentDidCatch(error) {
    // Registro silencioso en consola para diagnóstico
    if (typeof console !== 'undefined' && console.error) {
      console.error('MI JAPONÉS ErrorBoundary:', error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-5">
          <div className="max-w-md w-full bg-[#101624] border border-rose-500/40 rounded-3xl p-5 space-y-3 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-300">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="font-black text-base text-white">
              Se detectó un problema al cargar la vista
            </h2>
            <p className="text-xs text-slate-300 break-words">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// 6. COMPONENTE PRINCIPAL DE LA APLICACIÓN (100% LOCAL · PALETA FRÍA Y SOBRIA)
// ============================================================================

const TAB_ORDER = ['inventory', 'generator', 'practice', 'saved'];

function MiJaponesApp() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [exitingTab, setExitingTab] = useState(null);
  const [tabSlideDirection, setTabSlideDirection] = useState('forward');
  const [tabAnimSeq, setTabAnimSeq] = useState(0);
  const tabTransitionTimerRef = useRef(null);
  const swipeTouchStartRef = useRef(null);

  const handleSwitchTab = (nextTab) => {
    if (!nextTab || nextTab === activeTab) return;
    const currentIdx = TAB_ORDER.indexOf(activeTab);
    const nextIdx = TAB_ORDER.indexOf(nextTab);
    const direction = nextIdx >= currentIdx ? 'forward' : 'backward';

    if (tabTransitionTimerRef.current) {
      clearTimeout(tabTransitionTimerRef.current);
    }

    setExitingTab(activeTab);
    setTabSlideDirection(direction);
    setTabAnimSeq((prev) => prev + 1);
    setActiveTab(nextTab);

    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Ignorar
    }

    tabTransitionTimerRef.current = setTimeout(() => {
      setExitingTab(null);
    }, 420);
  };

  useEffect(() => {
    return () => {
      if (tabTransitionTimerRef.current) {
        clearTimeout(tabTransitionTimerRef.current);
      }
    };
  }, []);

  const handleMainTouchStart = (e) => {
    if (
      showSplash ||
      tutorialPhase !== 'closed' ||
      quickCatalogModal ||
      backupModalOpen ||
      !e.touches ||
      e.touches.length !== 1
    ) {
      swipeTouchStartRef.current = null;
      return;
    }
    const targetTag = e.target?.tagName?.toUpperCase();
    if (['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(targetTag)) {
      swipeTouchStartRef.current = null;
      return;
    }
    swipeTouchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  };

  const handleMainTouchEnd = (e) => {
    const start = swipeTouchStartRef.current;
    swipeTouchStartRef.current = null;
    if (!start || !e.changedTouches || e.changedTouches.length !== 1) return;

    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    const dt = Date.now() - start.time;

    if (dt > 550 || Math.abs(dx) < 75 || Math.abs(dx) < Math.abs(dy) * 1.8) {
      return;
    }

    const currentIdx = TAB_ORDER.indexOf(activeTab);
    if (dx < 0 && currentIdx < TAB_ORDER.length - 1) {
      handleSwitchTab(TAB_ORDER[currentIdx + 1]);
    } else if (dx > 0 && currentIdx > 0) {
      handleSwitchTab(TAB_ORDER[currentIdx - 1]);
    }
  };

  // 0. Nombre de Usuario Persistente (verifica localStorage 'mijapones_username_v1')
  const [username, setUsername] = useState(() => {
    try {
      return (
        localStorage.getItem('mijapones_username_v1') ||
        localStorage.getItem('mijapones_username_v2') ||
        ''
      );
    } catch {
      return '';
    }
  });

  const [splashMode] = useState(() => {
    try {
      const savedName =
        localStorage.getItem('mijapones_username_v1') ||
        localStorage.getItem('mijapones_username_v2');
      return savedName && savedName.trim() ? 'returning' : 'new';
    } catch {
      return 'new';
    }
  });

  // Índice rotativo en localStorage para usuarios recurrentes
  const [motivationalIndex] = useState(() => {
    try {
      const rawIdx = localStorage.getItem('mijapones_splash_msg_idx_v1');
      const currentIdx = rawIdx !== null ? parseInt(rawIdx, 10) : 0;
      const validIdx = Number.isNaN(currentIdx)
        ? 0
        : currentIdx % RETURNING_MOTIVATIONAL_MESSAGES.length;
      const nextIdx = (validIdx + 1) % RETURNING_MOTIVATIONAL_MESSAGES.length;
      localStorage.setItem('mijapones_splash_msg_idx_v1', String(nextIdx));
      return validIdx;
    } catch {
      return 0;
    }
  });

  const [tempUsernameInput, setTempUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');

  // Animación de Apertura Comercial (Splash Screen con un único logotipo)
  const [showSplash, setShowSplash] = useState(true);
  const [splashStage, setSplashStage] = useState(1);
  const [splashClosing, setSplashClosing] = useState(false);

  // 1. Perfil Superior Desplegable (colapsado por defecto)
  const [headerExpanded, setHeaderExpanded] = useState(false);

  // 2. Barra Inferior Desplegable + Cajón "Próximamente · En construcción"
  const [bottomNavCollapsed, setBottomNavCollapsed] = useState(false);
  const [comingSoonDrawerOpen, setComingSoonDrawerOpen] = useState(false);

  // Inventario persistente (0 carpetas prefabricadas por defecto)
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('mijapones_n5n1_inventory_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Oraciones guardadas
  const [savedSentences, setSavedSentences] = useState(() => {
    try {
      const saved = localStorage.getItem('mijapones_n5n1_saved_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3. Tutorial Opcional con deslizamiento real en 2 pasos (izquierda -> centro)
  const [tutorialPhase, setTutorialPhase] = useState('closed');
  const [welcomeSlideEntered, setWelcomeSlideEntered] = useState(false);
  const [tutorialStepIdx, setTutorialStepIdx] = useState(0);
  const [tutorialSubTab, setTutorialSubTab] = useState('what');
  const [visitedSubTabs, setVisitedSubTabs] = useState(['what']);
  const [hasLearnedSubtabs, setHasLearnedSubtabs] = useState(false);
  const [idleShowCircle, setIdleShowCircle] = useState(false);

  // Estados de Inventario
  const [rawBatchInput, setRawBatchInput] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [quickCatalogModal, setQuickCatalogModal] = useState(null);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [livePreviewInventoryBanner, setLivePreviewInventoryBanner] = useState('');

  // Estados del Generador
  const [generatorMode, setGeneratorMode] = useState('inventory_logic');
  const [deducedLevelFilter, setDeducedLevelFilter] = useState('AUTO');
  const [selectedGrammarIds, setSelectedGrammarIds] = useState(['base']);
  const [openCategories, setOpenCategories] = useState({ cat_voice_action: true });
  const [grammarSearch, setGrammarSearch] = useState('');
  const [grammarLevelFilter, setGrammarLevelFilter] = useState('ALL');
  const [formality, setFormality] = useState('formal');
  const [polarityTense, setPolarityTense] = useState('present_aff');
  const [sentenceCount, setSentenceCount] = useState(3);
  const [showReadings, setShowReadings] = useState(true);
  const [generatedResults, setGeneratedResults] = useState(null);

  // Estados de Práctica Libre
  const [practiceTabChip, setPracticeTabChip] = useState('kosoado');
  const [freeInputSentence, setFreeInputSentence] = useState('');
  const [freeInputMeaning, setFreeInputMeaning] = useState('');
  const [freeAuditResult, setFreeAuditResult] = useState(null);
  const [livePreviewPracticeBanner, setLivePreviewPracticeBanner] = useState('');
  const [practiceJpWarning, setPracticeJpWarning] = useState('');
  const [practiceEsWarning, setPracticeEsWarning] = useState('');

  // Estados de Guardadas
  const [savedSearch, setSavedSearch] = useState('');

  // Estados de Audio Bilingüe
  const [speakingId, setSpeakingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const audioRef = useRef(null);
  const voicesRef = useRef([]);
  const utteranceRef = useRef(null);
  const speakRequestIdRef = useRef(0);
  const speakTimersRef = useRef([]);

  // Función que activa el recuadro de sugerencia del tutorial deslizándose desde la izquierda
  const openWelcomeTutorialWithSlide = () => {
    setWelcomeSlideEntered(false);
    setTutorialPhase('welcome');
  };

  useEffect(() => {
    if (tutorialPhase === 'welcome') {
      setWelcomeSlideEntered(false);
      const slideTimer = setTimeout(() => {
        setWelcomeSlideEntered(true);
      }, 120);
      return () => clearTimeout(slideTimer);
    } else {
      setWelcomeSlideEntered(false);
    }
  }, [tutorialPhase]);

  useEffect(() => {
    if (!showSplash) {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // Ignorar
      }
      return;
    }
    const stage2Timer = setTimeout(() => {
      setSplashStage(2);
    }, 800);
    const stage3Timer = setTimeout(() => {
      setSplashStage(3);
    }, 1600);
    const stage4Timer = setTimeout(() => {
      setSplashStage(4);
    }, 2200);

    let fadeTimer = null;
    let hideTimer = null;
    if (splashMode === 'returning') {
      fadeTimer = setTimeout(() => {
        setSplashClosing(true);
      }, 6050);
      hideTimer = setTimeout(() => {
        setShowSplash(false);
        setSplashClosing(false);
      }, 6500);
    }

    return () => {
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);
      clearTimeout(stage4Timer);
      if (fadeTimer) clearTimeout(fadeTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [showSplash, splashMode]);

  const handleStartNewUserFromSplash = (e) => {
    if (e) e.preventDefault();
    const check = validateUsernameProfanity(tempUsernameInput);
    if (!check.valid) {
      setUsernameError(check.message);
      return;
    }
    const cleanName = tempUsernameInput.trim();
    const shouldShowFirstInstallTutorial = (() => {
      try {
        return localStorage.getItem('mijapones_tutorial_done_v1') !== 'true';
      } catch {
        return true;
      }
    })();

    setUsername(cleanName);
    try {
      localStorage.setItem('mijapones_username_v1', cleanName);
      localStorage.setItem('mijapones_username_v2', cleanName);
      localStorage.setItem('mijapones_tutorial_done_v1', 'true');
    } catch {
      // Ignorar
    }
    setUsernameError('');
    setSplashClosing(true);
    setTimeout(() => {
      setShowSplash(false);
      setSplashClosing(false);
      showToast(`¡Bienvenido, ${cleanName}!`);
      if (shouldShowFirstInstallTutorial) {
        setTimeout(() => {
          openWelcomeTutorialWithSlide();
        }, 320);
      }
    }, 450);
  };

  useEffect(() => {
    try {
      document.title = 'MI JAPONÉS N5–N1 · 日本語マスター';
      if (!document.querySelector('meta[name="referrer"]')) {
        const meta = document.createElement('meta');
        meta.name = 'referrer';
        meta.content = 'no-referrer';
        document.head.appendChild(meta);
      }
    } catch {
      // Ignorar
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mijapones_n5n1_inventory_v3', JSON.stringify(inventory));
    } catch {
      // Ignorar
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem('mijapones_n5n1_saved_v3', JSON.stringify(savedSentences));
    } catch {
      // Ignorar
    }
  }, [savedSentences]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // ============================================================================
  // 7. MOTOR BILINGÜE DE TRADUCCIÓN EN VIVO Y VOZ (JP <-> ES)
  // ============================================================================

  const containsJapaneseChars = (text) =>
    /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/.test(text || '');

  const containsJapaneseScript = (text) =>
    /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(text || '');

  const containsLatinLetters = (text) => /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(text || '');

  const normalizeSpanishMatch = (str) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[¡!¿?.,;:()]/g, '')
      .trim();

  const clearSpeakTimers = () => {
    speakTimersRef.current.forEach((t) => clearTimeout(t));
    speakTimersRef.current = [];
  };

  const registerSpeakTimer = (fn, ms) => {
    const id = setTimeout(fn, ms);
    speakTimersRef.current.push(id);
    return id;
  };

  // Precargar voces del sistema al montar (evita getVoices() vacío en Chrome Android)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;

    const loadVoices = () => {
      try {
        const list = synth.getVoices() || [];
        if (list.length > 0) {
          voicesRef.current = list;
        }
      } catch {
        // Ignorar
      }
    };

    loadVoices();
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', loadVoices);
    } else {
      synth.onvoiceschanged = loadVoices;
    }

    const t1 = setTimeout(loadVoices, 250);
    const t2 = setTimeout(loadVoices, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearSpeakTimers();
      try {
        if (typeof synth.removeEventListener === 'function') {
          synth.removeEventListener('voiceschanged', loadVoices);
        }
        if (synth.speaking || synth.pending) {
          synth.cancel();
        }
      } catch {
        // Ignorar
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          // Ignorar
        }
      }
    };
  }, []);

  const pickBestVoice = (lang) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    const liveVoices = synth ? synth.getVoices() || [] : [];
    const voices = liveVoices.length > 0 ? liveVoices : voicesRef.current || [];
    if (voices.length === 0) return null;

    const norm = (v) => (v.lang || '').replace('_', '-').toLowerCase();

    if (lang === 'ja') {
      return (
        voices.find((v) => norm(v) === 'ja-jp' && v.localService) ||
        voices.find((v) => norm(v).startsWith('ja') && v.localService) ||
        voices.find((v) => norm(v) === 'ja-jp') ||
        voices.find((v) => norm(v).startsWith('ja')) ||
        null
      );
    }

    const preferredEs = [
      'es-419',
      'es-mx',
      'es-us',
      'es-ni',
      'es-cr',
      'es-gt',
      'es-sv',
      'es-hn',
      'es-pa',
      'es-co',
      'es-es'
    ];
    for (const code of preferredEs) {
      const localMatch = voices.find((v) => norm(v) === code && v.localService);
      if (localMatch) return localMatch;
    }
    return (
      voices.find((v) => norm(v).startsWith('es') && v.localService) ||
      voices.find((v) => norm(v).startsWith('es')) ||
      null
    );
  };

  const resolveLocalTranslation = (rawText, targetLang) => {
    const clean = (rawText || '').trim();
    if (!clean) return '';

    const noPunct = clean.replace(/[。！？!?.]/g, '').trim();
    if (targetLang === 'es') {
      if (COMMON_JAPANESE_EXPRESSIONS[noPunct]) {
        return COMMON_JAPANESE_EXPRESSIONS[noPunct].translation.split('/')[0].trim();
      }
      const tokens = clean
        .split(/[,、\n\t;]+|\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (tokens.length > 0) {
        const translatedTokens = tokens.map((tok) => {
          const cleanTok = tok.replace(/[。！？!?.]/g, '');
          if (COMMON_JAPANESE_EXPRESSIONS[cleanTok]) {
            return COMMON_JAPANESE_EXPRESSIONS[cleanTok].translation.split('/')[0].trim();
          }
          if (BUILTIN_LEXICON[cleanTok]) {
            return BUILTIN_LEXICON[cleanTok].meaning.split('/')[0].trim();
          }
          const inInv = inventory.find((i) => i.word === cleanTok);
          if (inInv) return inInv.meaning.split('/')[0].trim();
          const inPart = PARTICLE_CATALOG.find((p) => p.word === cleanTok);
          if (inPart) return `partícula ${inPart.meaning.toLowerCase()}`;
          const inKoso = KOSOADO_CATALOG.find((k) => k.word === cleanTok);
          if (inKoso) return inKoso.meaning.replace('(+ Sustantivo)', '').split('/')[0].trim();
          const inTime = TIME_CATALOG.find((t) => t.word === cleanTok);
          if (inTime) return inTime.meaning.split('/')[0].trim();
          const inGram = GRAMMAR_QUICK_CATALOG.find(
            (g) => g.word === cleanTok || g.word.replace('～', '') === cleanTok
          );
          if (inGram) return inGram.meaning.split('(')[0].trim();
          return cleanTok;
        });
        return translatedTokens.join(', ');
      }
    } else if (targetLang === 'ja') {
      const targetNorm = normalizeSpanishMatch(noPunct);
      if (!targetNorm) return clean;

      const matchesMeaningExact = (meaningStr) =>
        (meaningStr || '')
          .split('/')
          .map((part) => normalizeSpanishMatch(part.replace(/\([^)]*\)/g, '')))
          .some((candidate) => candidate && candidate === targetNorm);

      for (const [jp, expr] of Object.entries(COMMON_JAPANESE_EXPRESSIONS)) {
        if (matchesMeaningExact(expr.translation)) return jp;
      }
      for (const [jp, data] of Object.entries(BUILTIN_LEXICON)) {
        if (matchesMeaningExact(data.meaning)) return jp;
      }
      const inInv = inventory.find((i) => matchesMeaningExact(i.meaning));
      if (inInv) return inInv.word;
      const inTime = TIME_CATALOG.find((t) => matchesMeaningExact(t.meaning));
      if (inTime) return inTime.word;
      const inKoso = KOSOADO_CATALOG.find((k) => matchesMeaningExact(k.meaning));
      if (inKoso) return inKoso.word;
    }
    return clean;
  };

  const fetchOnlineTranslation = async (text, sourceLang, targetLang) => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(
        text
      )}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const translated = data?.[0]?.map((part) => part?.[0]).join('') || '';
        if (translated.trim()) return translated.trim();
      }
    } catch {
      // Probar respaldo
    }

    try {
      const url2 = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=${sourceLang}|${targetLang}`;
      const res2 = await fetch(url2);
      if (res2.ok) {
        const data2 = await res2.json();
        const translated2 = data2?.responseData?.translatedText || '';
        if (
          translated2.trim() &&
          translated2.trim().toLowerCase() !== text.trim().toLowerCase()
        ) {
          return translated2.trim();
        }
      }
    } catch {
      // Sin conexión
    }

    return null;
  };

  const playAudioFallback = (text, lang, reqId) =>
    new Promise((resolve) => {
      const tl = lang === 'ja' ? 'ja' : 'es';
      const chunk = text.slice(0, 180);
      const urls = [
        `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=${tl}&q=${encodeURIComponent(
          chunk
        )}`,
        `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${encodeURIComponent(
          chunk
        )}`
      ];

      let settled = false;
      const finish = (ok) => {
        if (!settled) {
          settled = true;
          resolve(ok);
        }
      };

      const tryIndex = (idx) => {
        if (speakRequestIdRef.current !== reqId) {
          finish(false);
          return;
        }
        if (idx >= urls.length) {
          finish(false);
          return;
        }
        try {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          const audio = new Audio(urls[idx]);
          audio.preload = 'auto';
          audioRef.current = audio;

          const safetyMs = Math.max(6000, chunk.length * 160);
          const safetyTimer = registerSpeakTimer(() => finish(true), safetyMs);

          audio.onended = () => {
            clearTimeout(safetyTimer);
            finish(true);
          };
          audio.onerror = () => {
            clearTimeout(safetyTimer);
            tryIndex(idx + 1);
          };

          const playPromise = audio.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
              clearTimeout(safetyTimer);
              tryIndex(idx + 1);
            });
          }
        } catch {
          tryIndex(idx + 1);
        }
      };

      tryIndex(0);
    });

  const speakWithWebSpeech = (text, lang, reqId) =>
    new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve(false);
        return;
      }

      const synth = window.speechSynthesis;
      let settled = false;
      let started = false;

      const finish = (ok) => {
        if (!settled) {
          settled = true;
          resolve(ok);
        }
      };

      const startSpeaking = () => {
        if (speakRequestIdRef.current !== reqId) {
          finish(false);
          return;
        }

        try {
          if (synth.paused) {
            synth.resume();
          }

          const utter = new SpeechSynthesisUtterance(text);
          const targetVoice = pickBestVoice(lang);
          utter.lang = targetVoice?.lang || (lang === 'ja' ? 'ja-JP' : 'es-MX');
          if (targetVoice) {
            utter.voice = targetVoice;
          }
          utter.rate = lang === 'ja' ? 0.92 : 0.96;
          utter.pitch = 1;
          utter.volume = 1;

          utteranceRef.current = utter;

          const startWatchdog = registerSpeakTimer(() => {
            if (!started && !settled) {
              if (synth.speaking) {
                started = true;
                return;
              }
              try {
                if (synth.pending) synth.cancel();
              } catch {
                // Ignorar
              }
              finish(false);
            }
          }, 2000);

          const maxDurationTimer = registerSpeakTimer(
            () => {
              finish(started);
            },
            Math.max(5500, text.length * 180)
          );

          utter.onstart = () => {
            started = true;
            clearTimeout(startWatchdog);
          };

          utter.onend = () => {
            clearTimeout(startWatchdog);
            clearTimeout(maxDurationTimer);
            finish(true);
          };

          utter.onerror = (evt) => {
            clearTimeout(startWatchdog);
            clearTimeout(maxDurationTimer);
            if (speakRequestIdRef.current !== reqId || evt?.error === 'interrupted') {
              finish(true);
              return;
            }
            finish(false);
          };

          synth.speak(utter);
        } catch {
          finish(false);
        }
      };

      try {
        if (synth.speaking || synth.pending) {
          synth.cancel();
          registerSpeakTimer(startSpeaking, 90);
        } else {
          startSpeaking();
        }
      } catch {
        finish(false);
      }
    });

  const speakText = async (
    rawText,
    lang = 'ja',
    btnId = null,
    previewSection = null,
    options = {}
  ) => {
    const clean = (rawText || '').trim();
    if (!clean) {
      showToast('Escribe algo primero en esa casilla para escucharlo.');
      return;
    }

    if (options.strictJapaneseOnly) {
      if (!containsJapaneseScript(clean) || containsLatinLetters(clean)) {
        const warnMsg =
          'Este espacio es solo para escribir en japonés (hiragana, katakana o kanji).';
        setPracticeJpWarning(warnMsg);
        setLivePreviewPracticeBanner('');
        showToast(warnMsg);
        return;
      }
      setPracticeJpWarning('');
    }

    const reqId = ++speakRequestIdRef.current;
    clearSpeakTimers();
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {
        // Ignorar
      }
    }

    setSpeakingId(btnId);

    let textToSpeak = clean;
    const hasJp = containsJapaneseChars(clean);
    let translationFailed = false;

    try {
      if (options.strictJapaneseOnly) {
        textToSpeak = clean;
      } else if (lang === 'es' && hasJp) {
        const localEs = resolveLocalTranslation(clean, 'es');
        if (localEs && !containsJapaneseChars(localEs)) {
          textToSpeak = localEs;
        } else {
          const onlineEs = await fetchOnlineTranslation(clean, 'ja', 'es');
          if (onlineEs) {
            textToSpeak = onlineEs;
          } else {
            translationFailed = true;
          }
        }
      } else if (lang === 'ja' && !hasJp) {
        const localJp = resolveLocalTranslation(clean, 'ja');
        if (localJp && containsJapaneseChars(localJp)) {
          textToSpeak = localJp;
        } else {
          const onlineJp = await fetchOnlineTranslation(clean, 'es', 'ja');
          if (onlineJp) {
            textToSpeak = onlineJp;
          } else {
            translationFailed = true;
          }
        }
      }
    } catch {
      translationFailed = true;
    }

    if (speakRequestIdRef.current !== reqId) return;

    const previewLabel =
      lang === 'ja' ? `🔊 Japonés: "${textToSpeak}"` : `🔊 Español: "${textToSpeak}"`;
    if (previewSection === 'inventory') {
      setLivePreviewInventoryBanner(previewLabel);
    } else if (previewSection === 'practice') {
      setLivePreviewPracticeBanner(previewLabel);
    }

    if (translationFailed) {
      showToast(
        lang === 'es'
          ? 'No se pudo traducir al español. Verifica tu conexión a internet.'
          : 'No se pudo traducir al japonés. Verifica tu conexión a internet.'
      );
      setSpeakingId(null);
      return;
    }

    const nativeOk = await speakWithWebSpeech(textToSpeak, lang, reqId);
    if (speakRequestIdRef.current !== reqId) return;

    if (!nativeOk) {
      const fallbackOk = await playAudioFallback(textToSpeak, lang, reqId);
      if (speakRequestIdRef.current !== reqId) return;

      if (!fallbackOk) {
        showToast(
          lang === 'ja'
            ? 'No se pudo reproducir en japonés. Verifica volumen e instala la voz japonesa en Ajustes de Android → Texto a voz.'
            : 'No se pudo reproducir el audio. Verifica el volumen multimedia y la voz de Texto a voz en Android.'
        );
      }
    }

    if (speakRequestIdRef.current === reqId) {
      setSpeakingId(null);
    }
  };

  // ============================================================================
  // 8. SINCRONIZACIÓN DEL TUTORIAL COMPACTO CON SECUENCIA DE 3 PUNTOS Y ARO HUECO (5s)
  // ============================================================================

  const activeTutorialStep = tutorialPhase === 'tour' ? TUTORIAL_STEPS[tutorialStepIdx] : null;

  useEffect(() => {
    if (tutorialPhase !== 'tour') return;
    const stepObj = TUTORIAL_STEPS[tutorialStepIdx];
    if (!stepObj) return;

    setTutorialSubTab('what');
    setVisitedSubTabs(['what']);
    setIdleShowCircle(false);

    if (activeTab !== stepObj.tab) {
      handleSwitchTab(stepObj.tab);
    }
    if (stepObj.targetId === 'tour-gen-categories' && generatorMode !== 'manual_grammar') {
      setGeneratorMode('manual_grammar');
    }

    const timer = setTimeout(() => {
      const el = document.getElementById(stepObj.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 420);

    return () => clearTimeout(timer);
  }, [tutorialPhase, tutorialStepIdx, activeTab, generatorMode]);

  useEffect(() => {
    if (tutorialPhase !== 'tour') {
      setIdleShowCircle(false);
      return;
    }
    setIdleShowCircle(false);
    const idleTimer = setTimeout(() => {
      setIdleShowCircle(true);
    }, 5000);

    return () => clearTimeout(idleTimer);
  }, [tutorialPhase, tutorialStepIdx, tutorialSubTab, visitedSubTabs]);

  const selectTutorialSubTab = (subKey) => {
    setIdleShowCircle(false);
    setTutorialSubTab(subKey);
    setVisitedSubTabs((prev) => {
      const updated = prev.includes(subKey) ? prev : [...prev, subKey];
      if (updated.includes('what') && updated.includes('how') && updated.includes('why')) {
        setHasLearnedSubtabs(true);
      }
      return updated;
    });
  };

  const startGuidedTour = () => {
    try {
      localStorage.setItem('mijapones_tutorial_done_v1', 'true');
    } catch {
      // Ignorar
    }
    setTutorialStepIdx(0);
    setTutorialSubTab('what');
    setVisitedSubTabs(['what']);
    setHasLearnedSubtabs(false);
    setIdleShowCircle(false);
    handleSwitchTab(TUTORIAL_STEPS[0].tab);
    setTutorialPhase('tour');
  };

  const closeTutorialAndRemember = () => {
    setTutorialPhase('closed');
    setIdleShowCircle(false);
    try {
      localStorage.setItem('mijapones_tutorial_done_v1', 'true');
    } catch {
      // Ignorar
    }
  };

  const nextTutorialStep = () => {
    setIdleShowCircle(false);
    setHasLearnedSubtabs(true);
    if (tutorialStepIdx < TUTORIAL_STEPS.length - 1) {
      setTutorialStepIdx((prev) => prev + 1);
    } else {
      closeTutorialAndRemember();
      showToast('¡Recorrido completado!');
    }
  };

  const handleSmartNextInBubble = () => {
    setIdleShowCircle(false);
    if (!visitedSubTabs.includes('how')) {
      selectTutorialSubTab('how');
      return;
    }
    if (!visitedSubTabs.includes('why')) {
      selectTutorialSubTab('why');
      return;
    }
    setHasLearnedSubtabs(true);
    nextTutorialStep();
  };

  const prevTutorialStep = () => {
    setIdleShowCircle(false);
    if (tutorialStepIdx > 0) {
      setTutorialStepIdx((prev) => prev - 1);
    }
  };

  // Aro hueco que se achica alrededor del botón sin punto central ni relleno interior
  const renderShrinkingTouchCircle = () => (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center z-30 overflow-visible">
      <span
        className="w-11 h-11 rounded-full border-2 border-sky-400/85 bg-transparent shadow-[0_0_12px_rgba(56,189,248,0.45)]"
        style={{ animation: 'shrinkRing 1.9s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
      />
    </span>
  );

  const renderInlineTourPointerBubble = (targetId) => {
    if (tutorialPhase !== 'tour' || !activeTutorialStep || activeTutorialStep.targetId !== targetId) {
      return null;
    }

    const currentText =
      tutorialSubTab === 'what'
        ? activeTutorialStep.what
        : tutorialSubTab === 'how'
        ? activeTutorialStep.how
        : activeTutorialStep.why;

    const nextPendingSubTab = !visitedSubTabs.includes('how')
      ? 'how'
      : !visitedSubTabs.includes('why')
      ? 'why'
      : null;

    const allThreeVisited = visitedSubTabs.includes('how') && visitedSubTabs.includes('why');
    const showVisualCircleCue = !hasLearnedSubtabs || idleShowCircle;

    const subTabsMeta = [
      {
        key: 'what',
        stepNum: 1,
        label: '1. ¿Qué es?',
        activeClass: 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
      },
      {
        key: 'how',
        stepNum: 2,
        label: '2. ¿Cómo hacer?',
        activeClass: 'bg-slate-700 text-white border-slate-500 shadow-sm'
      },
      {
        key: 'why',
        stepNum: 3,
        label: '3. ¿Para qué?',
        activeClass: 'bg-teal-700 text-white border-teal-500 shadow-sm'
      }
    ];

    return (
      <div className="mt-2.5 relative z-40">
        {/* FLECHA INDICADORA APUNTANDO AL ELEMENTO */}
        <div className="flex justify-center -mb-1.5 pointer-events-none">
          <div className="w-3.5 h-3.5 rotate-45 bg-[#101626] border-l-2 border-t-2 border-indigo-400/80 shadow" />
        </div>

        <div className="bg-[#101626] border-2 border-indigo-400/80 rounded-2xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.85)] space-y-2.5">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 border border-indigo-400/50 text-indigo-200 font-black text-[10px] shrink-0">
                {activeTutorialStep.badge}
              </span>
              {username && (
                <span className="px-2 py-0.5 rounded-md bg-teal-500/15 border border-teal-500/30 text-teal-300 font-extrabold text-[10px] shrink-0">
                  {username}
                </span>
              )}
              <span className="font-extrabold text-xs text-slate-100 truncate">
                {activeTutorialStep.title}
              </span>
            </div>

            <button
              type="button"
              onClick={closeTutorialAndRemember}
              className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-bold shrink-0"
            >
              Saltar
            </button>
          </div>

          {/* SECUENCIA DE 3 PUNTOS CONECTADOS + AVISO DE REVISIÓN LIBRE */}
          <div className="bg-[#0a0f1c] p-2.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[10px] text-slate-300 font-semibold text-center">
              <span>↺ Podés tocar cualquiera de los 3 puntos (1, 2 o 3) en cualquier momento para volver a revisar lo que decía.</span>
            </div>

            <div className="relative flex items-center justify-between px-7 pt-1 pb-0.5">
              <div className="absolute left-9 right-9 top-3 h-0.5 bg-slate-800 z-0" />
              <div
                className="absolute left-9 top-3 h-0.5 bg-indigo-400 z-0 transition-all duration-300"
                style={{
                  width:
                    visitedSubTabs.length >= 3
                      ? 'calc(100% - 4.5rem)'
                      : visitedSubTabs.length === 2
                      ? 'calc(50% - 2.25rem)'
                      : '0%'
                }}
              />
              {subTabsMeta.map((tab) => {
                const isCurrent = tutorialSubTab === tab.key;
                const isDone = visitedSubTabs.includes(tab.key);
                const isNext = nextPendingSubTab === tab.key;
                return (
                  <button
                    key={`dot-${tab.key}`}
                    type="button"
                    onClick={() => selectTutorialSubTab(tab.key)}
                    className="relative z-10 flex flex-col items-center justify-center focus:outline-none gap-0.5"
                    title={tab.label}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                        isCurrent
                          ? 'bg-indigo-500 text-white ring-2 ring-indigo-300 scale-110'
                          : isDone
                          ? 'bg-teal-600 text-white'
                          : isNext
                          ? 'bg-slate-800 border border-sky-400 text-sky-300'
                          : 'bg-slate-800 border border-slate-700 text-slate-500'
                      }`}
                    >
                      {isDone && !isCurrent ? '✓' : tab.stepNum}
                    </span>
                    <span
                      className={`text-[8px] font-extrabold leading-none ${
                        isCurrent
                          ? 'text-indigo-300'
                          : isDone
                          ? 'text-teal-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {isCurrent ? 'Estás aquí' : isDone ? 'Revisar' : `Punto ${tab.stepNum}`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-1.5 relative">
              {subTabsMeta.map((tab) => {
                const isSelected = tutorialSubTab === tab.key;
                const isVisited = visitedSubTabs.includes(tab.key);
                const isNextTarget = nextPendingSubTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => selectTutorialSubTab(tab.key)}
                    className={`relative py-2 px-1 rounded-lg text-[10px] font-extrabold border transition-all flex items-center justify-center gap-1 ${
                      isSelected
                        ? tab.activeClass
                        : isNextTarget
                        ? 'bg-slate-800/90 border-sky-400/70 text-sky-200'
                        : isVisited
                        ? 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-500'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="relative z-10">{tab.label}</span>
                    {isVisited && !isSelected && (
                      <Check className="w-3 h-3 text-teal-400 shrink-0 relative z-10" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0a0f1c] border border-slate-800/90 rounded-xl p-2.5 text-xs text-slate-200 leading-relaxed">
            {currentText}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 relative">
            <div className="flex items-center gap-1">
              {TUTORIAL_STEPS.map((s, idx) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    setIdleShowCircle(false);
                    setTutorialStepIdx(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === tutorialStepIdx ? 'w-4 bg-indigo-400' : 'w-1.5 bg-slate-700'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevTutorialStep}
                disabled={tutorialStepIdx === 0}
                className="px-2.5 py-1 rounded-xl bg-slate-800 disabled:opacity-35 text-slate-200 text-[11px] font-bold flex items-center gap-0.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Ant.</span>
              </button>

              {nextPendingSubTab && (
                <button
                  type="button"
                  onClick={nextTutorialStep}
                  className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                >
                  Saltar paso
                </button>
              )}

              {/* ARO HUECO CONTRÁCTIL EN EL BOTÓN INFERIOR DERECHO SIN PUNTO CENTRAL */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleSmartNextInBubble}
                  className={`relative px-3.5 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-0.5 shadow transition-all overflow-visible ${
                    allThreeVisited
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white ring-1 ring-sky-300'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400'
                  }`}
                >
                  {showVisualCircleCue && renderShrinkingTouchCircle()}
                  <span className="relative z-10">
                    {!visitedSubTabs.includes('how')
                      ? '2. ¿Cómo? ›'
                      : !visitedSubTabs.includes('why')
                      ? '3. ¿Para qué? ›'
                      : tutorialStepIdx === TUTORIAL_STEPS.length - 1
                      ? '¡Empezar a estudiar!'
                      : 'Siguiente ›'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // 9. CLASIFICADOR AUTOMÁTICO Y MANEJO DEL INVENTARIO
  // ============================================================================

  const classifySingleTerm = (rawTerm) => {
    const clean = rawTerm.trim();
    if (!clean) return null;
    const lower = clean.toLowerCase();

    const inParticle = PARTICLE_CATALOG.find((p) => p.word === clean);
    if (inParticle) return { ...inParticle };

    const inKosoado = KOSOADO_CATALOG.find((k) => k.word === clean);
    if (inKosoado) return { ...inKosoado };

    const inTime = TIME_CATALOG.find((t) => t.word === clean);
    if (inTime) return { ...inTime };

    if (lower.includes('causativo pasivo') || lower.includes('causativo-pasivo') || clean.includes('させられる')) {
      return { ...GRAMMAR_QUICK_CATALOG.find((g) => g.grammarId === 'causative_passive') };
    }
    if (lower.includes('causativo') || clean === 'させる' || clean === '～させる') {
      return { ...GRAMMAR_QUICK_CATALOG.find((g) => g.grammarId === 'causative') };
    }
    if (lower.includes('pasivo') || clean === 'られる' || clean === '～られる') {
      return { ...GRAMMAR_QUICK_CATALOG.find((g) => g.grammarId === 'passive') };
    }
    if (lower.includes('volitivo') || clean === 'よう' || clean === '～よう' || clean === 'ましょう') {
      return { ...GRAMMAR_QUICK_CATALOG.find((g) => g.grammarId === 'volitional') };
    }
    if (lower.includes('intencional') || clean.includes('ようとする')) {
      return { ...GRAMMAR_QUICK_CATALOG.find((g) => g.grammarId === 'intentional') };
    }
    if (lower.includes('continuo') || clean === 'ている' || clean === '～ている') {
      return { ...GRAMMAR_QUICK_CATALOG.find((g) => g.grammarId === 'te_iru') };
    }
    if (lower.includes('desiderativo') || clean === 'たい' || clean === '～たい') {
      return { ...GRAMMAR_QUICK_CATALOG.find((g) => g.grammarId === 'tai') };
    }
    if (lower.includes('potencial') || lower === 'poder') {
      return { ...GRAMMAR_QUICK_CATALOG.find((g) => g.grammarId === 'potential') };
    }
    if (lower.includes('imperativo')) {
      return { ...GRAMMAR_QUICK_CATALOG.find((g) => g.grammarId === 'imperative') };
    }
    if (clean === 'たら' || clean === '～たら' || lower.includes('condicional')) {
      return { ...GRAMMAR_QUICK_CATALOG.find((g) => g.grammarId === 'cond_tara') };
    }

    if (BUILTIN_LEXICON[clean]) {
      return { word: clean, ...BUILTIN_LEXICON[clean] };
    }

    if (clean.endsWith('する') || clean === '来る') {
      return {
        word: clean,
        reading: clean,
        meaning: `Verbo (${clean})`,
        folder: '不規則動詞 · Verbos Irregulares (G3)',
        role: 'verb_g3',
        notes: 'Verbo compuesto con する / irregular.'
      };
    }

    if (clean.endsWith('い') && clean.length >= 2 && !['嫌い', '綺麗', '有名'].includes(clean)) {
      return {
        word: clean,
        reading: clean,
        meaning: `Adjetivo -い (${clean})`,
        folder: 'い形容詞 · Adjetivos -い',
        role: 'adj_i',
        notes: 'Adjetivo terminado en い.'
      };
    }

    const verbEndings = ['う', 'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む', 'る'];
    const lastChar = clean.slice(-1);
    if (clean.length >= 2 && verbEndings.includes(lastChar)) {
      const ichidanSounds = ['い', 'き', 'ぎ', 'し', 'じ', 'ち', 'に', 'ひ', 'び', 'み', 'り', 'え', 'け', 'げ', 'せ', 'ぜ', 'て', 'で', 'ね', 'へ', 'べ', 'め', 'れ'];
      const beforeRu = clean.slice(-2, -1);
      if (lastChar === 'る' && ichidanSounds.includes(beforeRu)) {
        return {
          word: clean,
          reading: clean,
          meaning: `Verbo (${clean})`,
          folder: '一段動詞 · Verbos Ichidan (G2)',
          role: 'verb_g2',
          notes: 'Verbo Ichidan (Grupo 2).'
        };
      }
      return {
        word: clean,
        reading: clean,
        meaning: `Verbo (${clean})`,
        folder: '五段動詞 · Verbos Godan (G1)',
        role: 'verb_g1',
        notes: `Verbo Godan (Grupo 1) terminado en ${lastChar}.`
      };
    }

    return {
      word: clean,
      reading: clean,
      meaning: `Sustantivo (${clean})`,
      folder: '名詞 · Sustantivos',
      role: 'noun',
      notes: 'Sustantivo registrado en tu inventario.'
    };
  };

  const handleAnalyzeAndAddBatch = (e) => {
    if (e) e.preventDefault();
    if (!rawBatchInput.trim()) return;

    const rawTokens = rawBatchInput
      .split(/[,、\n\t;]+|\s{2,}/)
      .flatMap((chunk) => chunk.trim().split(/\s+/))
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawTokens.length === 0) return;

    let addedCount = 0;
    setInventory((prev) => {
      const existingWords = new Set(prev.map((item) => item.word));
      const newEntries = [...prev];

      rawTokens.forEach((tok) => {
        const classified = classifySingleTerm(tok);
        if (classified && !existingWords.has(classified.word)) {
          existingWords.add(classified.word);
          newEntries.push({
            ...classified,
            id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
          });
          addedCount++;
        }
      });

      return newEntries;
    });

    setRawBatchInput('');
    setLivePreviewInventoryBanner('');
    showToast(
      addedCount > 0
        ? `Se clasificaron ${addedCount} término(s) en sus carpetas.`
        : 'Esos términos ya estaban en tu inventario.'
    );
  };

  const toggleCatalogItemInInventory = (catalogItem) => {
    const exists = inventory.some((i) => i.word === catalogItem.word);
    if (exists) {
      setInventory((prev) => prev.filter((i) => i.word !== catalogItem.word));
      showToast(`Quitado: ${catalogItem.word}`);
    } else {
      setInventory((prev) => [
        ...prev,
        {
          ...catalogItem,
          id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        }
      ]);
      showToast(`Agregado a ${catalogItem.folder}: ${catalogItem.word}`);
    }
  };

  const groupedFolders = useMemo(() => {
    const filtered = inventory.filter((item) => {
      if (!inventorySearch.trim()) return true;
      const q = inventorySearch.toLowerCase();
      return (
        item.word.toLowerCase().includes(q) ||
        item.reading.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        item.folder.toLowerCase().includes(q)
      );
    });

    const groups = {};
    filtered.forEach((item) => {
      if (!groups[item.folder]) groups[item.folder] = [];
      groups[item.folder].push(item);
    });

    return Object.entries(groups);
  }, [inventory, inventorySearch]);

  const stats = useMemo(() => {
    const particles = inventory.filter((i) => i.role === 'particle').length;
    const grammarUses = inventory.filter((i) => i.role === 'grammar').length;
    const words = inventory.length - particles - grammarUses;
    const folders = new Set(inventory.map((i) => i.folder)).size;
    return { words, particles, grammarUses, folders };
  }, [inventory]);

  // ============================================================================
  // 10. GENERADOR DE CIRCUITO 100% CERRADO (DESGLOSE ESTRUCTURAL ESTRICTO)
  // ============================================================================

  const handleGenerateClosedSentences = () => {
    const pronouns = inventory.filter((i) => i.role === 'pronoun');
    const nouns = inventory.filter((i) => i.role === 'noun');
    const prenominals = inventory.filter((i) => i.role === 'prenominal');
    const timeMarkers = inventory.filter((i) => i.role === 'time');
    const verbs = inventory.filter((i) => i.role?.startsWith('verb_'));
    const adjI = inventory.filter((i) => i.role === 'adj_i');
    const adjNa = inventory.filter((i) => i.role === 'adj_na');
    const particlesSet = new Set(inventory.filter((i) => i.role === 'particle').map((i) => i.word));
    const registeredGrammar = inventory.filter((i) => i.role === 'grammar' && i.grammarId);

    const allNominals = [...nouns, ...pronouns];

    if (allNominals.length === 0 && verbs.length === 0 && adjI.length === 0 && adjNa.length === 0) {
      setGeneratedResults({
        error: true,
        title: 'Tu inventario necesita palabras base para armar oraciones',
        detail: 'Agregá al menos un sustantivo/pronombre y un verbo o adjetivo en la pestaña "Inventario".'
      });
      return;
    }

    if (particlesSet.size === 0) {
      setGeneratedResults({
        error: true,
        title: 'Faltan partículas en tu inventario',
        detail: 'Tocá "+助詞 (Partículas)" en la pestaña Inventario para activar partículas como は, を, の o が.'
      });
      return;
    }

    let activeGrammarList = ['base'];
    if (generatorMode === 'inventory_logic') {
      activeGrammarList = registeredGrammar.length > 0 ? registeredGrammar.map((g) => g.grammarId) : ['base'];
    } else {
      activeGrammarList = selectedGrammarIds.length > 0 ? selectedGrammarIds : ['base'];
    }

    const sentences = [];
    const isFormal = formality === 'formal';
    const isNegative = polarityTense.includes('neg');
    const isPast = polarityTense.includes('past');
    const isQuestion = polarityTense === 'question';
    const qParticle = isQuestion ? 'か' : '';

    for (let idx = 0; idx < sentenceCount; idx++) {
      const grammarId = activeGrammarList[idx % activeGrammarList.length];
      const grammarMeta = ALL_GRAMMAR_MAP[grammarId] || ALL_GRAMMAR_MAP.base;

      const subject = pronouns.length > 0 ? pronouns[idx % pronouns.length] : allNominals[idx % allNominals.length];
      const objectNoun = nouns.length > 0 ? nouns[(idx + 1) % nouns.length] : allNominals[(idx + 1) % allNominals.length];
      const timeWord = timeMarkers.length > 0 ? timeMarkers[idx % timeMarkers.length] : null;
      const prenominal = prenominals.length > 0 ? prenominals[idx % prenominals.length] : null;

      if (verbs.length > 0 && (particlesSet.has('を') || particlesSet.has('は') || particlesSet.has('が'))) {
        const verb = verbs[idx % verbs.length];
        const conj = conjugateJapaneseVerb(verb, grammarId, formality, polarityTense);

        const tokens = [];
        const jpParts = [];
        const readingParts = [];
        const literalParts = [];
        let esTimePrefix = '';

        if (timeWord) {
          jpParts.push(timeWord.word + '、');
          readingParts.push(timeWord.reading.split(' ')[0]);
          literalParts.push(`[${timeWord.word}: ${timeWord.meaning}]`);
          esTimePrefix = `${timeWord.meaning}, `;
          tokens.push({
            surface: timeWord.word,
            role: 'Marcador Temporal',
            detail: `${timeWord.meaning} (${timeWord.folder})`
          });
        }

        const topicParticle = particlesSet.has('は') ? 'は' : particlesSet.has('が') ? 'が' : '';
        if (subject && topicParticle) {
          jpParts.push(`${subject.word}${topicParticle}`);
          readingParts.push(`${subject.reading.split(' ')[0]}${topicParticle}`);
          literalParts.push(`[${subject.word} + ${topicParticle}: tema/sujeto "${subject.meaning}"]`);
          tokens.push({
            surface: `${subject.word}${topicParticle}`,
            role: `Sustantivo/Pronombre + Partícula ${topicParticle}`,
            detail: `${subject.word} (${subject.meaning}) + ${topicParticle} (${
              topicParticle === 'は' ? 'marca el tema' : 'identifica el sujeto'
            }).`
          });
        }

        let esObjectPhrase = '';
        if (objectNoun && particlesSet.has('を')) {
          if (prenominal) {
            jpParts.push(`${prenominal.word}${objectNoun.word}を`);
            readingParts.push(`${prenominal.reading} ${objectNoun.reading.split(' ')[0]}を`);
            esObjectPhrase = `${prenominal.meaning.replace('(+ Sustantivo)', '').trim().toLowerCase()} ${objectNoun.meaning.toLowerCase()}`;
            literalParts.push(`[${prenominal.word}${objectNoun.word} + を: objeto directo]`);
            tokens.push({
              surface: `${prenominal.word}${objectNoun.word}を`,
              role: 'Prenominal + Sustantivo + Partícula を',
              detail: `${prenominal.word} modifica directamente a ${objectNoun.word}; を marca el objeto directo.`
            });
          } else if (particlesSet.has('の') && pronouns.length > 0 && idx % 2 === 1) {
            const owner = pronouns[0];
            jpParts.push(`${owner.word}の${objectNoun.word}を`);
            readingParts.push(`${owner.reading.split(' ')[0]}の${objectNoun.reading.split(' ')[0]}を`);
            esObjectPhrase =
              owner.word === '私' || owner.word === '僕'
                ? `mi ${objectNoun.meaning.toLowerCase()}`
                : `el/la ${objectNoun.meaning.toLowerCase()} de ${owner.meaning.toLowerCase()}`;
            literalParts.push(`[${owner.word}の${objectNoun.word} + を: posesión + objeto directo]`);
            tokens.push({
              surface: `${owner.word}の${objectNoun.word}を`,
              role: 'Posesión con の + Objeto Directo を',
              detail: `${owner.word} (${owner.meaning}) + の (posesión) → ${owner.word}の = mi; ${objectNoun.word} (${objectNoun.meaning}) + を (objeto directo).`
            });
          } else {
            jpParts.push(`${objectNoun.word}を`);
            readingParts.push(`${objectNoun.reading.split(' ')[0]}を`);
            esObjectPhrase = `el/la ${objectNoun.meaning.toLowerCase()}`;
            literalParts.push(`[${objectNoun.word} + を: objeto directo "${objectNoun.meaning}"]`);
            tokens.push({
              surface: `${objectNoun.word}を`,
              role: 'Objeto Directo + Partícula を',
              detail: `${objectNoun.word} (${objectNoun.meaning}) recibe la acción del verbo ${verb.word}.`
            });
          }
        }

        jpParts.push(`${conj.surface}。`);
        readingParts.push(conj.surface);
        literalParts.push(`[${conj.surface}: ${verb.meaning} (${grammarMeta.name})]`);
        tokens.push({
          surface: conj.surface,
          role: `Verbo Conjugado (${grammarMeta.name})`,
          detail: conj.formula
        });

        const subjEs = subject ? subject.meaning : 'El sujeto';
        const actionEs = conj.esTransform(verb.meaning);
        const naturalEs = `${esTimePrefix}${subjEs} ${actionEs}${esObjectPhrase ? ' ' + esObjectPhrase : ''}${
          isQuestion ? '?' : '.'
        }`;

        sentences.push({
          id: `gen-${Date.now()}-${idx}`,
          japanese: jpParts.join(''),
          reading: readingParts.join(' · '),
          literalTranslation: literalParts.join(' → '),
          translation: naturalEs.charAt(0).toUpperCase() + naturalEs.slice(1),
          level: deducedLevelFilter !== 'AUTO' ? deducedLevelFilter : grammarMeta.level,
          grammarName: grammarMeta.name,
          formula: conj.formula,
          formalityLabel: isFormal ? 'Formal (丁寧語)' : 'Informal (普通形)',
          tokens
        });
        continue;
      }

      if ((adjI.length > 0 || adjNa.length > 0) && (particlesSet.has('は') || particlesSet.has('が'))) {
        const allAdjs = [...adjI, ...adjNa];
        const adj = allAdjs[idx % allAdjs.length];
        const pTopic = particlesSet.has('は') ? 'は' : 'が';
        const targetNoun = objectNoun || subject;

        let subjectBlockJp = `${targetNoun.word}${pTopic}`;
        let subjectBlockEs = `El/La ${targetNoun.meaning.toLowerCase()}`;

        if (prenominal) {
          subjectBlockJp = `${prenominal.word}${targetNoun.word}${pTopic}`;
          subjectBlockEs = `${prenominal.meaning.replace('(+ Sustantivo)', '').trim()} ${targetNoun.meaning.toLowerCase()}`;
        } else if (particlesSet.has('の') && pronouns.length > 0) {
          const owner = pronouns[0];
          subjectBlockJp = `${owner.word}の${targetNoun.word}${pTopic}`;
          subjectBlockEs =
            owner.word === '私' || owner.word === '僕'
              ? `Mi ${targetNoun.meaning.toLowerCase()}`
              : `El/La ${targetNoun.meaning.toLowerCase()} de ${owner.meaning.toLowerCase()}`;
        }

        let predJp = '';
        let formulaStr = '';
        if (adj.role === 'adj_i') {
          const stem = adj.word.slice(0, -1);
          if (!isPast && !isNegative) predJp = isFormal ? `${adj.word}です` : adj.word;
          else if (!isPast && isNegative) predJp = isFormal ? `${stem}くないです` : `${stem}くない`;
          else if (isPast && !isNegative) predJp = isFormal ? `${stem}かったです` : `${stem}かった`;
          else predJp = isFormal ? `${stem}くなかったです` : `${stem}くなかった`;
          formulaStr = `${adj.word} (Adjetivo -い) → ${predJp}`;
        } else {
          if (!isPast && !isNegative) predJp = isFormal ? `${adj.word}です` : `${adj.word}だ`;
          else if (!isPast && isNegative) predJp = isFormal ? `${adj.word}ではありません` : `${adj.word}ではない`;
          else if (isPast && !isNegative) predJp = isFormal ? `${adj.word}でした` : `${adj.word}だった`;
          else predJp = isFormal ? `${adj.word}ではありませんでした` : `${adj.word}ではなかった`;
          formulaStr = `${adj.word} (Adjetivo -な) → ${predJp}`;
        }

        const fullJp = `${subjectBlockJp}${predJp}${qParticle}。`;
        const copulaEs = isNegative ? (isPast ? 'no era' : 'no es') : isPast ? 'era' : 'es';

        sentences.push({
          id: `gen-adj-${Date.now()}-${idx}`,
          japanese: fullJp,
          reading: `${subjectBlockJp} · ${adj.reading.split(' ')[0]}`,
          literalTranslation: `[${subjectBlockJp}: ${subjectBlockEs}] → [${predJp}: ${copulaEs} ${adj.meaning.toLowerCase()}]`,
          translation: `${isQuestion ? '¿' : ''}${subjectBlockEs} ${copulaEs} ${adj.meaning.toLowerCase()}${
            isQuestion ? '?' : '.'
          }`,
          level: 'N5',
          grammarName: 'Predicado Adjetival',
          formula: formulaStr,
          formalityLabel: isFormal ? 'Formal (です)' : 'Informal',
          tokens: [
            { surface: subjectBlockJp, role: `Tema/Sujeto + ${pTopic}`, detail: `${subjectBlockEs} marcado con ${pTopic}.` },
            { surface: `${predJp}${qParticle}`, role: 'Adjetivo Conjugado', detail: formulaStr }
          ]
        });
        continue;
      }

      if (allNominals.length >= 2 && (particlesSet.has('の') || particlesSet.has('は'))) {
        const n1 = pronouns[0] || allNominals[0];
        const n2 = nouns[0] || allNominals[1];
        const copula = isFormal
          ? isPast
            ? 'でした'
            : isNegative
            ? 'ではありません'
            : 'です'
          : isPast
          ? 'だった'
          : isNegative
          ? 'ではない'
          : 'だ';

        const jp = particlesSet.has('の')
          ? `${n1.word}の${n2.word}${copula}${qParticle}。`
          : `${n1.word}は${n2.word}${copula}${qParticle}。`;

        const esPossessive =
          n1.word === '私' || n1.word === '僕'
            ? `Es mi ${n2.meaning.toLowerCase()}.`
            : `Es el/la ${n2.meaning.toLowerCase()} de ${n1.meaning.toLowerCase()}.`;

        sentences.push({
          id: `gen-nom-${Date.now()}-${idx}`,
          japanese: jp,
          reading: `${n1.reading.split(' ')[0]} · ${n2.reading.split(' ')[0]}`,
          literalTranslation: `[${n1.word}: ${n1.meaning}] + [${particlesSet.has('の') ? 'の' : 'は'}] + [${n2.word}${copula}: ${n2.meaning}]`,
          translation: esPossessive,
          level: 'N5',
          grammarName: 'Estructura Nominal Cerrada',
          formula: `${n1.word} + の + ${n2.word} + ${copula}`,
          formalityLabel: isFormal ? 'Formal (です)' : 'Informal (だ)',
          tokens: [
            { surface: n1.word, role: n1.folder, detail: n1.meaning },
            { surface: particlesSet.has('の') ? 'の' : 'は', role: 'Partícula', detail: 'Conecta estructuralmente los sustantivos.' },
            { surface: `${n2.word}${copula}`, role: 'Sustantivo + Cópula', detail: n2.meaning }
          ]
        });
      }
    }

    if (sentences.length === 0) {
      setGeneratedResults({
        error: true,
        title: 'Combinación incompleta en circuito cerrado',
        detail: 'Activá las partículas は, を, が o の desde "+助詞" para conectar tus palabras.'
      });
    } else {
      setGeneratedResults({ error: false, items: sentences });
    }
  };

  // ============================================================================
  // 11. AUDITOR DE LA SALA DE PRÁCTICA LIBRE (N5 A N1)
  // ============================================================================

  const handleAuditFreePractice = (e) => {
    if (e) e.preventDefault();
    const raw = freeInputSentence.trim();
    if (!raw) {
      showToast('Escribe primero una palabra u oración en japonés.');
      return;
    }

    if (!containsJapaneseScript(raw) || containsLatinLetters(raw)) {
      const warnMsg =
        'Este espacio es solo para escribir en japonés (hiragana, katakana o kanji).';
      setPracticeJpWarning(warnMsg);
      setFreeAuditResult(null);
      showToast(warnMsg);
      return;
    }
    setPracticeJpWarning('');

    if (freeInputMeaning.trim() && containsJapaneseScript(freeInputMeaning)) {
      const esWarn =
        'La casilla inferior es solo para escribir tu traducción en español, no en japonés.';
      setPracticeEsWarning(esWarn);
      showToast(esWarn);
      return;
    }
    setPracticeEsWarning('');

    const cleanNoPunct = raw.replace(/[。！？!?.]/g, '').trim();

    if (COMMON_JAPANESE_EXPRESSIONS[cleanNoPunct]) {
      const expr = COMMON_JAPANESE_EXPRESSIONS[cleanNoPunct];
      setFreeAuditResult({
        score: '10/10',
        isValid: true,
        level: expr.level,
        verifiedSentence: raw,
        reading: expr.reading,
        translation: freeInputMeaning.trim() || expr.translation,
        feedback: expr.feedback,
        tokens: expr.tokens
      });
      return;
    }

    const prenominalErrorMatch = cleanNoPunct.match(/(この|その|あの|どの)(は|が|を|に|で|も|へ)/);
    if (prenominalErrorMatch) {
      const wrongPre = prenominalErrorMatch[1];
      const particleUsed = prenominalErrorMatch[2];
      const replacementMap = { 'この': 'これ', 'その': 'それ', 'あの': 'あれ', 'どの': 'どれ' };
      const suggestedPronoun = replacementMap[wrongPre] || 'これ';
      const corrected = raw.replace(`${wrongPre}${particleUsed}`, `${suggestedPronoun}${particleUsed}`);

      setFreeAuditResult({
        score: '6/10 · Corrección de Prenominal',
        isValid: false,
        level: 'N5',
        verifiedSentence: corrected,
        reading: corrected,
        translation: freeInputMeaning.trim() || 'Oración con demostrativo corregido',
        feedback: `"${wrongPre}" es un prenominal (連体詞) y exige obligatoriamente un sustantivo justo después (ej: ${wrongPre}車${particleUsed}). Para usarlo antes de la partícula "${particleUsed}" sin sustantivo, debés usar el pronombre "${suggestedPronoun}${particleUsed}".`,
        tokens: [
          { surface: suggestedPronoun, role: 'Pronombre Demostrativo (指示代名詞)', detail: `Sustituye a ${wrongPre} cuando va seguido directamente de partícula.` },
          { surface: particleUsed, role: 'Partícula (助詞)', detail: 'Se conecta directamente al pronombre.' }
        ]
      });
      return;
    }

    const detectedTokens = [];
    const allKnown = [
      ...KOSOADO_CATALOG,
      ...TIME_CATALOG,
      ...Object.entries(BUILTIN_LEXICON).map(([word, data]) => ({ word, ...data })),
      ...PARTICLE_CATALOG
    ];

    allKnown.forEach((entry) => {
      if (raw.includes(entry.word)) {
        detectedTokens.push({
          surface: entry.word,
          role: entry.folder,
          detail: `${entry.meaning} — ${entry.notes}`
        });
      }
    });

    let detectedLevel = 'N5';
    if (raw.includes('にほかならない')) detectedLevel = 'N1';
    else if (raw.includes('ざるを得ない')) detectedLevel = 'N2';
    else if (raw.includes('べき') || raw.includes('に違いない') || raw.includes('おかげで')) detectedLevel = 'N3';
    else if (raw.includes('させる') || raw.includes('られる') || raw.includes('たら') || raw.includes('よう')) detectedLevel = 'N4';

    const localMeaning = resolveLocalTranslation(cleanNoPunct, 'es');

    setFreeAuditResult({
      score: '10/10',
      isValid: true,
      level: detectedLevel,
      verifiedSentence: raw,
      reading: raw,
      translation:
        freeInputMeaning.trim() ||
        (localMeaning && !containsJapaneseChars(localMeaning)
          ? localMeaning
          : 'Oración verificada en diccionario abierto N5–N1'),
      feedback: 'Estructura sintáctica verificada en la Sala de Práctica Libre (diccionario completo N5 a N1).',
      tokens:
        detectedTokens.length > 0
          ? detectedTokens.slice(0, 6)
          : [{ surface: raw, role: `Oración Libre (${detectedLevel})`, detail: 'Analizada en modo abierto N5–N1.' }]
    });
  };

  // ============================================================================
  // 12. EXPORTAR E IMPORTAR RESPALDO JSON
  // ============================================================================

  const handleExportJSON = () => {
    const payload = {
      app: 'MI JAPONÉS N5–N1',
      version: 'v1.0',
      exportedAt: new Date().toISOString(),
      username: username || '',
      inventory,
      savedSentences
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mi_japones_n5_n1_respaldo.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Respaldo JSON descargado.');
  };

  const handleImportJSONFile = (e, fromWelcome = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed.inventory)) setInventory(parsed.inventory);
        if (Array.isArray(parsed.savedSentences)) setSavedSentences(parsed.savedSentences);
        if (typeof parsed.username === 'string' && parsed.username.trim()) {
          const check = validateUsernameProfanity(parsed.username);
          if (check.valid) {
            const cleanRestored = parsed.username.trim();
            setUsername(cleanRestored);
            try {
              localStorage.setItem('mijapones_username_v1', cleanRestored);
              localStorage.setItem('mijapones_username_v2', cleanRestored);
            } catch {
              // Ignorar
            }
          }
        }
        setBackupModalOpen(false);
        if (fromWelcome) closeTutorialAndRemember();
        showToast('¡Copia de seguridad JSON restaurada!');
      } catch {
        showToast('El archivo seleccionado no es un JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const toggleSaveSentence = (sentenceObj) => {
    const exists = savedSentences.some((s) => s.japanese === sentenceObj.japanese);
    if (exists) {
      setSavedSentences((prev) => prev.filter((s) => s.japanese !== sentenceObj.japanese));
      showToast('Oración quitada de Guardadas.');
    } else {
      setSavedSentences((prev) => [
        {
          ...sentenceObj,
          savedAt: new Date().toLocaleDateString()
        },
        ...prev
      ]);
      showToast('Oración guardada.');
    }
  };

  const isTargetHighlighted = (id) =>
    activeTutorialStep && activeTutorialStep.targetId === id
      ? 'ring-2 ring-indigo-400/90 shadow-[0_0_25px_rgba(99,102,241,0.28)] rounded-2xl transition-all duration-300'
      : '';

  const currentMotivationalObj =
    RETURNING_MOTIVATIONAL_MESSAGES[
      motivationalIndex % RETURNING_MOTIVATIONAL_MESSAGES.length
    ];

  const activeTabIndex = Math.max(0, TAB_ORDER.indexOf(activeTab));

  const renderTabPanel = (tabKey, isExiting = false) => {
    const tourId = (id) => (isExiting ? undefined : id);
    const tourHighlight = (id) => (isExiting ? '' : isTargetHighlighted(id));
    const tourBubble = (id) => (isExiting ? null : renderInlineTourPointerBubble(id));

    return (
      <>
        {/* --------------------------------------------------------------------
            PESTAÑA 1: INVENTARIO (SIN BOTÓN DE PACK INICIAL)
        -------------------------------------------------------------------- */}
        {tabKey === 'inventory' && (
          <div className="space-y-4">
            {/* CAJA DE INGRESO Y CLASIFICACIÓN AUTOMÁTICA */}
            <section
              id={tourId('tour-input-box')}
              className={`bg-[#101624] border border-slate-800 rounded-3xl p-4 space-y-3 shadow-lg ${tourHighlight(
                'tour-input-box'
              )}`}
            >
              <div>
                <h2 className="font-extrabold text-sm sm:text-base text-white">
                  Ingresar Vocabulario, Partículas o Usos Gramaticales
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Escribí o pegá 1 palabra o un lote de 80+ términos (ej:{' '}
                  <span className="text-indigo-300 font-bold">
                    私, 車, 食べる, は, を, ている, causativo
                  </span>
                  ). Usá las bocinas para escuchar lo que escribiste antes de clasificarlo.
                </p>
              </div>

              {livePreviewInventoryBanner && (
                <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-sky-500/40 rounded-xl px-3 py-2 text-xs text-sky-200 font-semibold">
                  <span>{livePreviewInventoryBanner}</span>
                  <button
                    type="button"
                    onClick={() => setLivePreviewInventoryBanner('')}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-bold text-slate-400">
                  Escuchar en japonés o su traducción al español:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speakText(rawBatchInput, 'ja', 'inv-input-ja', 'inventory')}
                    className={`px-3 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition ${
                      speakingId === 'inv-input-ja'
                        ? 'bg-teal-600 text-white border-teal-400'
                        : 'bg-slate-900 hover:bg-slate-800 border-teal-500/40 text-teal-300'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Leer en JP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => speakText(rawBatchInput, 'es', 'inv-input-es', 'inventory')}
                    className={`px-3 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition ${
                      speakingId === 'inv-input-es'
                        ? 'bg-sky-600 text-white border-sky-400'
                        : 'bg-slate-900 hover:bg-slate-800 border-sky-500/40 text-sky-300'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Leer en ES</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleAnalyzeAndAddBatch} className="space-y-3">
                <textarea
                  rows={3}
                  value={rawBatchInput}
                  onChange={(e) => setRawBatchInput(e.target.value)}
                  placeholder="Pegá tus palabras, partículas o usos gramaticales (ej: 私, 車, 食べる, 飲む, 高い, この, 今日, は, を, の, ている, causativo)..."
                  className="w-full bg-[#090d16] border border-slate-800 focus:border-indigo-400 rounded-2xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none leading-relaxed"
                />

                {/* CATÁLOGOS DE 1 TOQUE */}
                <div
                  id={tourId('tour-quick-catalogs')}
                  className={`flex items-center gap-1.5 flex-wrap pt-0.5 ${tourHighlight(
                    'tour-quick-catalogs'
                  )}`}
                >
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">
                    Catálogos de 1 toque:
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuickCatalogModal('particles')}
                    className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 text-[11px] font-bold transition"
                  >
                    +助詞 (Partículas)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCatalogModal('kosoado')}
                    className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-bold transition"
                  >
                    +こそあど
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCatalogModal('time')}
                    className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-teal-300 text-[11px] font-bold transition"
                  >
                    +時間 (Tiempo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCatalogModal('grammar')}
                    className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-bold transition"
                  >
                    +文法 (Gramática)
                  </button>
                </div>

                {tourBubble('tour-quick-catalogs')}

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Analizar y Clasificar Automáticamente</span>
                </button>
              </form>

              {tourBubble('tour-input-box')}
            </section>

            {/* CARPETAS DINÁMICAS DEL INVENTARIO */}
            <section
              id={tourId('tour-folders')}
              className={`space-y-3 ${tourHighlight('tour-folders')}`}
            >
              {inventory.length > 0 && (
                <div className="flex items-center justify-between gap-2 bg-[#101624] border border-slate-800 rounded-2xl px-3.5 py-2.5">
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="Buscar palabra, lectura o carpeta en tu inventario..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  {inventorySearch && (
                    <button
                      type="button"
                      onClick={() => setInventorySearch('')}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {inventory.length === 0 ? (
                <div className="bg-[#101624] border border-slate-800 rounded-3xl p-7 text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto text-indigo-400">
                    <Folder className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    {username
                      ? `Todavía no tenés palabras cargadas, ${username}`
                      : 'Todavía no tenés palabras cargadas'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Esta sección es exclusivamente para lo que vos ya aprendiste. Ingresá tus
                    propias palabras y partículas arriba o activalas desde los catálogos rápidos
                    para que el sistema cree cada carpeta gramatical a tu medida.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {groupedFolders.map(([folderName, items]) => {
                    const isCollapsed = !!collapsedFolders[folderName];
                    return (
                      <div
                        key={folderName}
                        className="bg-[#101624] border border-slate-800 rounded-2xl overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedFolders((prev) => ({
                              ...prev,
                              [folderName]: !prev[folderName]
                            }))
                          }
                          className="w-full px-4 py-3 flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 transition text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span className="font-extrabold text-xs sm:text-sm text-white truncate">
                              {folderName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 text-[10px] font-bold">
                              {items.length}
                            </span>
                          </div>
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {!isCollapsed && (
                          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="bg-[#090d16] border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between gap-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-black text-base text-white">
                                        {item.word}
                                      </span>
                                      <span className="text-[11px] text-indigo-300 font-semibold">
                                        {item.reading}
                                      </span>
                                    </div>
                                    <p className="text-xs font-bold text-teal-300 mt-0.5">
                                      {item.meaning}
                                    </p>
                                    {item.notes && (
                                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                                        {item.notes}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        speakText(item.word, 'ja', `item-ja-${item.id}`)
                                      }
                                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-teal-300 text-[10px] font-bold"
                                      title="Escuchar en japonés"
                                    >
                                      JP
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        speakText(item.meaning, 'es', `item-es-${item.id}`)
                                      }
                                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 text-[10px] font-bold"
                                      title="Escuchar significado en español"
                                    >
                                      ES
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setInventory((prev) =>
                                          prev.filter((x) => x.id !== item.id)
                                        )
                                      }
                                      className="p-1 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-800 text-slate-400 hover:text-rose-300"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {tourBubble('tour-folders')}
            </section>
          </div>
        )}

        {/* --------------------------------------------------------------------
            PESTAÑA 2: GENERADOR DE ORACIONES (100% CERRADO N5 A N1)
        -------------------------------------------------------------------- */}
        {tabKey === 'generator' && (
          <div className="space-y-4">
            <section
              id={tourId('tour-gen-modes')}
              className={`bg-[#101624] border border-slate-800 rounded-3xl p-4 space-y-3 shadow-lg ${tourHighlight(
                'tour-gen-modes'
              )}`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base text-white">
                    Generador Estructural de Circuito Cerrado (N5–N1)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Construye oraciones combinando únicamente el vocabulario y partículas de tu
                    inventario.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGeneratorMode('inventory_logic')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    generatorMode === 'inventory_logic'
                      ? 'bg-indigo-600/20 border-indigo-400 text-white'
                      : 'bg-[#090d16] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-extrabold text-xs block text-white">
                    1. Según mi Inventario (Automático)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Deduce las estructuras según los usos y partículas que ya cargaste.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGeneratorMode('manual_grammar')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    generatorMode === 'manual_grammar'
                      ? 'bg-sky-600/20 border-sky-400 text-white'
                      : 'bg-[#090d16] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-extrabold text-xs block text-white">
                    2. Elegir Usos Gramaticales (9 Categorías)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Seleccioná manualmente las reglas de N5 a N1 que querés practicar.
                  </span>
                </button>
              </div>

              {tourBubble('tour-gen-modes')}
            </section>

            {/* PANEL DE LAS 9 CATEGORÍAS Y CONTROLES DE FORMALIDAD / TIEMPO */}
            <section
              id={tourId('tour-gen-categories')}
              className={`bg-[#101624] border border-slate-800 rounded-3xl p-4 space-y-3 shadow-lg ${tourHighlight(
                'tour-gen-categories'
              )}`}
            >
              {generatorMode === 'manual_grammar' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-extrabold text-white">
                      Seleccioná entre las 9 Categorías Gramaticales (N5–N1):
                    </span>
                    <div className="flex items-center gap-1">
                      {['ALL', 'N5', 'N4', 'N3', 'N2', 'N1'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setGrammarLevelFilter(lvl)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                            grammarLevelFilter === lvl
                              ? 'bg-indigo-600 border-indigo-400 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {lvl === 'ALL' ? 'Todos' : lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {GRAMMAR_CATEGORIES.map((cat) => {
                      const visibleItems = cat.items.filter((item) => {
                        if (grammarLevelFilter !== 'ALL' && item.level !== grammarLevelFilter)
                          return false;
                        if (!grammarSearch.trim()) return true;
                        const q = grammarSearch.toLowerCase();
                        return (
                          item.name.toLowerCase().includes(q) ||
                          item.formula.toLowerCase().includes(q) ||
                          item.desc.toLowerCase().includes(q)
                        );
                      });
                      if (visibleItems.length === 0) return null;
                      const isOpen = !!openCategories[cat.id];

                      return (
                        <div
                          key={cat.id}
                          className="bg-[#090d16] border border-slate-800 rounded-2xl overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenCategories((prev) => ({
                                ...prev,
                                [cat.id]: !prev[cat.id]
                              }))
                            }
                            className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-900/70 transition"
                          >
                            <div>
                              <span className="font-extrabold text-xs text-white">
                                {cat.number}. {cat.title}
                              </span>
                              <p className="text-[10px] text-slate-400">{cat.subtitle}</p>
                            </div>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                          </button>

                          {isOpen && (
                            <div className="p-2.5 pt-0 space-y-1.5">
                              {visibleItems.map((gItem) => {
                                const isChecked = selectedGrammarIds.includes(gItem.id);
                                return (
                                  <button
                                    key={gItem.id}
                                    type="button"
                                    onClick={() =>
                                      setSelectedGrammarIds((prev) =>
                                        prev.includes(gItem.id)
                                          ? prev.length > 1
                                            ? prev.filter((x) => x !== gItem.id)
                                            : prev
                                          : [...prev, gItem.id]
                                      )
                                    }
                                    className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition ${
                                      isChecked
                                        ? 'bg-indigo-600/20 border-indigo-400 text-white'
                                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                                        isChecked
                                          ? 'bg-indigo-500 border-indigo-300 text-white'
                                          : 'border-slate-700 bg-slate-900'
                                      }`}
                                    >
                                      {isChecked && <Check className="w-3 h-3" />}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-sky-300 font-black text-[10px]">
                                          {gItem.level}
                                        </span>
                                        <span className="font-extrabold text-xs text-white">
                                          {gItem.name}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-indigo-300 font-semibold mt-0.5">
                                        {gItem.formula}
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">
                                        {gItem.desc}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Registro (Formal / Informal):
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-[#090d16] p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFormality('formal')}
                      className={`py-2 rounded-lg text-xs font-extrabold transition ${
                        formality === 'formal'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Formal (です・ます)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormality('informal')}
                      className={`py-2 rounded-lg text-xs font-extrabold transition ${
                        formality === 'informal'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Informal (普通形)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Tiempo y Polaridad:
                  </label>
                  <select
                    value={polarityTense}
                    onChange={(e) => setPolarityTense(e.target.value)}
                    className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="present_aff">Afirmativo (Presente / Futuro)</option>
                    <option value="present_neg">Negativo (Presente / Futuro)</option>
                    <option value="past_aff">Pasado Afirmativo</option>
                    <option value="past_neg">Pasado Negativo</option>
                    <option value="question">Interrogativo (Pregunta か)</option>
                  </select>
                </div>
              </div>

              {tourBubble('tour-gen-categories')}
            </section>

            {/* BOTÓN DE GENERACIÓN CERRADA */}
            <section
              id={tourId('tour-gen-button')}
              className={`bg-[#101624] border border-slate-800 rounded-3xl p-4 space-y-3 shadow-lg ${tourHighlight(
                'tour-gen-button'
              )}`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400">Cantidad:</span>
                  {[1, 3, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setSentenceCount(cnt)}
                      className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${
                        sentenceCount === cnt
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-[#090d16] border-slate-800 text-slate-400'
                      }`}
                    >
                      {cnt} {cnt === 1 ? 'oración' : 'oraciones'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowReadings((prev) => !prev)}
                  className="px-3 py-1 rounded-xl bg-[#090d16] border border-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span>{showReadings ? 'Ocultar Lectura' : 'Mostrar Lectura'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleGenerateClosedSentences}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Play className="w-4 h-4" />
                <span>Generar Oraciones (100% Cerrado)</span>
              </button>

              {tourBubble('tour-gen-button')}
            </section>

            {/* RESULTADOS DEL GENERADOR */}
            {generatedResults && (
              <div className="space-y-3">
                {generatedResults.error ? (
                  <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 space-y-1.5">
                    <h3 className="font-extrabold text-xs sm:text-sm text-rose-200 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{generatedResults.title}</span>
                    </h3>
                    <p className="text-xs text-slate-300">{generatedResults.detail}</p>
                  </div>
                ) : (
                  generatedResults.items.map((sent) => {
                    const isSaved = savedSentences.some((s) => s.japanese === sent.japanese);
                    return (
                      <div
                        key={sent.id}
                        className="bg-[#101624] border border-slate-800 rounded-3xl p-4 space-y-3 shadow-lg"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-black text-[10px]">
                              {sent.level}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 font-bold text-[10px]">
                              {sent.grammarName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {sent.formalityLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => speakText(sent.japanese, 'ja', `gen-ja-${sent.id}`)}
                              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-teal-500/40 text-teal-300 text-[11px] font-bold flex items-center gap-1"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>JP</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => speakText(sent.translation, 'es', `gen-es-${sent.id}`)}
                              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-sky-500/40 text-sky-300 text-[11px] font-bold flex items-center gap-1"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>ES</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSaveSentence(sent)}
                              className={`p-1.5 rounded-xl border transition ${
                                isSaved
                                  ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                              title="Guardar oración"
                            >
                              <Bookmark className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="bg-[#090d16] border border-slate-800/90 rounded-2xl p-3.5 space-y-1.5">
                          <p className="text-lg sm:text-xl font-black text-white tracking-wide">
                            {sent.japanese}
                          </p>
                          {showReadings && (
                            <p className="text-xs text-indigo-300 font-semibold">{sent.reading}</p>
                          )}
                          <p className="text-sm font-bold text-teal-300 pt-0.5">
                            {sent.translation}
                          </p>
                          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                            <b className="text-slate-300">Estructura literal:</b>{' '}
                            {sent.literalTranslation}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {sent.tokens.map((tok, tIdx) => (
                            <div
                              key={`${sent.id}-tok-${tIdx}`}
                              className="bg-[#090d16] border border-slate-800/80 rounded-xl p-2.5"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-black text-xs text-white">{tok.surface}</span>
                                <span className="text-[10px] font-bold text-sky-300">
                                  {tok.role}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                                {tok.detail}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------------------
            PESTAÑA 3: SALA DE PRÁCTICA LIBRE (BOCINAS INDEPENDIENTES + AUDITOR)
        -------------------------------------------------------------------- */}
        {tabKey === 'practice' && (
          <div className="space-y-4">
            <section
              id={tourId('tour-practice-room')}
              className={`bg-[#101624] border border-slate-800 rounded-3xl p-4 space-y-3.5 shadow-lg ${tourHighlight(
                'tour-practice-room'
              )}`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-teal-400 shrink-0" />
                  <h2 className="font-extrabold text-sm sm:text-base text-white">
                    {username
                      ? `Sala de Práctica Libre de ${username} (N5 a N1)`
                      : 'Sala de Práctica Libre (N5 a N1)'}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setBackupModalOpen(true)}
                  className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Respaldo JSON</span>
                </button>
              </div>

              {/* CHIPS DE APOYO PARA INSERTAR RÁPIDO */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'kosoado', label: 'こそあど' },
                    { id: 'time', label: 'Tiempo' },
                    { id: 'particles', label: 'Partículas' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPracticeTabChip(tab.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold border transition ${
                        practiceTabChip === tab.id
                          ? 'bg-teal-950/80 border-teal-400 text-teal-300'
                          : 'bg-[#090d16] border-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-2.5 flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto">
                  {(practiceTabChip === 'kosoado'
                    ? KOSOADO_CATALOG.slice(0, 8)
                    : practiceTabChip === 'time'
                    ? TIME_CATALOG.slice(0, 8)
                    : PARTICLE_CATALOG.slice(0, 10)
                  ).map((chip) => (
                    <button
                      key={chip.word}
                      type="button"
                      onClick={() => setFreeInputSentence((prev) => `${prev}${chip.word}`)}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-white font-bold flex items-center gap-1.5 transition"
                    >
                      <span>{chip.word}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {chip.meaning.split('/')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {livePreviewPracticeBanner && (
                <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-sky-500/40 rounded-xl px-3 py-2 text-xs text-sky-200 font-semibold">
                  <span>{livePreviewPracticeBanner}</span>
                  <button
                    type="button"
                    onClick={() => setLivePreviewPracticeBanner('')}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleAuditFreePractice} className="space-y-3">
                {/* CAJA 1: ORACIÓN EN JAPONÉS (SOLO LECTURA EN JAPONÉS) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-slate-300">
                      Tu oración o palabra en Japonés:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          speakText(freeInputSentence, 'ja', 'prac-jp-ja', 'practice', {
                            strictJapaneseOnly: true
                          })
                        }
                        className={`px-3 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition ${
                          speakingId === 'prac-jp-ja'
                            ? 'bg-teal-600 text-white border-teal-400'
                            : 'bg-slate-900 hover:bg-slate-800 border-teal-500/40 text-teal-300'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{speakingId === 'prac-jp-ja' ? 'Leyendo JP...' : 'Leer en JP'}</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={freeInputSentence}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFreeInputSentence(val);
                      if (practiceJpWarning && (!val.trim() || (containsJapaneseScript(val) && !containsLatinLetters(val)))) {
                        setPracticeJpWarning('');
                      }
                    }}
                    placeholder="Escribí cualquier oración o saludo en japonés (ej: こんにちは, おはよう, 私は車を買う)..."
                    className={`w-full bg-[#090d16] border rounded-2xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none ${
                      practiceJpWarning
                        ? 'border-amber-500/70 focus:border-amber-400'
                        : 'border-slate-800 focus:border-teal-400'
                    }`}
                  />

                  {practiceJpWarning && (
                    <div className="flex items-center gap-1.5 bg-amber-950/50 border border-amber-500/40 rounded-xl px-3 py-2 text-[11px] text-amber-200 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{practiceJpWarning}</span>
                    </div>
                  )}
                </div>

                {/* CAJA 2: SIGNIFICADO EN ESPAÑOL (SIN BOTONES DE TRADUCCIÓN NI AUDIO) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-slate-300">
                      Significado o traducción en Español:
                    </label>
                  </div>

                  <input
                    type="text"
                    value={freeInputMeaning}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFreeInputMeaning(val);
                      if (containsJapaneseScript(val)) {
                        setPracticeEsWarning(
                          'Este espacio es solo para escribir en español, no en japonés.'
                        );
                      } else {
                        setPracticeEsWarning('');
                      }
                    }}
                    placeholder="Opcional: ¿Qué quisiste decir en español?"
                    className={`w-full bg-[#090d16] border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none ${
                      practiceEsWarning
                        ? 'border-amber-500/70 focus:border-amber-400'
                        : 'border-slate-800 focus:border-teal-400'
                    }`}
                  />

                  {practiceEsWarning && (
                    <div className="flex items-center gap-1.5 bg-amber-950/50 border border-amber-500/40 rounded-xl px-3 py-2 text-[11px] text-amber-200 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{practiceEsWarning}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Revisar Gramática y Partículas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFreeInputSentence('');
                      setFreeInputMeaning('');
                      setFreeAuditResult(null);
                      setLivePreviewPracticeBanner('');
                      setPracticeJpWarning('');
                      setPracticeEsWarning('');
                    }}
                    className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Limpiar
                  </button>
                </div>
              </form>

              {tourBubble('tour-practice-room')}
            </section>

            {/* RESULTADO DEL AUDITOR DE PRÁCTICA LIBRE */}
            {freeAuditResult && (
              <div className="bg-[#101624] border border-slate-800 rounded-3xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-black border ${
                      freeAuditResult.isValid
                        ? 'bg-teal-950/80 border-teal-500/40 text-teal-300'
                        : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    {freeAuditResult.score}
                  </span>
                  <span className="text-xs font-black text-indigo-300">
                    {freeAuditResult.level}
                  </span>
                </div>

                <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Oración verificada:
                    </span>
                    <p className="text-lg font-black text-white mt-0.5">
                      {freeAuditResult.verifiedSentence}
                    </p>
                    <p className="text-xs font-bold text-teal-300 mt-0.5">
                      {freeAuditResult.translation}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        speakText(freeAuditResult.verifiedSentence, 'ja', 'audit-res-ja')
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Audio JP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        speakText(freeAuditResult.translation, 'es', 'audit-res-es')
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-sky-500/40 text-sky-300 text-xs font-bold flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Audio ES</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{freeAuditResult.feedback}</p>

                <div className="space-y-2">
                  {freeAuditResult.tokens.map((tok, i) => (
                    <div
                      key={`audit-tok-${i}`}
                      className="bg-[#090d16] border border-slate-800/90 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-xs text-white">{tok.surface}</span>
                        <span className="text-[10px] font-bold text-sky-300">{tok.role}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{tok.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------------------
            PESTAÑA 4: ORACIONES GUARDADAS
        -------------------------------------------------------------------- */}
        {tabKey === 'saved' && (
          <div className="space-y-3">
            <div className="bg-[#101624] border border-slate-800 rounded-3xl p-4 flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="font-extrabold text-sm sm:text-base text-white">
                  Oraciones Guardadas ({savedSentences.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Tus estructuras favoritas listas para repasar o exportar en JSON.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar JSON</span>
              </button>
            </div>

            {savedSentences.length === 0 ? (
              <div className="bg-[#101624] border border-slate-800 rounded-3xl p-7 text-center space-y-2">
                <Bookmark className="w-8 h-8 text-indigo-400 mx-auto" />
                <p className="font-bold text-sm text-white">Aún no guardaste oraciones</p>
                <p className="text-xs text-slate-400">
                  Tocá el ícono de marcador en el Generador para conservar las oraciones que más te
                  sirvan.
                </p>
              </div>
            ) : (
              savedSentences
                .filter((s) =>
                  !savedSearch.trim()
                    ? true
                    : s.japanese.toLowerCase().includes(savedSearch.toLowerCase()) ||
                      s.translation.toLowerCase().includes(savedSearch.toLowerCase())
                )
                .map((sent, idx) => (
                  <div
                    key={`saved-${idx}`}
                    className="bg-[#101624] border border-slate-800 rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base sm:text-lg font-black text-white">
                          {sent.japanese}
                        </p>
                        <p className="text-xs font-bold text-teal-300 mt-0.5">
                          {sent.translation}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => speakText(sent.japanese, 'ja', `sav-ja-${idx}`)}
                          className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-teal-300 text-[10px] font-bold"
                        >
                          JP
                        </button>
                        <button
                          type="button"
                          onClick={() => speakText(sent.translation, 'es', `sav-es-${idx}`)}
                          className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-sky-300 text-[10px] font-bold"
                        >
                          ES
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSaveSentence(sent)}
                          className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      <style>{`
        @keyframes shrinkRing {
          0% {
            transform: scale(1.65);
            opacity: 0.95;
          }
          70% {
            transform: scale(0.92);
            opacity: 0.75;
          }
          100% {
            transform: scale(0.85);
            opacity: 0;
          }
        }
        @keyframes splashProgressFill {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        @keyframes charRise {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.88);
            filter: blur(4px);
          }
          65% {
            opacity: 1;
            transform: translateY(-2px) scale(1.03);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }
        @keyframes titleGlowSweep {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes subtleFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        @keyframes tabSlideInRight {
          0% {
            opacity: 0.2;
            transform: translate3d(100%, 0, 0) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes tabSlideOutLeft {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate3d(-100%, 0, 0) scale(0.975);
          }
        }
        @keyframes tabSlideInLeft {
          0% {
            opacity: 0.2;
            transform: translate3d(-100%, 0, 0) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes tabSlideOutRight {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate3d(100%, 0, 0) scale(0.975);
          }
        }
      `}</style>

      {/* ========================================================================
          0. ANIMACIÓN DE APERTURA (1. BIENVENIDO A -> 2. ÚNICO LOGO + NOMBRE -> 3. TU APP DE APOYO -> 4. REGISTRO / MENSAJE MOTIVACIONAL)
      ======================================================================== */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-[100] bg-[#080c14] flex flex-col items-center justify-center p-5 overflow-y-auto select-none transition-opacity duration-500 ${
            splashClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26rem] h-[26rem] rounded-full bg-indigo-900/20 blur-3xl" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-slate-800/25 blur-2xl" />
          </div>

          <div className="flex flex-col items-center text-center relative z-10 max-w-md w-full space-y-5 my-auto py-4">
            {/* 1. ARRIBA: "Bienvenido a" ANIMADO LETRA POR LETRA */}
            <div
              className="flex flex-col items-center space-y-2"
              style={{ animation: 'subtleFloat 3.6s ease-in-out infinite' }}
            >
              <div
                aria-label={
                  splashMode === 'returning' && username
                    ? `Bienvenido, ${username} a`
                    : 'Bienvenido a'
                }
                className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1"
              >
                <span className="inline-flex items-center text-2xl sm:text-3xl font-black tracking-wide">
                  {('Bienvenido' + (splashMode === 'returning' && username ? ',' : '')).split('').map((ch, idx) => (
                    <span
                      key={`bw-${idx}`}
                      className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-sky-200 to-indigo-200"
                      style={{
                        backgroundSize: '200% auto',
                        animation: `charRise 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.045}s both, titleGlowSweep 4s ease-in-out infinite`
                      }}
                    >
                      {ch}
                    </span>
                  ))}
                </span>

                {splashMode === 'returning' && username && (
                  <span
                    className="inline-flex items-center px-3 py-0.5 rounded-full bg-indigo-950/80 border border-sky-400/40 text-sky-200 text-xl sm:text-2xl font-black shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                    style={{
                      animation: 'charRise 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.48s both'
                    }}
                  >
                    {username}
                  </span>
                )}

                <span
                  className="inline-block text-2xl sm:text-3xl font-black text-sky-300"
                  style={{
                    animation: `charRise 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${
                      splashMode === 'returning' && username ? '0.62s' : '0.5s'
                    } both`
                  }}
                >
                  a
                </span>
              </div>

              <div
                className="h-0.5 w-24 rounded-full bg-gradient-to-r from-transparent via-sky-400/60 to-transparent"
                style={{
                  animation: 'charRise 0.7s ease-out 0.65s both'
                }}
              />
            </div>

            {/* 2. ÚNICO LOGOTIPO GRANDE (w-24 h-24) + TÍTULO */}
            <div
              className={`flex flex-col items-center space-y-3.5 transition-all duration-500 ${
                splashStage >= 2
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute -inset-4 rounded-[36px] bg-indigo-600/25 blur-xl" />
                <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-indigo-700 via-indigo-600 to-slate-800 flex flex-col items-center justify-center shadow-[0_14px_40px_rgba(30,41,59,0.85)] border border-slate-600/60 relative">
                  <span className="absolute top-2 left-3 text-slate-300/80 font-black text-sm leading-none">
                    「
                  </span>
                  <span className="text-white font-black text-5xl leading-none drop-shadow">
                    道
                  </span>
                  <span className="absolute bottom-5 right-3 text-slate-300/80 font-black text-sm leading-none">
                    」
                  </span>
                  <span className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-950/85 text-[9px] font-black tracking-wider text-indigo-200 border border-indigo-400/35">
                    N5 • N1
                  </span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                MI JAPONÉS{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-300 to-slate-300">
                  N5–N1
                </span>
              </h1>
            </div>

            {/* 3. INSIGNIA "Tu app de apoyo" */}
            <div
              className={`flex flex-col items-center space-y-1.5 transition-all duration-500 ${
                splashStage >= 3
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              <div className="px-5 py-2 rounded-full bg-slate-900/90 border border-indigo-400/40 shadow">
                <p className="text-base sm:text-lg font-black text-slate-100 tracking-wide">
                  Tu app de apoyo
                </p>
              </div>
              <p className="text-xs font-semibold text-slate-400 pt-0.5">
                Apoyo para la creación de oraciones y correcciones
              </p>
            </div>

            {/* 4. REGISTRO PARA USUARIO NUEVO (SIN EJEMPLO DE NOMBRE PROPIO) O MENSAJE MOTIVACIONAL */}
            <div
              className={`w-full transition-all duration-500 ${
                splashStage >= 4
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              {splashMode === 'new' ? (
                <form
                  onSubmit={handleStartNewUserFromSplash}
                  className="bg-[#101624] border border-slate-700/80 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xl text-left"
                >
                  <div className="text-center space-y-1">
                    <h2 className="font-black text-sm sm:text-base text-white">
                      ¿Cómo te gustaría llamarte en la app?
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Tu nombre acompañará tu estudio y en las próximas aperturas entrarás
                      directamente sin este paso.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="text"
                      maxLength={24}
                      value={tempUsernameInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempUsernameInput(val);
                        if (val.trim().length > 0) {
                          const check = validateUsernameProfanity(val);
                          setUsernameError(check.reason === 'profanity' ? check.message : '');
                        } else {
                          setUsernameError('');
                        }
                      }}
                      placeholder="Escribe tu nombre o apodo"
                      className="w-full bg-[#090d16] border border-slate-700 focus:border-indigo-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none text-center font-bold"
                    />

                    {usernameError && (
                      <div className="flex items-center justify-center gap-1.5 text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded-xl px-3 py-1.5 text-[11px] font-bold">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{usernameError}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm sm:text-base tracking-wide shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    <span>Comenzar</span>
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </form>
              ) : (
                <div className="bg-[#101624] border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-2.5 text-center relative overflow-hidden">
                  <h2 className="font-black text-base sm:text-lg text-sky-200 tracking-wide leading-snug">
                    {currentMotivationalObj.headline(username || 'Estudiante')}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 font-semibold leading-relaxed">
                    {currentMotivationalObj.subtext}
                  </p>

                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-2 border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 rounded-full"
                      style={{
                        animation:
                          splashStage >= 4 ? 'splashProgressFill 4.25s linear forwards' : 'none'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN TOAST */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-indigo-400/50 text-slate-100 px-4 py-2 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================
          1. CABECERA SUPERIOR PRINCIPAL Y DESPLEGABLE DE PERFIL (SOLO LECTURA)
      ======================================================================== */}
      <header className="sticky top-0 z-30 bg-[#0b101b]/95 backdrop-blur-md border-b border-slate-800/90">
        <div className="max-w-3xl mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-slate-800 flex items-center justify-center shadow border border-slate-600/60 shrink-0 select-none">
              <span className="text-white font-black text-lg leading-none">道</span>
            </div>
            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-xs sm:text-sm tracking-tight text-white truncate">
                MI JAPONÉS N5–N1
              </span>
              {username && (
                <span className="px-2 py-0.5 rounded-full bg-teal-950/80 border border-teal-500/40 text-teal-300 font-extrabold text-[10px] truncate max-w-[110px]">
                  {username}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 font-bold text-[10px] shrink-0">
                v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setBackupModalOpen(true)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 transition"
              title="Respaldo JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={openWelcomeTutorialWithSlide}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 transition"
              title="Ver sugerencia de tutorial"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setHeaderExpanded((prev) => !prev)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xs:inline">Perfil</span>
              {headerExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* CAJÓN DESPLEGABLE DE PERFIL (LIMPIO: SOLO RESUMEN DEL ESTUDIANTE) */}
        {headerExpanded && (
          <div className="max-w-3xl mx-auto px-3 pb-3 pt-2 border-t border-slate-800/80 bg-[#0d1322]">
            <div className="flex items-center justify-between flex-wrap gap-2 bg-[#090d16] border border-slate-800 rounded-2xl px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-xs text-slate-400 font-semibold">Estudiante:</span>
                <span className="text-xs font-black text-white px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700">
                  {username || 'Estudiante'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-2 flex-wrap">
                <span>
                  <b className="text-sky-300">{stats.words}</b> palabras
                </span>
                <span>·</span>
                <span>
                  <b className="text-indigo-300">{stats.particles}</b> partículas
                </span>
                <span>·</span>
                <span>
                  <b className="text-teal-300">{stats.grammarUses}</b> usos
                </span>
                <span>·</span>
                <span>
                  <b className="text-slate-200">{stats.folders}</b> carpetas
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================
          2. CONTENIDO PRINCIPAL DE LAS 4 PESTAÑAS (TRANSICIÓN DESLIZANTE DINÁMICA)
      ======================================================================== */}
      <main
        onTouchStart={handleMainTouchStart}
        onTouchEnd={handleMainTouchEnd}
        className="flex-1 max-w-3xl w-full mx-auto px-3 pt-4 pb-28 overflow-x-hidden"
      >
        <div className="relative w-full">
          {exitingTab && (
            <div
              key={`tab-exit-${exitingTab}-${tabAnimSeq}`}
              aria-hidden="true"
              className="absolute inset-x-0 top-0 w-full pointer-events-none select-none z-10 will-change-transform"
              style={{
                animation:
                  tabSlideDirection === 'forward'
                    ? 'tabSlideOutLeft 380ms cubic-bezier(0.22, 1, 0.36, 1) forwards'
                    : 'tabSlideOutRight 380ms cubic-bezier(0.22, 1, 0.36, 1) forwards'
              }}
            >
              {renderTabPanel(exitingTab, true)}
            </div>
          )}

          <div
            key={`tab-enter-${activeTab}`}
            className="w-full relative z-20 will-change-transform"
            style={
              tabAnimSeq > 0
                ? {
                    animation:
                      tabSlideDirection === 'forward'
                        ? 'tabSlideInRight 380ms cubic-bezier(0.22, 1, 0.36, 1) both'
                        : 'tabSlideInLeft 380ms cubic-bezier(0.22, 1, 0.36, 1) both'
                  }
                : undefined
            }
          >
            {renderTabPanel(activeTab, false)}
          </div>
        </div>
      </main>

      {/* ========================================================================
          3. MODAL DE SUGERENCIA DEL TUTORIAL (DESLIZAMIENTO REAL DE IZQUIERDA A CENTRO)
      ======================================================================== */}
      {tutorialPhase === 'welcome' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div
            style={{
              transform: welcomeSlideEntered
                ? 'translate3d(0, 0, 0) scale(1)'
                : 'translate3d(-115vw, 0, 0) scale(0.96)',
              opacity: welcomeSlideEntered ? 1 : 0,
              transition:
                'transform 750ms cubic-bezier(0.22, 1, 0.36, 1), opacity 350ms ease-out'
            }}
            className="relative bg-[#101624] border border-slate-700/90 border-l-4 border-l-sky-400 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden will-change-transform"
          >
            <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-slate-800 flex items-center justify-center shadow-lg border border-slate-600/50 shrink-0">
                <span className="text-white font-black text-2xl">道</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-sky-300 border border-sky-400/30 inline-block">
                  Guía Opcional Interactiva
                </span>
                <h3 className="font-black text-base sm:text-lg text-white mt-0.5 leading-snug">
                  ¡Hola, {username || 'Estudiante'}! Te invitamos al recorrido guiado
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed relative z-10">
              {username ? `${username}, en` : 'En'} menos de 1 minuto este recorrido te señala con
              una flecha cada herramienta de tu estudio y te explica por partes (
              <b>1. ¿Qué es?</b> · <b>2. ¿Cómo hacer?</b> · <b>3. ¿Para qué?</b>) cómo aprovechar
              cada función al máximo.
            </p>

            <div className="space-y-2 pt-1 relative z-10">
              <button
                type="button"
                onClick={startGuidedTour}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>Ver Tutorial Guiado (7 puntos)</span>
              </button>

              <button
                type="button"
                onClick={closeTutorialAndRemember}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition"
              >
                Saltar Tutorial (Ya conozco la app)
              </button>

              <label className="w-full py-2.5 px-4 rounded-xl bg-teal-950/50 hover:bg-teal-900/50 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition text-center">
                <Upload className="w-4 h-4 shrink-0" />
                <span>Reinstalé la app: Cargar mi archivo JSON y Saltar</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleImportJSONFile(e, true)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL DE CATÁLOGOS RÁPIDOS DE 1 TOQUE
      ======================================================================== */}
      {quickCatalogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#101624] border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[82vh] flex flex-col overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {quickCatalogModal === 'particles' && 'Catálogo Rápido de Partículas (+助詞)'}
                {quickCatalogModal === 'kosoado' && 'Demostrativos y Prenominales (+こそあど)'}
                {quickCatalogModal === 'time' && 'Marcadores de Tiempo y Frecuencia (+時間)'}
                {quickCatalogModal === 'grammar' && 'Usos Gramaticales en Inventario (+文法)'}
              </h3>
              <button
                type="button"
                onClick={() => setQuickCatalogModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(quickCatalogModal === 'particles'
                  ? PARTICLE_CATALOG
                  : quickCatalogModal === 'kosoado'
                  ? KOSOADO_CATALOG
                  : quickCatalogModal === 'time'
                  ? TIME_CATALOG
                  : GRAMMAR_QUICK_CATALOG
                ).map((item) => {
                  const isAdded = inventory.some((i) => i.word === item.word);
                  return (
                    <button
                      key={item.word}
                      type="button"
                      onClick={() => toggleCatalogItemInInventory(item)}
                      className={`p-3 rounded-xl border text-left flex items-start justify-between gap-2 transition ${
                        isAdded
                          ? 'bg-indigo-600/25 border-indigo-400 text-white'
                          : 'bg-[#090d16] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm text-white">{item.word}</span>
                          <span className="text-[10px] text-indigo-300">{item.reading}</span>
                        </div>
                        <p className="text-xs font-semibold text-teal-300 mt-0.5">
                          {item.meaning}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                          isAdded
                            ? 'bg-indigo-500 border-indigo-300 text-white'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isAdded && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900/80">
              <button
                type="button"
                onClick={() => setQuickCatalogModal(null)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL DE RESPALDO JSON (EXPORTAR / IMPORTAR)
      ======================================================================== */}
      {backupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#101624] border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">
                  {username
                    ? `Respaldo personal de ${username} · MI JAPONÉS N5–N1`
                    : 'Respaldo de Estudio · MI JAPONÉS N5–N1'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Guardá o restaurá una copia de seguridad de tus palabras, nombre y oraciones en
                  archivo JSON.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBackupModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-white block">
                Copia de Seguridad de Vocabulario y Oraciones
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar JSON</span>
                </button>

                <label className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>Importar JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => handleImportJSONFile(e, false)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBackupModalOpen(false)}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================
          5. BARRA INFERIOR DESPLEGABLE + CAJÓN "PRÓXIMAMENTE · EN CONSTRUCCIÓN"
      ======================================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center pointer-events-none">
        <div className="flex items-center gap-1.5 mb-0.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setBottomNavCollapsed((prev) => !prev)}
            className="px-3 py-1 rounded-t-xl bg-[#0d121f]/95 border border-b-0 border-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 shadow-lg"
            title="Ocultar o mostrar barra inferior"
          >
            <span>Menú</span>
            {bottomNavCollapsed ? (
              <ChevronUp className="w-3.5 h-3.5 text-sky-300" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-sky-300" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setComingSoonDrawerOpen((prev) => !prev)}
            className={`px-3 py-1 rounded-t-xl border border-b-0 text-[10px] font-bold flex items-center gap-1 shadow-lg transition ${
              comingSoonDrawerOpen
                ? 'bg-slate-800 border-indigo-400 text-indigo-200'
                : 'bg-[#0d121f]/95 border-slate-700 text-slate-300'
            }`}
          >
            <Globe className="w-3 h-3 text-indigo-400" />
            <span>Idiomas / Más</span>
            {comingSoonDrawerOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </button>
        </div>

        {comingSoonDrawerOpen && (
          <div className="w-full max-w-3xl bg-[#0d121f]/98 border-t border-x border-slate-700 px-4 py-3 pointer-events-auto shadow-2xl space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                <span className="font-extrabold text-xs text-white">
                  Español → Japonés (Activo)
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-sky-300 text-[10px] font-black">
                Próximamente · En construcción
              </span>
            </div>
          </div>
        )}

        {!bottomNavCollapsed && (
          <nav className="w-full bg-[#0b101b]/95 backdrop-blur-md border-t border-slate-800/90 px-2 py-1.5 pointer-events-auto">
            <div className="max-w-3xl mx-auto relative">
              {/* Indicador deslizante superior sincronizado con la pestaña activa */}
              <div className="pointer-events-none absolute -top-1.5 left-0 right-0 h-0.5 overflow-hidden">
                <div
                  className="w-1/4 h-full px-3 transition-transform duration-300 ease-out"
                  style={{ transform: `translate3d(${activeTabIndex * 100}%, 0, 0)` }}
                >
                  <div
                    className={`w-full h-full rounded-full ${
                      activeTab === 'generator'
                        ? 'bg-sky-400'
                        : activeTab === 'practice'
                        ? 'bg-teal-400'
                        : 'bg-indigo-400'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => handleSwitchTab('inventory')}
                  className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                    activeTab === 'inventory'
                      ? 'bg-indigo-600/20 text-indigo-300 font-bold scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span className="text-[10px]">Inventario ({inventory.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchTab('generator')}
                  className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                    activeTab === 'generator'
                      ? 'bg-sky-600/20 text-sky-300 font-bold scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  <span className="text-[10px]">Generador</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchTab('practice')}
                  className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                    activeTab === 'practice'
                      ? 'bg-teal-600/20 text-teal-300 font-bold scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  <span className="text-[10px]">Práctica Libre</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchTab('saved')}
                  className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                    activeTab === 'saved'
                      ? 'bg-indigo-600/20 text-indigo-300 font-bold scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span className="text-[10px]">Guardadas ({savedSentences.length})</span>
                </button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <MiJaponesApp />
    </AppErrorBoundary>
  );
}
