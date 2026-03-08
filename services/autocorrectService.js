// ── Diccionario de correcciones para español mexicano ────────
// Formato: 'error común': 'corrección'

const DICTIONARY = {
  // Acentos más comunes
  'como':       'cómo',
  'que':        'qué',
  'cuando':     'cuándo',
  'donde':      'dónde',
  'porque':     'por qué',
  'cuanto':     'cuánto',
  'quien':      'quién',
  'cual':       'cuál',
  'adonde':     'adónde',
  'mas':        'más',
  'si':         'sí',
  'tu':         'tú',
  'el':         'él',
  'mi':         'mí',
  'te':         'té',
  'se':         'sé',
  'de':         'dé',
  'aun':        'aún',
  'solo':       'solo', // no cambia, ambas formas son válidas
  'esta':       'está',
  'estan':      'están',
  'estaba':     'estaba',
  'tambien':    'también',
  'ademas':     'además',
  'despues':    'después',
  'antes':      'antes',
  'atras':      'atrás',
  'aqui':       'aquí',
  'ahi':        'ahí',
  'alla':       'allá',
  'aca':        'acá',
  'jamas':      'jamás',
  'nunca':      'nunca',
  'siempre':    'siempre',
  'facil':      'fácil',
  'dificil':    'difícil',
  'rapido':     'rápido',
  'rapida':     'rápida',
  'util':       'útil',
  'inutil':     'inútil',
  'publico':    'público',
  'musica':     'música',
  'telefono':   'teléfono',
  'numero':     'número',
  'articulo':   'artículo',
  'pagina':     'página',
  'caracter':   'carácter',
  'camara':     'cámara',
  'imagen':     'imagen',
  'nacion':     'nación',
  'accion':     'acción',
  'relacion':   'relación',
  'situacion':  'situación',
  'solucion':   'solución',
  'cancion':    'canción',
  'corazon':    'corazón',
  'razon':      'razón',
  'ingles':     'inglés',
  'frances':    'francés',
  'japones':    'japonés',
  'cafe':       'café',
  'manana':     'mañana',
  'ano':        'año',
  'senor':      'señor',
  'senora':     'señora',
  'nino':       'niño',
  'nina':       'niña',
  'espanol':    'español',
  'ensueno':    'ensueño',
  'companero':  'compañero',
  'companera':  'compañera',
  'informacion':'información',
  'comunicacion':'comunicación',
  'explicacion':'explicación',
  'atencion':   'atención',
  'habitacion': 'habitación',
  'reunion':    'reunión',
  'opinion':    'opinión',
  'decision':   'decisión',
  'version':    'versión',
  'direccion':  'dirección',
  'condicion':  'condición',
  'posicion':   'posición',
  'produccion': 'producción',
  'educacion':  'educación',

  // Errores ortográficos comunes en México
  'haber':      'haber',   // confusión con "a ver"
  'haver':      'haber',
  'aver':       'a ver',
  'vien':       'bien',
  'vienes':     'vienes',
  'havlar':     'hablar',
  'habia':      'había',
  'habian':     'habían',
  'hacia':      'hacia',
  'hacias':     'hacías',
  'hacian':     'hacían',
  'queria':     'quería',
  'querian':    'querían',
  'podia':      'podía',
  'podian':     'podían',
  'tenia':      'tenía',
  'tenian':     'tenían',
  'venia':      'venía',
  'venian':     'venían',
  'sabia':      'sabía',
  'sabian':     'sabían',
  'decia':      'decía',
  'decian':     'decían',
  'hacia':      'hacía',
  'ponia':      'ponía',
  'pondrian':   'pondrían',
  'podrian':    'podrían',
  'tendrian':   'tendrían',
  'vendrian':   'vendrían',
  'serian':     'serían',
  'estarian':   'estarían',
  'irian':      'irían',
  'harian':     'harían',

  // Confusiones comunes
  'ahi nomas':  'ahí nomás',
  'ai nomas':   'ahí nomás',
  'ahorita':    'ahorita',   // correcto, no cambiar
  'orita':      'ahorita',
  'horita':     'ahorita',
  'ai':         'ahí',
  'ay':         'hay',       // solo cuando es verbo
  'halla':      'haya',
  'valla':      'vaya',
  'tubo':       'tuvo',
  'hice':       'hice',
  'hiso':       'hizo',
  'hase':       'hace',
  'hasen':      'hacen',
  'saver':      'saber',
  'savemos':    'sabemos',
  'deveria':    'debería',
  'deverian':   'deberían',
  'conosi':     'conocí',
  'conosia':    'conocía',
  'nesesito':   'necesito',
  'nesesita':   'necesita',
  'nesesitaba': 'necesitaba',
  'nesecito':   'necesito',
  'necesito':   'necesito',
  'consejo':    'consejo',
  'consejoo':   'consejo',
  'espera':     'espera',
  'espeate':    'espérate',
  'esperate':   'espérate',
  'quedate':    'quédate',
  'tomate':     'tómate',
  'olvidate':   'olvídate',
  'fijate':     'fíjate',
  'animate':    'anímate',
  'cuentame':   'cuéntame',
  'dime':       'dime',
  'dimelo':     'díme lo',
  'digame':     'dígame',
  'perdon':     'perdón',
  'tambem':     'también',
  'tmbn':       'también',
  'tmb':        'también',
  'xfa':        'por favor',
  'porfas':     'por favor',
  'porfa':      'por favor',
  'xq':         'por qué',
  'pq':         'por qué',
  'q':          'que',
  'bn':         'bien',
  'bn':         'bien',
  'mñna':       'mañana',
  'ntp':        'no te preocupes',
  'ntp':        'no te preocupes',

  // Palabras con h inicial que se omite
  'ola':        'hola',
  'acer':       'hacer',
  'ace':        'hace',
  'ablando':    'hablando',
  'able':       'hable',
  'ablar':      'hablar',
  'abia':       'había',
  'ay':         'hay',
  'asta':       'hasta',
  'allarse':    'hallarse',

  // Letras confundidas (b/v, c/s/z, ll/y)
  'alla':       'haya',
  'llo':        'yo',
  'llendo':     'yendo',
  'yegar':      'llegar',
  'yaman':      'llaman',
  'yamo':       'llamo',
  'yeve':       'lleve',
  'yora':       'llora',
  'rreir':      'reír',
  'reir':       'reír',
  'sonreir':    'sonreír',
  'sentir':     'sentir',
  'vivir':      'vivir',
  'escribir':   'escribir',

  // Expresiones mexicanas con errores
  'chingon':    'chingón',
  'cabron':     'cabrón',
  'cuate':      'cuate',
  'chavo':      'chavo',
  'chava':      'chava',
  'chido':      'chido',
  'chida':      'chida',
  'wey':        'wey',
  'guey':       'wey',
  'buey':       'wey',
};

