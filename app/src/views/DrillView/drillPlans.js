// Guided drill plan definitions — what each preset trains and how it's configured
import { generateDigits, generateLetters, generateWords } from '../../../../src/drill-generator.js';
import { encodeMajor, getDefaultWords, consonantsMatchDigits } from '../../../../src/major-system.js';
import { scoreExact, scoreText } from '../../../../src/scoring.js';

export { generateDigits, generateLetters, generateWords, encodeMajor, getDefaultWords, consonantsMatchDigits, scoreExact, scoreText };

export const LANE_LABELS = {
  A: 'Reading Velocity', B: 'Working Memory', C: 'Attention Control',
  D: 'Reasoning',        E: 'Expression',     F: 'Integration',
};

export const GUIDED_PLANS = {
  'number-recall': {
    title:     'Remember Numbers',
    eyebrow:   'Working Memory',
    desc:      'See digits, hide them, then type them back from memory.',
    copy:      'Classic symbol recall. Best for building raw short-term retention and keeping a clean mental buffer under pressure.',
    primary:   'B', secondary: 'C',
    configs: {
      easy:   { mode:'recall', type:'digits',  length:4, technique:'none',    chunkSize:3, exposureSec:6, delaySec:0, customText:'' },
      steady: { mode:'recall', type:'digits',  length:6, technique:'chunking',chunkSize:3, exposureSec:5, delaySec:1, customText:'' },
      hard:   { mode:'recall', type:'digits',  length:8, technique:'chunking',chunkSize:4, exposureSec:4, delaySec:2, customText:'' },
    },
  },
  'letter-recall': {
    title:     'Remember Letters',
    eyebrow:   'Working Memory',
    desc:      'Train raw recall without semantic shortcuts.',
    copy:      'Letters remove meaning and force cleaner working-memory retention. Useful when numbers feel too familiar.',
    primary:   'B', secondary: 'C',
    configs: {
      easy:   { mode:'recall', type:'letters', length:4, technique:'none', chunkSize:3, exposureSec:6, delaySec:0, customText:'' },
      steady: { mode:'recall', type:'letters', length:6, technique:'none', chunkSize:3, exposureSec:5, delaySec:1, customText:'' },
      hard:   { mode:'recall', type:'letters', length:7, technique:'none', chunkSize:3, exposureSec:4, delaySec:2, customText:'' },
    },
  },
  'word-recall': {
    title:     'Remember Words',
    eyebrow:   'Working Memory + Integration',
    desc:      'Build retention on language-sized chunks instead of symbols.',
    copy:      'Language-sized chunks bridge memory with meaning. Good when you want recall practice that feels closer to real reading.',
    primary:   'B', secondary: 'F',
    configs: {
      easy:   { mode:'recall', type:'words', length:4, technique:'none',    chunkSize:3, exposureSec:8, delaySec:0, customText:'' },
      steady: { mode:'recall', type:'words', length:5, technique:'linking', chunkSize:3, exposureSec:7, delaySec:1, customText:'' },
      hard:   { mode:'recall', type:'words', length:7, technique:'linking', chunkSize:3, exposureSec:6, delaySec:2, customText:'' },
    },
  },
  'passage-recall': {
    title:     'Memorize a Passage',
    eyebrow:   'Expression + Integration',
    desc:      'Paste your own verse or paragraph, then reproduce it accurately.',
    copy:      'Use your own verse, quote, or paragraph. This is the most natural bridge from drills into actual expression and transfer.',
    primary:   'E', secondary: 'F',
    needsText: true,
    configs: {
      easy:   { mode:'recall', type:'text', length:1, technique:'none', chunkSize:3, exposureSec:15, delaySec:0, customText:'' },
      steady: { mode:'recall', type:'text', length:1, technique:'none', chunkSize:3, exposureSec:12, delaySec:2, customText:'' },
      hard:   { mode:'recall', type:'text', length:1, technique:'none', chunkSize:3, exposureSec:10, delaySec:4, customText:'' },
    },
  },
  'major-encode': {
    title:     'Turn Numbers into Words',
    eyebrow:   'Integration',
    desc:      'Use the Major System to encode digits into memorable words.',
    copy:      'Practice converting digits into memorable Major System words. This shifts you from raw storage into deliberate encoding.',
    primary:   'F', secondary: 'B',
    configs: {
      easy:   { mode:'encode', type:'digits', length:4, technique:'major', chunkSize:2, exposureSec:8, delaySec:0, customText:'' },
      steady: { mode:'encode', type:'digits', length:6, technique:'major', chunkSize:2, exposureSec:7, delaySec:1, customText:'' },
      hard:   { mode:'encode', type:'digits', length:8, technique:'major', chunkSize:2, exposureSec:6, delaySec:2, customText:'' },
    },
  },
  'major-decode': {
    title:     'Turn Words into Numbers',
    eyebrow:   'Integration',
    desc:      'See Major words and reconstruct the original digits.',
    copy:      'Decode Major words back into digits. Harder than recall because you must reconstruct the original numeric sequence.',
    primary:   'F', secondary: 'B',
    configs: {
      easy:   { mode:'decode', type:'digits', length:4, technique:'major', chunkSize:2, exposureSec:8, delaySec:0, customText:'' },
      steady: { mode:'decode', type:'digits', length:6, technique:'major', chunkSize:2, exposureSec:7, delaySec:1, customText:'' },
      hard:   { mode:'decode', type:'digits', length:8, technique:'major', chunkSize:2, exposureSec:6, delaySec:2, customText:'' },
    },
  },
};

export function getConfig(planKey, level, customText = '') {
  const plan = GUIDED_PLANS[planKey] || GUIDED_PLANS['number-recall'];
  const cfg  = { ...(plan.configs[level] || plan.configs.steady) };
  if (cfg.type === 'text' && customText) cfg.customText = customText;
  return cfg;
}

export function describeFlow(cfg) {
  const { mode, type, length, exposureSec, delaySec, technique } = cfg;
  const src = type === 'digits' ? `${length} digits` : type === 'letters' ? `${length} letters` : type === 'words' ? `${length} words` : 'your pasted passage';
  const expText = exposureSec > 0 ? `for ${exposureSec} second${exposureSec === 1 ? '' : 's'}` : 'until you tap "I\'ve got it"';
  const delText = delaySec > 0 ? ` wait ${delaySec} second${delaySec === 1 ? '' : 's'} before answering` : ' answer immediately';
  const techText = technique && technique !== 'none' ? ` using ${technique.replace('-', ' ')}` : '';
  if (mode === 'encode') return `See ${src} ${expText}, convert them into a Major word or image, then type your encoding.`;
  if (mode === 'decode') return `See Major words ${expText}, reconstruct the original digits, then type the numeric sequence.`;
  return `See ${src} ${expText},${delText}, then type it back${techText}.`;
}

export function getTrainingSignal(cfg) {
  const { mode, type, technique, delaySec, exposureSec } = cfg;
  let primary = 'B', secondary = 'C';
  let note = 'This is a straightforward retention drill: see it, hold it, reproduce it.';

  if (mode === 'encode' || mode === 'decode' || ['major','number-shape','number-rhyme'].includes(technique)) {
    primary = 'F'; secondary = 'B';
    note = 'These settings push strategy transfer: you are converting information through a memory system, not just storing it.';
  } else if (type === 'text') {
    primary = 'E'; secondary = 'F';
    note = 'Passage recall stresses expression because the target is structured language, not raw symbols.';
  } else if (type === 'words') {
    primary = 'B'; secondary = technique === 'linking' ? 'F' : 'E';
    note = technique === 'linking'
      ? 'Linking turns plain recall into integrative encoding by forcing you to create relationships between words.'
      : 'Word recall sits between raw memory and expressive reconstruction.';
  } else if (type === 'letters') {
    note = 'Letter strings strip away semantic meaning — a clean working-memory and attention-control challenge.';
  }
  if (delaySec >= 3) note += ' The added recall delay increases the transfer load.';
  if (exposureSec <= 3 && exposureSec > 0) note += ' Short exposure also raises attention demand.';

  return { primary: LANE_LABELS[primary], secondary: LANE_LABELS[secondary], note, flow: describeFlow(cfg) };
}

/** Build material and expectedAnswer from a config. Returns { material, expectedAnswer } */
export function buildMaterial(cfg) {
  const majorWords = getDefaultWords();
  if (cfg.mode === 'encode') {
    const digits = generateDigits(cfg.length);
    return { material: digits, expectedAnswer: null }; // checked via consonantsMatchDigits
  }
  if (cfg.mode === 'decode') {
    const digits  = generateDigits(cfg.length);
    const padded  = digits.length % 2 === 0 ? digits : '0' + digits;
    const words   = encodeMajor(padded, majorWords);
    return { material: words.join(' '), expectedAnswer: digits };
  }
  // recall
  if (cfg.type === 'text') return { material: cfg.customText || '', expectedAnswer: null };
  if (cfg.type === 'digits')  return { material: generateDigits(cfg.length), expectedAnswer: null };
  if (cfg.type === 'letters') return { material: generateLetters(cfg.length), expectedAnswer: null };
  if (cfg.type === 'words')   return { material: generateWords(cfg.length).join(' '), expectedAnswer: null };
  return { material: '', expectedAnswer: null };
}

/** Score an answer against the material */
export function scoreDrill(material, answer, cfg, expectedAnswer) {
  if (cfg.mode === 'encode') {
    return { score: consonantsMatchDigits(answer.trim(), material) ? 100 : 0 };
  }
  if (cfg.mode === 'decode') {
    return { score: answer.trim() === expectedAnswer ? 100 : 0 };
  }
  if (cfg.type === 'words' || cfg.type === 'text') {
    const result = scoreText(material, answer);
    return { score: result.score, textResult: result };
  }
  return { score: scoreExact(material, answer) };
}