// Palabras que NO deben corregirse (jerga, abreviaciones de chat)
const PROTECTED = new Set([
  'jaja', 'jajaja', 'jajajaja', 'jeje', 'jejeje',
  'xd', 'xdd', 'xddd', 'lol', 'omg', 'wtf',
  'ok', 'okey', 'okay',
  'wey', 'wei', 'güey',
  'chido', 'chida', 'neta', 'órale', 'orale',
  'ahorita', 'horita', 'ahorita',
  'chamba', 'chela', 'cuate', 'chavo', 'chava',
  'no mames', 'no manches', 'chale',
]);

/**
 * Aplica correcciones ortográficas básicas al texto
 * @param {string} text
 * @returns {{ corrected: string, changes: string[], changed: boolean }}
 */
export function localAutocorrect(text) {
  if (!text?.trim()) return { corrected: text, changes: [], changed: false };

  const words   = text.split(/(\s+)/); // conserva espacios
  const changes = [];
  let   changed = false;

  const result = words.map(token => {
    // Si es espacio u otro separador, no tocar
    if (/^\s+$/.test(token)) return token;

    const lower = token.toLowerCase();

    // Proteger jerga y abreviaciones
    if (PROTECTED.has(lower)) return token;

    // Buscar en diccionario
    if (DICTIONARY[lower] && DICTIONARY[lower] !== lower) {
      // Respetar mayúscula inicial si la tenía
      const fix = token[0] === token[0].toUpperCase() && token[0] !== token[0].toLowerCase()
        ? DICTIONARY[lower][0].toUpperCase() + DICTIONARY[lower].slice(1)
        : DICTIONARY[lower];

      if (fix !== token) {
        changes.push(`${token} → ${fix}`);
        changed = true;
        return fix;
      }
    }

    return token;
  });

  // Mayúscula al inicio de la oración
  let corrected = result.join('');
  if (corrected.length > 0) {
    corrected = corrected[0].toUpperCase() + corrected.slice(1);
  }

  // Punto al final si el texto tiene más de 3 palabras y no termina en puntuación
  const lastChar = corrected.trim().slice(-1);
  const hasPunct = ['.',',','!','?',':',';','…'].includes(lastChar);
  const wordCount = corrected.trim().split(/\s+/).length;
  if (!hasPunct && wordCount >= 3) {
    corrected = corrected.trimEnd() + '.';
    changed = true;
  }

  // Verificar si hubo algún cambio real
  if (corrected === text) changed = false;

  return { corrected, changes, changed };
}