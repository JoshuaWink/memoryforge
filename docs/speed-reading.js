// ═════════════════════════════════════════════════════════════════════════════
//  SPEED READING SYSTEM — speed-reading.js
//  Global-variable pattern (no ES modules) — loaded after app.js
// ═════════════════════════════════════════════════════════════════════════════

// ── Store ─────────────────────────────────────────────────────────────────────
var SR_KEY = 'mf_speed_v1';

var srStore = (function () {
  function defaults() {
    return {
      baseline_wpm: null,
      baseline_comp: null,
      sessions: [],           // {date, wpm, comp, effective_wpm, mode, technique, passage_id}
      schulte_history: [],    // {date, elapsed, errors, size}
      note_attempts: [],      // {date, mode, note, guess, correct, latency_ms}
      mastery: {},            // {T1: 0–1, ...}
      settings: {
        rsvp_wpm: 250,
        phrase_size: 3,
        mask_on: false,
        cursor_on: false,
        bionic: false,
        column_chars: 55,
        indent_mode: false,
        chunk_mode: false,
        peripheral_mode: true,
        guide_opacity: 18,
      },
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(SR_KEY);
      if (!raw) return defaults();
      var s = JSON.parse(raw);
      var d = defaults();
      return Object.assign({}, d, s, { settings: Object.assign({}, d.settings, s.settings || {}) });
    } catch (e) { return defaults(); }
  }

  function persist(st) {
    try { localStorage.setItem(SR_KEY, JSON.stringify(st)); } catch (e) {}
  }

  var _s = load();

  return {
    get: function () { return _s; },
    set: function (p) { _s = Object.assign({}, _s, p); persist(_s); },
    recordSession: function (opts) {
      var session = {
        date: Date.now(),
        wpm: Math.round(opts.wpm),
        comp: parseFloat(opts.comp.toFixed(3)),
        effective_wpm: Math.round(opts.wpm * opts.comp),
        mode: opts.mode || 'free',
        technique: opts.technique || null,
        passage_id: opts.passage_id || null,
      };
      _s = Object.assign({}, _s, { sessions: _s.sessions.concat([session]) });
      persist(_s);
      return session;
    },
    recordSchulte: function (o) {
      _s = Object.assign({}, _s, {
        schulte_history: _s.schulte_history.concat([{ date: Date.now(), elapsed: o.elapsed, errors: o.errors, size: o.size }]),
      });
      persist(_s);
    },
    recordNoteAttempt: function (o) {
      var item = {
        date: Date.now(),
        mode: o.mode,
        note: o.note,
        guess: o.guess,
        correct: !!o.correct,
        latency_ms: Math.max(0, Math.round(o.latency_ms || 0)),
      };
      _s = Object.assign({}, _s, { note_attempts: _s.note_attempts.concat([item]).slice(-1000) });
      persist(_s);
      return item;
    },
    updateMastery: function (id, o) {
      var cur = _s.mastery[id] || 0;
      var score = Math.min(1, ((o.wpm_pct_gain || 0) / 100) * 0.5 + (o.comp || 0.5) * 0.5);
      var updated = Math.min(1, cur * 0.75 + score * 0.25);
      var m = Object.assign({}, _s.mastery);
      m[id] = parseFloat(updated.toFixed(3));
      _s = Object.assign({}, _s, { mastery: m });
      persist(_s);
    },
    getSetting: function (k) { return _s.settings[k]; },
    setSetting: function (p) {
      _s = Object.assign({}, _s, { settings: Object.assign({}, _s.settings, p) });
      persist(_s);
    },
    currentWpm: function () {
      var r = _s.sessions.filter(function (s) { return s.wpm > 0; }).slice(-5);
      if (!r.length) return _s.baseline_wpm;
      return Math.round(r.reduce(function (a, s) { return a + s.wpm; }, 0) / r.length);
    },
    bestWpm: function () {
      if (!_s.sessions.length) return _s.baseline_wpm;
      return Math.max.apply(null, _s.sessions.map(function (s) { return s.wpm; }));
    },
    clearAll: function () { _s = defaults(); persist(_s); },
    importData: function (data) {
      if (!data) return;
      var d = defaults();
      _s = Object.assign({}, d, data, { settings: Object.assign({}, d.settings, (data.settings || {})) });
      persist(_s);
    },
  };
})();

// ── Passages ──────────────────────────────────────────────────────────────────
var SR_PASSAGES = [
  {
    id: 'p1', title: 'The Printing Press', difficulty: 'Easy', words: 322,
    text: 'In 1440, Johannes Gutenberg introduced movable type printing to Europe, fundamentally transforming human civilization. Before this invention, books were painstakingly copied by hand — a process so slow and expensive that a single Bible might take a monk more than a year to produce. Knowledge was, therefore, a privilege of the wealthy and the church. Gutenberg\'s key innovation was not the printing press itself — basic screw presses had existed for centuries, used to press wine and olive oil — but rather the development of movable metal type. Each letter was cast individually in an alloy of lead, tin, and antimony, chosen because the mixture melted at a low temperature and cooled quickly into sharp, durable shapes. These letters could be arranged into words, inked, pressed onto paper, and then rearranged for the next page. Within fifty years of its invention, the printing press had produced more than twenty million books across Europe. By 1500, printing shops operated in over two hundred and fifty European cities. The price of books fell dramatically — a printed book cost perhaps one-twentieth of a handwritten manuscript. Literacy spread. Ideas could travel faster than armies. The most immediate impact was religious. Martin Luther\'s Ninety-Five Theses, nailed to a church door in 1517, might have remained a local dispute. Instead, printed pamphlets spread his arguments across Europe within weeks, igniting the Protestant Reformation. Scientists also benefited enormously. Astronomers, physicians, and mathematicians could now share precise observations across continents. Gutenberg\'s press set in motion consequences its inventor could not have imagined: universal literacy, the scientific revolution, democracy, and eventually the digital information age.',
    questions: [
      { q: "What was Gutenberg's key innovation?", options: ['Inventing the screw press', 'Developing movable metal type', 'Producing paper from wood pulp', 'Creating illustrated manuscripts'], answer: 1 },
      { q: "What alloy was used for the movable type?", options: ['Iron, copper, and zinc', 'Silver, gold, and tin', 'Lead, tin, and antimony', 'Bronze and mercury'], answer: 2 },
      { q: "How many books were printed within 50 years?", options: ['One million', 'Five million', 'Twenty million', 'One hundred million'], answer: 2 },
      { q: "What was the most immediate impact?", options: ['Scientific advancement', 'Military expansion', 'Religious transformation', 'Agricultural improvement'], answer: 2 },
      { q: "How did the printing press affect book prices?", options: ['Prices doubled', 'Prices stayed the same', 'Fell to about one-twentieth', 'Books became free'], answer: 2 },
    ],
  },
  {
    id: 'p2', title: 'How Memory Works', difficulty: 'Medium', words: 280,
    text: 'Memory is not a recording device. This is perhaps the most important thing neuroscience has discovered about how the mind stores information: memories are not played back, they are reconstructed. Every time you recall something, your brain reassembles it from fragments distributed across multiple neural networks. The hippocampus — a seahorse-shaped structure deep in the temporal lobe — acts as an index, linking these fragments together. But the actual content of the memory — the sounds, images, emotions, and words — is stored in the cortical regions that originally processed them. A memory of a thunderstorm is scattered: the sound lives near auditory cortex, the fear near the amygdala, the visual flash near occipital regions. Memories consolidate through sleep. During slow-wave sleep, the hippocampus replays the day\'s events to the cortex, strengthening the connections between fragments. During REM sleep, the brain integrates new memories with existing ones, finding patterns and making associations. The most important implication of reconstructive memory is that memories change every time they are recalled. The act of remembering is also the act of rewriting. Each retrieval slightly alters the memory\'s emotional tone, its details, its emphasis. This makes spaced repetition so powerful as a learning strategy. When you recall something after a delay, that effortful retrieval triggers a stronger reconsolidation. The memory comes back sharper, with stronger neural connections. By contrast, re-reading the same material repeatedly barely activates consolidation at all. The brain also prunes. Memories not retrieved decay over time, their neural connections weakening.',
    questions: [
      { q: "How does the brain store memories?", options: ['As complete recordings', 'Reconstructed from distributed fragments', 'In a single memory center', 'Through chemical signals only'], answer: 1 },
      { q: "What role does the hippocampus play?", options: ['Stores all memories permanently', 'Acts as an index linking fragments', 'Produces sleep hormones', 'Controls conscious thought'], answer: 1 },
      { q: "When do memories consolidate most?", options: ['During exercise', 'While eating', 'Through sleep', 'During stress'], answer: 2 },
      { q: "Why does spaced repetition work?", options: ['It creates new brain cells', 'Effortful retrieval triggers stronger reconsolidation', 'It reduces anxiety', 'It keeps content fresh in short-term memory'], answer: 1 },
      { q: "What happens to memories not retrieved?", options: ['They are permanently deleted', 'They move to long-term storage', 'Their neural connections weaken and decay', 'They become stronger over time'], answer: 2 },
    ],
  },
  {
    id: 'p3', title: 'The Compound Effect', difficulty: 'Medium', words: 300,
    text: 'Small choices compound into dramatic results over time. This is the central insight behind what some call the compound effect: that tiny, seemingly insignificant decisions, made consistently, accumulate into outcomes far beyond what any single action could produce. The principle operates identically whether applied to wealth, health, skills, or relationships. Consider two people starting identical jobs at the same salary. One spends slightly more than they earn each month; the other saves and invests three percent of income. After ten years, the difference is not merely ten years of savings — it is exponential. Compound interest has been working silently on one side of the ledger. The same logic applies to skill-building. Reading ten pages a day seems trivial. Over a year it produces twenty-four books of knowledge. Over a decade, a library. The challenge with the compound effect is that it is invisible in the short term. The person saving three percent feels no different than the person spending freely, at first. The person reading ten pages sees no immediate advantage. This invisibility makes it psychologically difficult to sustain small good habits. We expect our investments of effort to pay off proportionally and immediately. When they do not, we abandon them. The key insight is not to track the outcome — track the input. Build systems, not goals. The outcome is the lagging indicator; the habit is the leading indicator. If you run the systems correctly, the outcomes follow inevitably.',
    questions: [
      { q: "What is the central insight of the compound effect?", options: ['Big actions produce big results', 'Small consistent choices accumulate dramatically', 'Success requires talent', 'Speed matters more than consistency'], answer: 1 },
      { q: "How many books does reading 10 pages/day produce in a year?", options: ['12 books', '18 books', '24 books', '30 books'], answer: 2 },
      { q: "Why is the compound effect psychologically difficult?", options: ['It requires too much money', 'Results are invisible in the short term', 'It only works for financial gains', 'It requires constant monitoring'], answer: 1 },
      { q: "What should you track instead of outcomes?", options: ['Goals', 'Results', 'Inputs/habits', 'Competitors'], answer: 2 },
      { q: "What is the habit called in relation to outcomes?", options: ['The lagging indicator', 'The leading indicator', 'The invisible driver', 'The compound variable'], answer: 1 },
    ],
  },
  {
    id: 'p4', title: 'Deep Ocean Currents', difficulty: 'Easy', words: 270,
    text: 'The ocean is not still. Beneath its surface runs a vast system of moving water called thermohaline circulation, sometimes called the ocean conveyor belt. Unlike wind-driven surface currents, thermohaline circulation is driven by differences in temperature and salinity. Cold, dense, salty water sinks; warm, less dense water rises to replace it. This creates a slow but enormous movement of water that circles the entire planet. The cycle takes roughly one thousand years to complete. In the North Atlantic, warm surface water flows northeast, releasing heat into the atmosphere and warming Europe. As it cools and becomes denser, it sinks to the deep ocean floor near Greenland and Iceland, then flows slowly south along the ocean bottom. It rises again in the Southern Ocean, circulates through the Indian and Pacific Oceans, and eventually returns to the Atlantic. Thermohaline circulation regulates global climate in ways that extend far beyond the ocean itself. It distributes heat from the tropics toward the poles, moderates temperatures, and carries nutrients from the deep ocean to the surface where they fuel marine ecosystems. Disruptions to this circulation — for example, from large influxes of freshwater from melting ice sheets — can alter climate patterns across entire continents. Some climate models suggest that a significant weakening of the Atlantic portion could cool parts of Europe even as the rest of the planet warms.',
    questions: [
      { q: "What drives thermohaline circulation?", options: ['Wind patterns', 'Differences in temperature and salinity', 'Tidal forces from the moon', 'Underwater volcanic activity'], answer: 1 },
      { q: "How long does one full cycle take?", options: ['100 years', '500 years', '1,000 years', '10,000 years'], answer: 2 },
      { q: "Where does warm Atlantic water sink?", options: ['Near the equator', 'In the Pacific Ocean', 'Near Greenland and Iceland', 'At the South Pole'], answer: 2 },
      { q: "What would disrupt thermohaline circulation?", options: ['Warmer air temperatures', 'Large influxes of freshwater', 'Increased ocean fishing', 'Rising sea levels'], answer: 1 },
      { q: "What does thermohaline circulation carry from deep ocean to surface?", options: ['Salt', 'Heat', 'Nutrients', 'Sediment'], answer: 2 },
    ],
  },
  {
    id: 'p5', title: 'The Psychology of Habit', difficulty: 'Medium', words: 290,
    text: 'Habits form because the brain is always looking for ways to save effort. Every time you repeat a behavior in a consistent context, the brain encodes it more deeply, gradually shifting control from the deliberate prefrontal cortex to the more automatic basal ganglia. This is why habits feel effortless once established — the behavior has literally moved to a different part of the brain. The habit loop has three components: a cue, a routine, and a reward. The cue triggers the behavior. The routine is the behavior itself. The reward reinforces it. Over time, the brain begins to anticipate the reward before the routine even begins — this anticipatory craving is what makes habits sticky. To build a new habit, attach it to an existing cue. This is called habit stacking. To break an old habit, disrupt the cue or replace the routine with a different behavior that delivers a similar reward. Simply suppressing a routine rarely works because the cue and the craving remain. Environment design is more powerful than willpower. If you want to read more, put the book on your pillow. If you want to eat less junk food, do not keep it in the house. The path of least resistance shapes behavior more reliably than intentions. Implementation intentions — specific plans of the form "I will do X at time Y in place Z" — roughly double the likelihood that any new habit will be executed. Specificity converts intention into action.',
    questions: [
      { q: "Where do established habits move in the brain?", options: ['Prefrontal cortex', 'Hippocampus', 'Basal ganglia', 'Cerebellum'], answer: 2 },
      { q: "What are the three components of the habit loop?", options: ['Thought, action, result', 'Cue, routine, reward', 'Motivation, behavior, outcome', 'Trigger, habit, reinforcement'], answer: 1 },
      { q: "What is habit stacking?", options: ['Doing multiple habits simultaneously', 'Attaching a new habit to an existing cue', 'Stacking rewards for completing habits', 'Breaking a habit with another habit'], answer: 1 },
      { q: "What is more powerful than willpower for habit change?", options: ['Motivation', 'Self-discipline', 'Environment design', 'Positive thinking'], answer: 2 },
      { q: "What roughly doubles the likelihood of executing a new habit?", options: ['Social accountability', 'Financial rewards', 'Implementation intentions', 'Daily reminders'], answer: 2 },
    ],
  },
  {
    id: 'p6', title: 'Attention and Focus', difficulty: 'Medium', words: 285,
    text: 'Attention is the scarcest resource in the modern world. Unlike time, which replenishes automatically, attentional capacity can be depleted and must be restored. Research suggests that focused attention requires substantial metabolic resources — the prefrontal cortex, which governs executive function, operates at high energy cost. Sustained focus exhausts this region, leading to decision fatigue, impulsive choices, and shallow thinking. The solution is not to work harder but to manage attention cycles deliberately. Ninety-minute ultradian rhythms govern attention and rest. After roughly ninety minutes of focused work, the brain signals a need to rest through mental drift, physical restlessness, or difficulty concentrating. Ignoring these signals and pressing forward produces diminishing returns — the work continues but quality drops sharply. The practice of deep work — long uninterrupted sessions of cognitively demanding tasks — produces disproportionately valuable outputs. Cal Newport, who coined the term, argues that this capacity is becoming increasingly rare and simultaneously increasingly valuable. Shallow work — emails, quick responses, administrative tasks — can be batched and handled in lower-attention periods. Single-tasking is significantly more effective than multitasking. Research consistently shows that switching between tasks imposes a cognitive switching penalty — the mind requires time to context-switch, and some portion of attention lingers on the previous task. This phenomenon, called attention residue, means that even brief interruptions measurably degrade performance on the subsequent task for several minutes afterward.',
    questions: [
      { q: "What resource can be depleted and must be restored?", options: ['Time', 'Attentional capacity', 'Motivation', 'Physical energy'], answer: 1 },
      { q: "How long are ultradian attention rhythms?", options: ['45 minutes', '60 minutes', '90 minutes', '120 minutes'], answer: 2 },
      { q: "What did Cal Newport call long uninterrupted cognitively demanding work?", options: ['Focused work', 'Deep work', 'Flow work', 'Power work'], answer: 1 },
      { q: "What is attention residue?", options: ['Leftover energy after a task', 'Lingering attention on a previous task after switching', 'A buildup of information over time', 'A type of memory consolidation'], answer: 1 },
      { q: "What is more effective than multitasking?", options: ['Speed reading', 'Single-tasking', 'Task batching', 'Time boxing'], answer: 1 },
    ],
  },
];

function srPassageById(id) {
  return SR_PASSAGES.find(function (p) { return p.id === id; }) || null;
}

// ── Techniques Catalog ────────────────────────────────────────────────────────
var SR_TECHNIQUES = [
  { id: 'T1', name: 'Regression Elimination', stage: 1, summary: 'Stop re-reading words. Use a finger or card to block backward eye movement.', detail: '<h3>Regression Elimination</h3><p>The average reader regresses (re-reads) on about 30% of fixations. Most regressions are unnecessary — the text ahead clarifies what felt confusing. Use a physical guide to prevent backward movement. Trust your brain to process context forward.</p><h4>Practice</h4><ol><li>Place a card below each line as you read, uncovering one line at a time.</li><li>Use your finger moving forward at a steady pace.</li><li>Notice how rarely you actually needed to re-read.</li></ol>' },
  { id: 'T2', name: 'Meta-Guiding', stage: 1, summary: 'Lead your eyes with a pointer. Your visual system follows movement automatically.', detail: '<h3>Meta-Guiding</h3><p>Your eyes are drawn to movement. Moving a finger or pen under each line at your target pace leverages this natural tracking reflex to keep reading speed consistent and forward-moving.</p><h4>Practice</h4><ol><li>Move your finger smoothly under each line at a pace slightly faster than comfortable.</li><li>Gradually increase the pace over several sessions.</li><li>Try the pacing cursor in the Reader view.</li></ol>' },
  { id: 'T3', name: 'Subvocalization Reduction', stage: 1, summary: 'Reduce the inner voice "sounding out" each word. Speech bottleneck limits speed.', detail: '<h3>Subvocalization Reduction</h3><p>Your inner voice speaks at 150–250 WPM — roughly speech rate. If you sound out every word mentally, your speed is capped by speech. The goal is not to eliminate subvocalization entirely but to reduce it for familiar words.</p><h4>Practice</h4><ol><li>Hum a constant tone while reading — this occupies the speech-motor cortex.</li><li>Use RSVP to push words faster than you can subvocalize each one.</li><li>Practice reading word groups (phrases) at a glance.</li></ol>' },
  { id: 'T4', name: 'Fixation Expansion', stage: 2, summary: 'Expand peripheral vision to capture more words per eye stop.', detail: '<h3>Fixation Expansion</h3><p>Each time your eyes stop (fixate), they capture a span of text. Untrained readers fixate on nearly every word. Trained readers expand their fixation span to capture 3–5 words per stop, reducing total stops per line.</p><h4>Practice</h4><ol><li>Use the Schulte table trainer to expand peripheral number detection.</li><li>Practice fixating on the center of each line and reading outward.</li><li>Gradually widen your fixation span.</li></ol>' },
  { id: 'T5', name: 'Previewing / Skimming', stage: 2, summary: 'Scan structure before deep reading. Your brain reads better with a schema.', detail: '<h3>Previewing</h3><p>Before reading an article, spend 60 seconds scanning: read the title, headings, first and last paragraphs, and any bold text. This gives your brain a structural map that makes subsequent deep reading 20–30% more efficient.</p><h4>Practice</h4><ol><li>For any new passage, spend 30–60 seconds previewing structure.</li><li>Form questions based on headings before reading.</li><li>Notice how your comprehension improves with a mental map.</li></ol>' },
  { id: 'T6', name: 'RSVP Reading', stage: 2, summary: 'Rapid Serial Visual Presentation: one word at a time, at speed.', detail: '<h3>RSVP Reading</h3><p>RSVP eliminates saccades (eye movements) entirely by bringing text to a fixed focal point. Each word appears at the center of vision at a controlled rate. This removes the physical movement bottleneck.</p><h4>Practice</h4><ol><li>Start at 250 WPM — slightly faster than comfortable.</li><li>Gradually increase by 25 WPM each session while maintaining 70%+ comprehension.</li><li>Use the RSVP player in this app.</li></ol>' },
  { id: 'T7', name: 'Speed Calibration', stage: 2, summary: 'Measure WPM and comprehension accurately. You can\'t improve what you don\'t measure.', detail: '<h3>Speed Calibration</h3><p>Your reading speed is meaningless without comprehension. Effective WPM = Raw WPM × Comprehension. A 600 WPM read at 40% comprehension is 240 effective WPM — worse than 300 WPM at 90% (270 effective WPM).</p><h4>Practice</h4><ol><li>Use the Assess tool to measure your baseline.</li><li>Always pair speed sessions with comprehension quizzes.</li><li>Target effective WPM improvements, not raw speed.</li></ol>' },
  { id: 'T8', name: 'Column Narrowing', stage: 3, summary: 'Read narrower text columns. Fewer words per line = fewer fixations needed.', detail: '<h3>Column Narrowing</h3><p>Wide columns require many fixations per line. Narrow columns (45–55 characters) allow your trained fixation span to capture entire lines in 2–3 fixations. Newspapers and books use narrow columns for exactly this reason.</p><h4>Practice</h4><ol><li>Read in a narrow column (try 45–55 characters).</li><li>Aim to read most lines in 2–3 eye stops.</li></ol>' },
  { id: 'T9', name: 'Schulte Tables', stage: 3, summary: 'Expand peripheral vision and reduce saccades with this Olympic training tool.', detail: '<h3>Schulte Tables</h3><p>Schulte tables train peripheral vision. You find numbers 1–25 in a 5×5 grid without moving your eyes from the center. Over time your peripheral detection range expands, allowing you to capture more text per fixation.</p><h4>Practice</h4><ol><li>Fix your gaze on the center cell (marked red).</li><li>Find numbers 1–25 using only peripheral vision.</li><li>Target under 30 seconds for a 5×5 grid.</li></ol>' },
  { id: 'T10', name: 'Bionic Reading', stage: 3, summary: 'Bold the first letters of each word — your brain completes the rest.', detail: '<h3>Bionic Reading</h3><p>Bionic reading highlights the first 40–50% of each word in bold. The brain recognizes words primarily from initial letters, so the bolded portion acts as a fixation anchor. This can improve reading speed by 10–20% for some readers.</p><h4>Practice</h4><ol><li>Enable Bionic mode in the Reader view.</li><li>Read several passages and compare WPM and comprehension scores.</li><li>Some readers find it helpful; others find it distracting — test both.</li></ol>' },
  { id: 'T11', name: 'Active Reading (SQ3R)', stage: 4, summary: 'Survey, Question, Read, Recite, Review. Turns passive reading into active engagement.', detail: '<h3>SQ3R — Active Reading</h3><p>A structured reading method that dramatically improves comprehension and retention:</p><ul><li><strong>Survey</strong>: Skim headings and first lines.</li><li><strong>Question</strong>: Turn each heading into a question.</li><li><strong>Read</strong>: Read to answer your questions.</li><li><strong>Recite</strong>: After each section, recall key points from memory.</li><li><strong>Review</strong>: At the end, summarize the whole piece.</li></ul>' },
  { id: 'T12', name: 'Indentation Method', stage: 2, summary: 'Start fixations 1\u20132 words inward from each margin. Peripheral vision captures the edges for free.', detail: '<h3>Indentation Method</h3><p>Standard text spans the full column width. Trained readers never land a fixation on the first or last word \u2014 peripheral vision captures the margins automatically. This technique trains that habit: start and end each fixation 1\u20132 words inward from both margins. Over 5\u201310 sessions, eye stops consolidate toward the center of the line, cutting total fixations per line by 30\u201340%.</p><h4>Why It Works</h4><p>Each fixation has a peripheral reception zone of roughly 4 characters beyond the focal point. Words within that zone are recognized without a direct stop. Margin words fall naturally into this zone once your fixation anchors drift inward.</p><h4>Practice</h4><ol><li>Enable <strong>Margin Fade</strong> in the Reader view \u2014 faded edges train your eye anchor inward.</li><li>Consciously start each line on the 2nd word and stop before the last word.</li><li>After 5 sessions, turn off the fade and maintain the inward anchor from habit alone.</li></ol>' },
  { id: 'T13', name: '3-2-1 Fixation Drill', stage: 3, summary: 'Compress eye stops per sentence from 3 to 2 to 1. Guide dots show exactly where to land.', detail: '<h3>3-2-1 Fixation Drill</h3><p>Untrained readers make 4\u20136 eye stops per line. This drill compresses them deliberately: first practice 3 fixations per sentence, then 2, then 1. Colored guide dots mark exactly where your eyes should land at each stage. This is the method used by Olympic readers and military speed-reading programs.</p><h4>The Math</h4><p>At 3 fixations across a 10-word sentence, each stop covers ~3 words. At 2 fixations, ~5 words. At 1 fixation, nearly the entire sentence is perceived through central and peripheral vision combined. Each compression level roughly doubles your effective processing rate.</p><h4>Practice</h4><ol><li>Open the <strong>3-2-1 Fixation Drill</strong> below.</li><li>Land your gaze exactly on the colored dots \u2014 resist drifting to nearby words.</li><li>If comprehension drops below 70%, stay at the current level for another session before advancing.</li></ol>' },
  { id: 'T14', name: 'Phrase Chunking', stage: 2, summary: 'Read semantic groups as single visual units. One fixation per phrase instead of one per word.', detail: '<h3>Phrase Chunking</h3><p>Language is structured in semantic units: noun phrases, verb phrases, clauses. Word-by-word reading ignores this structure and fragments meaning. Phrase chunking trains you to perceive these groups as single visual units \u2014 one fixation per chunk instead of one per word.</p><h4>The Grammar Connection</h4><p>The brain processes language in bursts aligned with phrase boundaries: commas, conjunctions, clause markers. Aligning your eye stops with these natural breaks synchronizes reading mechanics with language processing \u2014 producing speed gains without comprehension loss.</p><h4>Practice</h4><ol><li>Enable <strong>Phrase Chunks</strong> in the Reader view \u2014 alternating colors mark each chunk boundary.</li><li>Aim for one fixation at the center of each colored group.</li><li>Gradually reduce dwell time per chunk as your brain learns to process the group as a single unit.</li></ol>' },
  { id: 'T15', name: 'Soft Focus / Wide Reception', stage: 3, summary: 'Relax the eyes at a center point. Peripheral vision handles the line edges without extra eye movement.', detail: '<h3>Soft Focus / Wide Reception</h3><p>Hard focus on individual words is the default reading mode \u2014 and it limits your field. Soft focus means relaxing the eyes at a center point and letting peripheral vision carry the edges of the line. Athletes call this court awareness. Speed readers use it to expand the effective reading window without adding eye movements.</p><h4>The Physiology</h4><p>The fovea (sharp central vision) spans about 2 degrees \u2014 roughly 4\u20135 characters. The parafovea extends 10 degrees each side \u2014 roughly 10\u201314 characters. With soft focus, you actively recruit parafoveal processing, effectively doubling the usable reading window per fixation at zero extra cost.</p><h4>Practice</h4><ol><li>Open the <strong>Soft Focus Drill</strong> below.</li><li>Fix your gaze on the red center word. Relax your eyes \u2014 do not shift focus to read edge words.</li><li>After each display fades, answer the quiz from peripheral memory alone. Build the habit over 10+ sessions.</li></ol>' },
];

function srTechniqueById(id) {
  return SR_TECHNIQUES.find(function (t) { return t.id === id; }) || null;
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function srGearForWpm(wpm) {
  if (!wpm || wpm < 150) return { gear: 1, name: 'Study',   range: '<150' };
  if (wpm < 250)         return { gear: 2, name: 'Careful', range: '150–250' };
  if (wpm < 400)         return { gear: 3, name: 'Normal',  range: '250–400' };
  if (wpm < 600)         return { gear: 4, name: 'Rapid',   range: '400–600' };
  return                        { gear: 5, name: 'Skim',    range: '600+' };
}

function srFormatTime(ms) {
  var s = Math.floor(ms / 1000);
  var m = Math.floor(s / 60);
  return m + ':' + String(s % 60).padStart(2, '0');
}

function srBionic(text) {
  return escapeHtml(text).replace(/\b([a-zA-Z]{2,})\b/g, function (word) {
    var n = Math.max(1, Math.ceil(word.length * 0.45));
    return '<b>' + word.slice(0, n) + '</b>' + word.slice(n);
  });
}

function srChunkText(text) {
  // Split text into phrase chunks at natural language boundaries
  var BOUNDARY = /^(and|or|but|so|yet|nor|for|that|which|who|whom|when|where|because|although|however|therefore|thus|while|before|after|since|if|unless|until|though|as)$/i;
  var words = text.split(/\s+/);
  var chunks = [];
  var cur = [];
  words.forEach(function (word) {
    var hasPunct = /[,;:]$/.test(word);
    cur.push(word);
    var bare = word.replace(/[,;:.]$/, '');
    if (hasPunct || BOUNDARY.test(bare)) {
      chunks.push(cur.join(' '));
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur.join(' '));
  return chunks.map(function (chunk, i) {
    var cls = i % 2 === 0 ? 'sr-chunk sr-chunk-even' : 'sr-chunk sr-chunk-odd';
    return '<span class="' + cls + '">' + escapeHtml(chunk) + '</span>';
  }).join(' ');
}

function srOrpIndex(word) {
  var len = word.replace(/[^a-zA-Z]/g, '').length;
  if (len <= 1) return 0;
  if (len <= 5) return 0;
  if (len <= 9) return 1;
  if (len <= 13) return 2;
  return 3;
}

function srRenderOrpWord(word) {
  var pos = srOrpIndex(word);
  return '<span class="sr-orp-b">' + escapeHtml(word.slice(0, pos)) + '</span>' +
         '<span class="sr-orp-p">' + escapeHtml(word.slice(pos, pos + 1)) + '</span>' +
         '<span class="sr-orp-a">' + escapeHtml(word.slice(pos + 1)) + '</span>';
}

function srGearHtml(wpm) {
  var g = srGearForWpm(wpm);
  var html = '<div class="sr-gear-track" aria-label="Reading gear">';
  for (var i = 1; i <= 5; i++) {
    html += '<div class="sr-gear-item' + (i === g.gear ? ' active' : '') + '" aria-current="' + (i === g.gear ? 'true' : 'false') + '">' + i + '</div>';
  }
  html += '</div><div class="sr-gear-label">Gear ' + g.gear + ' — ' + g.name + ' (' + g.range + ' WPM)</div>';
  return html;
}

// ── RSVP Engine ───────────────────────────────────────────────────────────────
function RSVPEngine(opts) {
  this.wpm = Math.max(60, Math.min(1200, opts.wpm || 250));
  this.phraseSize = Math.max(1, Math.min(3, opts.phraseSize || 1));
  this.onToken    = opts.onToken    || function () {};
  this.onComplete = opts.onComplete || function () {};
  this.onProgress = opts.onProgress || function () {};
  this.tokens = this._tokenize(opts.text || '', this.phraseSize);
  this.index = 0;
  this._timer = null;
  this._paused = true;
  this._done = false;
}

RSVPEngine.prototype._tokenize = function (text, size) {
  var words = text.trim().split(/\s+/).filter(Boolean);
  if (size === 1) return words;
  var out = [];
  for (var i = 0; i < words.length; i += size) out.push(words.slice(i, i + size).join(' '));
  return out;
};

RSVPEngine.prototype._interval = function (token) {
  var base = (60000 / this.wpm) * this.phraseSize;
  if (/[.!?]["']?\s*$/.test(token) && token.length > 2) return base * 1.5;
  if (token.length > 12) return base * 1.15;
  return base;
};

RSVPEngine.prototype.start = function () {
  if (this._done) return;
  this._paused = false;
  this._tick();
};

RSVPEngine.prototype._tick = function () {
  var self = this;
  if (self._paused || self._done) return;
  if (self.index >= self.tokens.length) {
    self._done = true;
    self.onComplete();
    return;
  }
  var token = self.tokens[self.index];
  self.onToken(token, self.index, self.tokens.length);
  self.onProgress(self.index / self.tokens.length);
  self.index++;
  self._timer = setTimeout(function () { self._tick(); }, self._interval(token));
};

RSVPEngine.prototype.pause = function () {
  this._paused = true;
  clearTimeout(this._timer);
  this._timer = null;
};

RSVPEngine.prototype.resume = function () {
  if (!this._paused || this._done) return;
  this._paused = false;
  this._tick();
};

RSVPEngine.prototype.restart = function () {
  this.pause();
  this.index = 0;
  this._done = false;
  this.start();
};

RSVPEngine.prototype.prevSentence = function () {
  var i = Math.max(0, this.index - 2);
  while (i > 0 && !/[.!?]["']?\s*$/.test(this.tokens[i - 1])) i--;
  this.index = i;
};

RSVPEngine.prototype.setWpm = function (wpm) { this.wpm = Math.max(60, Math.min(1200, wpm)); };
RSVPEngine.prototype.destroy = function () { clearTimeout(this._timer); this._paused = true; };

Object.defineProperty(RSVPEngine.prototype, 'isRunning', { get: function () { return !this._paused && !this._done; } });
Object.defineProperty(RSVPEngine.prototype, 'totalTokens', { get: function () { return this.tokens.length; } });

// ── Schulte Game ──────────────────────────────────────────────────────────────
function SchulteGame(opts) {
  this.size = opts.size || 5;
  this.total = this.size * this.size;
  this.grid = this._shuffle();
  this.next = 1;
  this.errors = 0;
  this.startTime = null;
  this.endTime = null;
  this.onCorrect  = opts.onCorrect  || function () {};
  this.onError    = opts.onError    || function () {};
  this.onComplete = opts.onComplete || function () {};
  this._started = false;
}

SchulteGame.prototype._shuffle = function () {
  var nums = [];
  for (var i = 1; i <= this.total; i++) nums.push(i);
  for (var i = nums.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = nums[i]; nums[i] = nums[j]; nums[j] = t;
  }
  return nums;
};

SchulteGame.prototype.start = function () { this.startTime = Date.now(); this._started = true; };

SchulteGame.prototype.click = function (value) {
  if (!this._started) this.start();
  if (value === this.next) {
    this.next++;
    this.onCorrect(value);
    if (this.next > this.total) {
      this.endTime = Date.now();
      this.onComplete({ elapsed_ms: this.endTime - this.startTime, errors: this.errors });
    }
    return true;
  } else {
    this.errors++;
    this.onError(value, this.next);
    return false;
  }
};

Object.defineProperty(SchulteGame.prototype, 'isComplete', { get: function () { return this.next > this.total; } });
Object.defineProperty(SchulteGame.prototype, 'elapsedMs',  { get: function () { return this.startTime ? (this.endTime || Date.now()) - this.startTime : 0; } });

// ── Quiz Renderer ─────────────────────────────────────────────────────────────
function srRenderQuiz(container, questions, onComplete) {
  var current = 0;
  var answers = [];

  function show(idx) {
    var q = questions[idx];
    container.innerHTML =
      '<div class="sr-quiz-card">' +
        '<div class="sr-quiz-progress">Question ' + (idx + 1) + ' of ' + questions.length + '</div>' +
        '<p class="sr-quiz-question">' + escapeHtml(q.q) + '</p>' +
        '<div class="sr-quiz-options">' +
          q.options.map(function (opt, i) {
            return '<button class="btn sr-quiz-option" data-idx="' + i + '">' + escapeHtml(opt) + '</button>';
          }).join('') +
        '</div>' +
      '</div>';

    container.querySelectorAll('.sr-quiz-option').forEach(function (btn) {
      btn.addEventListener('click', function () { choose(btn, q, parseInt(btn.dataset.idx)); });
    });
  }

  function choose(btn, q, chosen) {
    answers.push({ chosen: chosen, correct: q.answer });
    container.querySelectorAll('.sr-quiz-option').forEach(function (b, i) {
      b.disabled = true;
      if (i === q.answer) b.classList.add('correct');
      else if (i === chosen && chosen !== q.answer) b.classList.add('wrong');
    });
    setTimeout(function () {
      current++;
      if (current < questions.length) {
        show(current);
      } else {
        var score = answers.filter(function (a) { return a.chosen === a.correct; }).length / answers.length;
        onComplete(score, answers);
      }
    }, 900);
  }

  show(0);
}

// ── Chart Helpers ─────────────────────────────────────────────────────────────
var SR_CHART = (function () {
  var BG = '#16213e', GRID = '#2a2a45', MUTED = '#888';
  var PRIMARY = '#4fc3f7', SUCCESS = '#66bb6a', WARN = '#ffa726', ERR = '#ef5350';

  function setup(canvas) {
    var rect = canvas.getBoundingClientRect();
    var r = window.devicePixelRatio || 1;
    canvas.width = rect.width * r;
    canvas.height = rect.height * r;
    var ctx = canvas.getContext('2d');
    ctx.scale(r, r);
    return { ctx: ctx, W: rect.width, H: rect.height };
  }

  function noData(ctx, W, H) {
    ctx.fillStyle = MUTED; ctx.font = '13px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('No data yet — complete a session first.', W / 2, H / 2);
  }

  return {
    line: function (canvas, datasets, yLabel) {
      var s = setup(canvas); var ctx = s.ctx, W = s.W, H = s.H;
      var p = { t: 20, r: 20, b: 40, l: 54 };
      var w = W - p.l - p.r, h = H - p.t - p.b;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
      var allVals = datasets.reduce(function (a, d) { return a.concat(d.data); }, []);
      if (!allVals.length) { noData(ctx, W, H); return; }
      var max = Math.max.apply(null, allVals) * 1.1 || 1;
      var n = Math.max.apply(null, datasets.map(function (d) { return d.data.length; }));
      for (var i = 0; i <= 4; i++) {
        var y = p.t + h * (1 - i / 4);
        ctx.strokeStyle = GRID; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.l, y); ctx.lineTo(p.l + w, y); ctx.stroke();
        ctx.fillStyle = MUTED; ctx.font = '11px system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(max * i / 4), p.l - 6, y);
      }
      datasets.forEach(function (d) {
        if (!d.data.length) return;
        ctx.strokeStyle = d.color || PRIMARY; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath();
        d.data.forEach(function (v, i) {
          var x = p.l + w * (i / Math.max(1, n - 1)); var y = p.t + h * (1 - v / max);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        d.data.forEach(function (v, i) {
          var x = p.l + w * (i / Math.max(1, n - 1)); var y2 = p.t + h * (1 - v / max);
          ctx.beginPath(); ctx.arc(x, y2, 3.5, 0, Math.PI * 2); ctx.fillStyle = d.color || PRIMARY; ctx.fill();
        });
      });
      if (yLabel) {
        ctx.save(); ctx.translate(14, p.t + h / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = MUTED; ctx.font = '11px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(yLabel, 0, 0); ctx.restore();
      }
    },

    scatter: function (canvas, points) {
      var s = setup(canvas); var ctx = s.ctx, W = s.W, H = s.H;
      var p = { t: 20, r: 20, b: 48, l: 54 };
      var w = W - p.l - p.r, h = H - p.t - p.b;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
      if (!points.length) { noData(ctx, W, H); return; }
      var maxWpm = Math.max.apply(null, points.map(function (pt) { return pt.wpm; })) * 1.1 || 1;
      var y80 = p.t + h * 0.2;
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(102,187,106,.4)';
      ctx.beginPath(); ctx.moveTo(p.l, y80); ctx.lineTo(p.l + w, y80); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = SUCCESS; ctx.font = '10px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('80% comp', p.l + 4, y80 - 2);
      points.forEach(function (pt) {
        var x = p.l + w * (pt.wpm / maxWpm);
        var y2 = p.t + h * (1 - Math.min(1, pt.comp));
        var c = pt.comp >= 0.8 ? SUCCESS : pt.comp >= 0.6 ? WARN : ERR;
        ctx.beginPath(); ctx.arc(x, y2, 5, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
      });
      ctx.fillStyle = MUTED; ctx.font = '10px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('WPM', p.l + w / 2, H - 16);
    },

    bar: function (canvas, data, labels, color) {
      color = color || '#29b6f6';
      var s = setup(canvas); var ctx = s.ctx, W = s.W, H = s.H;
      var p = { t: 20, r: 20, b: 40, l: 54 };
      var w = W - p.l - p.r, h = H - p.t - p.b;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
      if (!data.length) { noData(ctx, W, H); return; }
      var max = Math.max.apply(null, data) * 1.1 || 1;
      var barW = (w / data.length) * 0.7, gap = (w / data.length) * 0.3;
      for (var i = 0; i <= 4; i++) {
        var y = p.t + h * (1 - i / 4);
        ctx.strokeStyle = GRID; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.l, y); ctx.lineTo(p.l + w, y); ctx.stroke();
        ctx.fillStyle = MUTED; ctx.font = '11px system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(max * i / 4 / 5) * 5, p.l - 6, y);
      }
      data.forEach(function (v, i) {
        var x = p.l + (w / data.length) * i + gap / 2;
        var bh = h * (v / max); var y2 = p.t + h - bh;
        ctx.fillStyle = color; ctx.fillRect(x, y2, barW, bh);
      });
      if (labels.length) {
        ctx.fillStyle = MUTED; ctx.font = '10px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        var step = Math.ceil(labels.length / 8);
        labels.forEach(function (l, i) {
          if (i % step === 0) { var x = p.l + (w / data.length) * i + (w / data.length) / 2; ctx.fillText(l, x, H - 28); }
        });
      }
    },
  };
})();

// ── Panel Management ──────────────────────────────────────────────────────────
var _srCurrentPanel = 'sr-home';

function srShowPanel(id) {
  var view = document.getElementById('view-speed-reading');
  if (!view) return;
  _srCurrentPanel = id;
  view.querySelectorAll('.sr-panel').forEach(function (p) {
    p.style.display = p.id === id ? '' : 'none';
  });
  view.querySelectorAll('.sr-tab').forEach(function (t) {
    var tabPanel = 'sr-' + t.dataset.srTab;
    t.classList.toggle('active', tabPanel === id);
  });
}

// Called from app.js when navigating to view-speed-reading
function srOnActivate() {
  srShowPanel('sr-home');
  srRenderHome();
}
window.srOnActivate = srOnActivate;

// Shared HTML escaping utility
function escapeHtml(s) {
  var div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function srModeShell(titleHtml, instructionHtml, bodyHtml) {
  return '<div class="sr-mode-shell">' +
    '<div class="sr-mode-shell__header">' +
      '<h2 class="section-title">' + titleHtml + '</h2>' +
      (instructionHtml ? '<p class="sr-instr">' + instructionHtml + '</p>' : '') +
    '</div>' +
    bodyHtml +
  '</div>';
}

function srModeSurface(innerHtml) {
  return '<section class="sr-mode-surface">' + innerHtml + '</section>';
}

// Passage picker (shared by Assess, RSVP, Reader)
function srPassagePicker(container, onSelect) {
  container.innerHTML =
    '<h3 class="section-title">Choose a Passage</h3>' +
    '<div class="sr-passage-grid">' +
    SR_PASSAGES.map(function (p) {
      return '<button class="sr-passage-card" data-pid="' + p.id + '">' +
        '<div class="sr-passage-title">' + escapeHtml(p.title) + '</div>' +
        '<div class="sr-passage-meta">' + p.difficulty + ' · ' + p.words + ' words</div>' +
        '</button>';
    }).join('') +
    '</div>';

  container.querySelectorAll('.sr-passage-card').forEach(function (btn) {
    btn.addEventListener('click', function () { onSelect(btn.dataset.pid); });
  });
}

// ── Home Panel ────────────────────────────────────────────────────────────────
function srRenderHome() {
  var st = srStore.get();
  var wpm = srStore.currentWpm();
  var best = srStore.bestWpm();
  var sessions = st.sessions.length;
  var g = wpm ? srGearForWpm(wpm) : null;

  var html = '<h2 class="section-title">Speed Reading</h2>';

  if (!st.baseline_wpm) {
    html +=
      '<div class="sr-hero">' +
        '<p class="sr-hero__text">Take a 2-minute assessment to find your baseline reading speed and comprehension score.</p>' +
        '<button class="btn btn-primary btn-lg" id="sr-btn-start-assess">Start Assessment →</button>' +
      '</div>';
  } else {
    html +=
      '<div class="sr-stats-grid">' +
        '<div class="sr-stat-card"><div class="sr-stat-val">' + (wpm || '–') + '</div><div class="sr-stat-lbl">Current WPM</div></div>' +
        '<div class="sr-stat-card"><div class="sr-stat-val">' + (best || '–') + '</div><div class="sr-stat-lbl">Best WPM</div></div>' +
        '<div class="sr-stat-card"><div class="sr-stat-val">' + sessions + '</div><div class="sr-stat-lbl">Sessions</div></div>' +
        '<div class="sr-stat-card"><div class="sr-stat-val">' + st.baseline_wpm + '</div><div class="sr-stat-lbl">Baseline WPM</div></div>' +
      '</div>';
    if (g) html += '<div class="sr-gear-block">' + srGearHtml(wpm) + '</div>';
  }

  html +=
    '<div class="sr-mode-grid">' +
      '<button class="sr-mode-card" id="sr-btn-rsvp"><div class="sr-mode-icon">⚡</div><div class="sr-mode-name">Guided Reading</div><div class="sr-mode-desc">Follow the guide at your pace</div></button>' +
      '<button class="sr-mode-card" id="sr-btn-reader"><div class="sr-mode-icon">📖</div><div class="sr-mode-name">Reader</div><div class="sr-mode-desc">Pace with mask & cursor</div></button>' +
      '<button class="sr-mode-card" id="sr-btn-music"><div class="sr-mode-icon">🎵</div><div class="sr-mode-name">Music Notes</div><div class="sr-mode-desc">Hear or see notes, then name them</div></button>' +
      '<button class="sr-mode-card" id="sr-btn-schulte"><div class="sr-mode-icon">🎯</div><div class="sr-mode-name">Focus</div><div class="sr-mode-desc">Schulte peripheral vision</div></button>' +
      '<button class="sr-mode-card" id="sr-btn-assess"><div class="sr-mode-icon">📊</div><div class="sr-mode-name">Assess</div><div class="sr-mode-desc">Measure your speed</div></button>' +
    '</div>';

  document.getElementById('sr-home-content').innerHTML = html;

  var assessBtn = document.getElementById('sr-btn-start-assess');
  if (assessBtn) assessBtn.addEventListener('click', function () { srShowAssess(); });

  document.getElementById('sr-btn-rsvp').addEventListener('click', function () { srShowRsvp(); });
  document.getElementById('sr-btn-reader').addEventListener('click', function () { srShowReader(); });
  document.getElementById('sr-btn-music').addEventListener('click', function () { srShowMusic(); });
  document.getElementById('sr-btn-schulte').addEventListener('click', function () { srShowSchulte(); });
  document.getElementById('sr-btn-assess').addEventListener('click', function () { srShowAssess(); });
}

// ── Assess Flow ───────────────────────────────────────────────────────────────
var _srAssessPassage = null;
var _srAssessStart = null;
var _srAssessWpm = null;

function srShowAssess() {
  srShowPanel('sr-assess');
  var content = document.getElementById('sr-assess-content');
  content.innerHTML = srModeShell(
    'Baseline Assessment',
    'Pick a passage, read it at your normal comfortable pace, then click <strong>Done</strong>. A comprehension quiz follows.',
    srModeSurface('<div id="sr-assess-picker"></div>')
  );
  srPassagePicker(document.getElementById('sr-assess-picker'), function (pid) {
    _srAssessPassage = srPassageById(pid);
    srAssessShowReady();
  });
}

function srAssessShowReady() {
  var content = document.getElementById('sr-assess-content');
  var p = _srAssessPassage;
  content.innerHTML = srModeShell(
    escapeHtml(p.title),
    'Click <strong>Start</strong> when you are ready to begin reading. Click <strong>Done</strong> when you finish.',
    srModeSurface(
      '<div class="sr-action-row" id="sr-assess-start-row">' +
        '<button class="btn btn-primary" id="sr-assess-start-btn">Start Reading</button>' +
      '</div>' +
      '<div id="sr-assess-reading" style="display:none">' +
        '<div class="sr-reader-pane" id="sr-assess-text">' + escapeHtml(p.text) + '</div>' +
        '<div class="sr-action-row">' +
          '<button class="btn btn-primary" id="sr-assess-done-btn">Done Reading</button>' +
        '</div>' +
      '</div>'
    )
  );

  document.getElementById('sr-assess-start-btn').addEventListener('click', function () {
    _srAssessStart = Date.now();
    document.getElementById('sr-assess-start-row').style.display = 'none';
    document.getElementById('sr-assess-reading').style.display = '';
  });

  document.getElementById('sr-assess-done-btn').addEventListener('click', function () {
    var elapsed_ms = Date.now() - _srAssessStart;
    var elapsed_min = elapsed_ms / 60000;
    _srAssessWpm = Math.round(_srAssessPassage.words / elapsed_min);
    srShowPanel('sr-quiz');
    document.getElementById('sr-quiz-content').innerHTML = '';
    srRenderQuiz(document.getElementById('sr-quiz-content'), _srAssessPassage.questions, function (score) {
      srShowResult(_srAssessWpm, score, _srAssessPassage.id, 'assess');
    });
  });
}

// ── RSVP Flow ─────────────────────────────────────────────────────────────────
var _srRsvpEngine = null;
var _srRsvpPassage = null;
var _srRsvpKeyHandler = null;

function srShowRsvp() {
  srShowPanel('sr-rsvp');
  var content = document.getElementById('sr-rsvp-content');
  var savedWpm = srStore.getSetting('rsvp_wpm') || 250;
  var savedPhrase = srStore.getSetting('phrase_size') || 3;
  var savedPeripheral = srStore.getSetting('peripheral_mode') !== false;
  var savedGuideOpacity = srStore.getSetting('guide_opacity');

  content.innerHTML =
    '<h2 class="section-title">Guided Reading</h2>' +
    '<div class="sr-rsvp-settings">' +
      '<label class="field-label">WPM: <span id="sr-rsvp-wpm-val">' + savedWpm + '</span>' +
        '<input type="range" id="sr-rsvp-wpm-slider" class="sr-slider" min="60" max="800" step="25" value="' + savedWpm + '">' +
      '</label>' +
      '<div class="field-group"><label class="field-label" for="sr-rsvp-phrase">Fixation span</label>' +
        '<select id="sr-rsvp-phrase" class="field-input field-input-sm">' +
          '<option value="1"' + (savedPhrase === 1 ? ' selected' : '') + '>1 word</option>' +
          '<option value="2"' + (savedPhrase === 2 ? ' selected' : '') + '>2 words</option>' +
          '<option value="3"' + (savedPhrase === 3 ? ' selected' : '') + '>3 words</option>' +
        '</select>' +
      '</div>' +
      '<label class="field-label">Guide opacity: <span id="sr-rsvp-guide-opacity-val">' + savedGuideOpacity + '%</span>' +
        '<input type="range" id="sr-rsvp-guide-opacity" class="sr-slider" min="0" max="100" step="5" value="' + savedGuideOpacity + '">' +
      '</label>' +
      '<label class="toggle-row"><span class="toggle-row__label">Peripheral mode</span>' +
        '<input type="checkbox" id="sr-rsvp-peripheral" class="toggle-input"' + (savedPeripheral ? ' checked' : '') + '><span class="toggle-slider"></span></label>' +
    '</div>' +
    '<div id="sr-rsvp-picker"></div>';

  document.getElementById('sr-rsvp-wpm-slider').addEventListener('input', function () {
    document.getElementById('sr-rsvp-wpm-val').textContent = this.value;
    srStore.setSetting({ rsvp_wpm: parseInt(this.value) });
    if (_srRsvpEngine) _srRsvpEngine.setWpm(parseInt(this.value));
  });

  document.getElementById('sr-rsvp-phrase').addEventListener('change', function () {
    srStore.setSetting({ phrase_size: parseInt(this.value) });
  });

  document.getElementById('sr-rsvp-guide-opacity').addEventListener('input', function () {
    var value = parseInt(this.value);
    document.getElementById('sr-rsvp-guide-opacity-val').textContent = value + '%';
    srStore.setSetting({ guide_opacity: value });
  });

  document.getElementById('sr-rsvp-peripheral').addEventListener('change', function () {
    srStore.setSetting({ peripheral_mode: this.checked });
  });

  srPassagePicker(document.getElementById('sr-rsvp-picker'), function (pid) {
    _srRsvpPassage = srPassageById(pid);
    srRsvpStart(_srRsvpPassage);
  });
}

function srRsvpStart(passage) {
  var wpm = srStore.getSetting('rsvp_wpm') || 250;
  var phraseSize = srStore.getSetting('phrase_size') || 3;
  var guideOpacity = srStore.getSetting('guide_opacity');

  if (_srRsvpEngine) _srRsvpEngine.destroy();
  if (_srRsvpKeyHandler) document.removeEventListener('keydown', _srRsvpKeyHandler);

  _srRsvpEngine = new RSVPEngine({ text: passage.text, wpm: wpm, phraseSize: phraseSize,
    onToken: function () {}, onComplete: function () {}, onProgress: function () {},
  });
  var total = _srRsvpEngine.totalTokens;
  var tokens = _srRsvpEngine.tokens;
  var isPeripheral = srStore.getSetting('peripheral_mode') !== false;

  // Build full-text guided reading view.
  // Peripheral mode: each token group renders as individual word spans; only the
  // focal (center) word gets a subtle underline indicator — the reader uses
  // peripheral vision for the surrounding words, training real page-reading eye movement.
  // Word-by-word mode: full chunk highlights as a block.
  var textHtml = tokens.map(function (token, i) {
    if (isPeripheral) {
      var words = token.split(/\s+/);
      var focalIdx = Math.floor(words.length / 2);
      var innerHtml = words.map(function (w, wi) {
        if (wi === focalIdx) {
          return '<span class="sr-guide-word sr-guide-word--focal">' + escapeHtml(w) + '</span>';
        }
        return '<span class="sr-guide-word">' + escapeHtml(w) + '</span>';
      }).join(' ');
      return '<span class="sr-guide-token sr-guide-token--peripheral" data-idx="' + i + '">' + innerHtml + '</span>';
    }
    return '<span class="sr-guide-token" data-idx="' + i + '">' + escapeHtml(token) + '</span>';
  }).join(' ');

  var content = document.getElementById('sr-rsvp-content');
  content.innerHTML =
    '<h2 class="section-title">' + escapeHtml(passage.title) + ' <span class="sr-wpm-badge" id="sr-rsvp-wpm-badge">' + wpm + ' WPM</span></h2>' +
    '<p class="sr-instr">Read this like a normal article. The guide sits under the text and can be faded until you barely need it.</p>' +
    '<div class="sr-progress-bar"><div class="sr-progress-fill" id="sr-rsvp-prog" style="width:0%"></div></div>' +
    '<div class="sr-guide-toolbar">' +
      '<label class="field-label sr-guide-toolbar__label">Guide opacity: <span id="sr-guide-opacity-val">' + guideOpacity + '%</span>' +
        '<input type="range" id="sr-guide-opacity-slider" class="sr-slider" min="0" max="100" step="5" value="' + guideOpacity + '">' +
      '</label>' +
    '</div>' +
    '<article class="sr-guide-text" id="sr-guide-text" aria-live="polite" aria-atomic="false">' + textHtml + '</article>' +
    '<div class="sr-rsvp-token-count" id="sr-rsvp-count">0 / ' + total + '</div>' +
    '<div class="sr-rsvp-controls">' +
      '<button class="btn btn-secondary btn-sm" id="sr-rsvp-prev" title="← Prev sentence">←</button>' +
      '<button class="btn btn-secondary btn-sm" id="sr-rsvp-slower" title=", Slower">−25</button>' +
      '<button class="btn btn-primary" id="sr-rsvp-playpause">▶ Play</button>' +
      '<button class="btn btn-secondary btn-sm" id="sr-rsvp-faster" title=". Faster">+25</button>' +
      '<button class="btn btn-secondary btn-sm" id="sr-rsvp-restart" title="R Restart">↺</button>' +
    '</div>' +
    '<p class="sr-kbd-hint">Space=play/pause &nbsp; , / . = ±25 WPM &nbsp; ← = prev sentence &nbsp; R = restart</p>';

  var tokenEls = content.querySelectorAll('.sr-guide-token');
  var lastActiveIdx = -1;
  var guideEl = document.getElementById('sr-guide-text');

  function applyGuideOpacity(value) {
    guideEl.style.setProperty('--sr-guide-opacity', String(value / 100));
    document.getElementById('sr-guide-opacity-val').textContent = value + '%';
  }

  applyGuideOpacity(guideOpacity);

  document.getElementById('sr-guide-opacity-slider').addEventListener('input', function () {
    var value = parseInt(this.value);
    srStore.setSetting({ guide_opacity: value });
    applyGuideOpacity(value);
  });

  function highlight(idx) {
    if (lastActiveIdx >= 0 && tokenEls[lastActiveIdx]) {
      tokenEls[lastActiveIdx].classList.remove('sr-guide-token--active');
      tokenEls[lastActiveIdx].classList.add('sr-guide-token--done');
    }
    if (tokenEls[idx]) {
      tokenEls[idx].classList.add('sr-guide-token--active');
      tokenEls[idx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    lastActiveIdx = idx;
  }

  function clearHighlightsFrom(fromIdx) {
    for (var i = fromIdx; i <= lastActiveIdx; i++) {
      if (tokenEls[i]) tokenEls[i].classList.remove('sr-guide-token--active', 'sr-guide-token--done');
    }
    lastActiveIdx = fromIdx - 1;
  }

  function updateCount(idx) {
    document.getElementById('sr-rsvp-count').textContent = idx + ' / ' + total;
  }

  function updateProgress(pct) {
    document.getElementById('sr-rsvp-prog').style.width = (pct * 100) + '%';
  }

  _srRsvpEngine.onToken = function (token, idx) { highlight(idx); updateCount(idx + 1); };
  _srRsvpEngine.onProgress = updateProgress;
  _srRsvpEngine.onComplete = function () {
    if (lastActiveIdx >= 0 && tokenEls[lastActiveIdx]) {
      tokenEls[lastActiveIdx].classList.remove('sr-guide-token--active');
    }
    if (_srRsvpKeyHandler) document.removeEventListener('keydown', _srRsvpKeyHandler);
    srShowPanel('sr-quiz');
    srRenderQuiz(document.getElementById('sr-quiz-content'), passage.questions, function (score) {
      srShowResult(_srRsvpEngine.wpm, score, passage.id, 'rsvp');
      srStore.updateMastery('T6', { wpm_pct_gain: 20, comp: score });
    });
  };

  var btn = document.getElementById('sr-rsvp-playpause');

  function togglePlay() {
    if (_srRsvpEngine.isRunning) {
      _srRsvpEngine.pause();
      btn.textContent = '▶ Play';
    } else {
      _srRsvpEngine.start();
      btn.textContent = '⏸ Pause';
    }
  }

  function adjustWpm(delta) {
    var newWpm = Math.max(60, Math.min(800, _srRsvpEngine.wpm + delta));
    _srRsvpEngine.setWpm(newWpm);
    srStore.setSetting({ rsvp_wpm: newWpm });
    document.getElementById('sr-rsvp-wpm-badge').textContent = newWpm + ' WPM';
  }

  btn.addEventListener('click', togglePlay);
  document.getElementById('sr-rsvp-slower').addEventListener('click', function () { adjustWpm(-25); });
  document.getElementById('sr-rsvp-faster').addEventListener('click', function () { adjustWpm(+25); });
  document.getElementById('sr-rsvp-prev').addEventListener('click', function () {
    _srRsvpEngine.prevSentence();
    clearHighlightsFrom(_srRsvpEngine.index);
  });
  document.getElementById('sr-rsvp-restart').addEventListener('click', function () {
    clearHighlightsFrom(0);
    document.getElementById('sr-rsvp-prog').style.width = '0%';
    document.getElementById('sr-rsvp-count').textContent = '0 / ' + total;
    _srRsvpEngine.restart();
    btn.textContent = '⏸ Pause';
    // Scroll guide text back to top
    var guide = document.getElementById('sr-guide-text');
    if (guide) guide.scrollTop = 0;
  });

  _srRsvpKeyHandler = function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (_srCurrentPanel !== 'sr-rsvp') return;
    if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    else if (e.key === ',') adjustWpm(-25);
    else if (e.key === '.') adjustWpm(+25);
    else if (e.key === 'ArrowLeft') {
      _srRsvpEngine.prevSentence();
      clearHighlightsFrom(_srRsvpEngine.index);
    }
    else if (e.key.toLowerCase() === 'r') {
      clearHighlightsFrom(0);
      document.getElementById('sr-rsvp-prog').style.width = '0%';
      document.getElementById('sr-rsvp-count').textContent = '0 / ' + total;
      var guide = document.getElementById('sr-guide-text');
      if (guide) guide.scrollTop = 0;
      _srRsvpEngine.restart();
      btn.textContent = '⏸ Pause';
    }
  };
  document.addEventListener('keydown', _srRsvpKeyHandler);
}

// ── Reader Flow ───────────────────────────────────────────────────────────────
var _srReaderRaf = null;
var _srReaderStart = null;
var _srReaderPassage = null;

function srShowReader() {
  if (_srReaderRaf) { cancelAnimationFrame(_srReaderRaf); _srReaderRaf = null; }
  srShowPanel('sr-reader');
  var content = document.getElementById('sr-reader-content');
  var maskOn   = srStore.getSetting('mask_on');
  var cursorOn = srStore.getSetting('cursor_on');
  var bionic     = srStore.getSetting('bionic');
  var indentMode = srStore.getSetting('indent_mode');
  var chunkMode  = srStore.getSetting('chunk_mode');
  var wpm        = srStore.getSetting('rsvp_wpm') || 250;

  content.innerHTML = srModeShell(
    'Free Reader',
    'Choose a passage and turn on whichever pacing aids you want for this session.',
    srModeSurface(
      '<div class="sr-reader-settings">' +
        '<label class="toggle-row"><span class="toggle-row__label">Coverage Mask</span>' +
          '<input type="checkbox" id="sr-mask-toggle" class="toggle-input"' + (maskOn ? ' checked' : '') + '><span class="toggle-slider"></span></label>' +
        '<label class="toggle-row"><span class="toggle-row__label">Pacing Cursor</span>' +
          '<input type="checkbox" id="sr-cursor-toggle" class="toggle-input"' + (cursorOn ? ' checked' : '') + '><span class="toggle-slider"></span></label>' +
        '<label class="toggle-row"><span class="toggle-row__label">Bionic Reading</span>' +
          '<input type="checkbox" id="sr-bionic-toggle" class="toggle-input"' + (bionic ? ' checked' : '') + '><span class="toggle-slider"></span></label>' +
        '<label class="toggle-row"><span class="toggle-row__label">Margin Fade</span>' +
          '<input type="checkbox" id="sr-indent-toggle" class="toggle-input"' + (indentMode ? ' checked' : '') + '><span class="toggle-slider"></span></label>' +
        '<label class="toggle-row"><span class="toggle-row__label">Phrase Chunks</span>' +
          '<input type="checkbox" id="sr-chunk-toggle" class="toggle-input"' + (chunkMode ? ' checked' : '') + '><span class="toggle-slider"></span></label>' +
        '<label class="field-label">Pacing WPM: <span id="sr-reader-wpm-val">' + wpm + '</span>' +
          '<input type="range" id="sr-reader-wpm" class="sr-slider" min="60" max="800" step="25" value="' + wpm + '"></label>' +
      '</div>' +
      '<div id="sr-reader-picker"></div>'
    )
  );

  document.getElementById('sr-mask-toggle').addEventListener('change', function () { srStore.setSetting({ mask_on: this.checked }); });
  document.getElementById('sr-cursor-toggle').addEventListener('change', function () { srStore.setSetting({ cursor_on: this.checked }); });
  document.getElementById('sr-bionic-toggle').addEventListener('change', function () { srStore.setSetting({ bionic: this.checked }); });
  document.getElementById('sr-indent-toggle').addEventListener('change', function () { srStore.setSetting({ indent_mode: this.checked }); });
  document.getElementById('sr-chunk-toggle').addEventListener('change', function () { srStore.setSetting({ chunk_mode: this.checked }); });
  document.getElementById('sr-reader-wpm').addEventListener('input', function () {
    document.getElementById('sr-reader-wpm-val').textContent = this.value;
    srStore.setSetting({ rsvp_wpm: parseInt(this.value) });
  });

  srPassagePicker(document.getElementById('sr-reader-picker'), function (pid) {
    _srReaderPassage = srPassageById(pid);
    srReaderStart(_srReaderPassage);
  });
}

function srReaderStart(passage) {
  if (_srReaderRaf) { cancelAnimationFrame(_srReaderRaf); _srReaderRaf = null; }
  var maskOn   = srStore.getSetting('mask_on');
  var cursorOn = srStore.getSetting('cursor_on');
  var bionic      = srStore.getSetting('bionic');
  var indentMode  = srStore.getSetting('indent_mode');
  var chunkMode   = srStore.getSetting('chunk_mode');
  var wpm         = srStore.getSetting('rsvp_wpm') || 250;
  var durationMs  = (passage.words / wpm) * 60 * 1000;

  var textHtml = bionic ? srBionic(passage.text) : (chunkMode ? srChunkText(passage.text) : escapeHtml(passage.text));

  var content = document.getElementById('sr-reader-content');
  content.innerHTML = srModeShell(
    escapeHtml(passage.title) + ' <span class="sr-wpm-badge">' + wpm + ' WPM</span>',
    'Read along with the pacing guide. Click <strong>Done</strong> when finished.',
    srModeSurface(
      '<div class="sr-reader-pane' + (indentMode ? ' indent-mode' : '') + '" id="sr-reader-pane">' +
        '<div id="sr-reader-text">' + textHtml + '</div>' +
        (maskOn   ? '<div class="sr-coverage-mask" id="sr-mask" style="height:0%"></div>' : '') +
        (cursorOn ? '<div class="sr-pacing-cursor" id="sr-cursor" style="top:0%"></div>' : '') +
      '</div>' +
      '<div class="sr-action-row">' +
        '<button class="btn btn-secondary" id="sr-reader-start-btn">&#9654; Start Pacing</button>' +
        '<button class="btn btn-primary" id="sr-reader-done-btn" style="display:none">Done Reading</button>' +
      '</div>'
    )
  );

  var started = false;

  document.getElementById('sr-reader-start-btn').addEventListener('click', function () {
    this.style.display = 'none';
    document.getElementById('sr-reader-done-btn').style.display = '';
    _srReaderStart = Date.now();
    started = true;
    if (maskOn || cursorOn) srReaderAnimate(durationMs, maskOn, cursorOn);
  });

  document.getElementById('sr-reader-done-btn').addEventListener('click', function () {
    if (_srReaderRaf) { cancelAnimationFrame(_srReaderRaf); _srReaderRaf = null; }
    var elapsedMin;
    if (started && _srReaderStart) {
      elapsedMin = (Date.now() - _srReaderStart) / 60000;
    } else {
      elapsedMin = durationMs / 60000;
    }
    var actualWpm = Math.round(passage.words / elapsedMin);

    srShowPanel('sr-quiz');
    srRenderQuiz(document.getElementById('sr-quiz-content'), passage.questions, function (score) {
      srShowResult(actualWpm, score, passage.id, 'reader');
      if (maskOn) srStore.updateMastery('T1', { wpm_pct_gain: 15, comp: score });
      if (cursorOn) srStore.updateMastery('T2', { wpm_pct_gain: 15, comp: score });
    });
  });
}

function srReaderAnimate(durationMs, maskOn, cursorOn) {
  var start = Date.now();

  function tick() {
    var elapsed = Date.now() - start;
    var pct = Math.min(1, elapsed / durationMs) * 100;

    if (maskOn) {
      var mask = document.getElementById('sr-mask');
      if (mask) mask.style.height = pct + '%';
    }
    if (cursorOn) {
      var cursor = document.getElementById('sr-cursor');
      if (cursor) cursor.style.top = pct + '%';
    }

    if (elapsed < durationMs) {
      _srReaderRaf = requestAnimationFrame(tick);
    }
  }

  _srReaderRaf = requestAnimationFrame(tick);
}

// ── Schulte Flow ──────────────────────────────────────────────────────────────
var _srSchulteGame = null;
var _srSchulteTimerInterval = null;

function srShowSchulte() {
  if (_srSchulteTimerInterval) { clearInterval(_srSchulteTimerInterval); _srSchulteTimerInterval = null; }
  srShowPanel('sr-schulte');
  var content = document.getElementById('sr-schulte-content');
  content.innerHTML = srModeShell(
    'Schulte Tables',
    'Fix your gaze on the <span style="color:var(--cup-color-error)">center cell</span>. Find numbers 1 to N using only peripheral vision.',
    srModeSurface(
      '<div class="sr-action-row">' +
        '<button class="btn btn-primary" id="sr-sch-5">5 × 5</button>' +
        '<button class="btn btn-secondary" id="sr-sch-7">7 × 7</button>' +
      '</div>' +
      '<div id="sr-schulte-game"></div>'
    )
  );

  document.getElementById('sr-sch-5').addEventListener('click', function () { srSchulteRun(5); });
  document.getElementById('sr-sch-7').addEventListener('click', function () { srSchulteRun(7); });
}

function srSchulteRun(size) {
  if (_srSchulteTimerInterval) { clearInterval(_srSchulteTimerInterval); _srSchulteTimerInterval = null; }
  if (_srSchulteGame) {} // just replace

  var gameEl = document.getElementById('sr-schulte-game');
  var center = Math.floor(size / 2);

  _srSchulteGame = new SchulteGame({
    size: size,
    onCorrect: function (val) {
      var cells = gameEl.querySelectorAll('.sr-schulte-cell');
      cells.forEach(function (c) {
        if (parseInt(c.dataset.val) === val) c.classList.add('hit');
      });
    },
    onError: function (val) {
      var cells = gameEl.querySelectorAll('.sr-schulte-cell');
      cells.forEach(function (c) {
        if (parseInt(c.dataset.val) === val) {
          c.classList.add('error');
          setTimeout(function () { c.classList.remove('error'); }, 400);
        }
      });
    },
    onComplete: function (result) {
      if (_srSchulteTimerInterval) { clearInterval(_srSchulteTimerInterval); _srSchulteTimerInterval = null; }
      srStore.recordSchulte({ elapsed: result.elapsed_ms, errors: result.errors, size: size });
      var el = document.getElementById('sr-schulte-game');
      var pb = srSchulteBest(size);
      el.innerHTML +=
        '<div class="sr-schulte-result">' +
          '<div class="sr-schulte-result-time">' + srFormatTime(result.elapsed_ms) + '</div>' +
          '<div>Errors: ' + result.errors + '</div>' +
          (pb ? '<div style="color:var(--cup-color-secondary);font-size:.85rem">Best: ' + srFormatTime(pb) + '</div>' : '') +
          '<button class="btn btn-primary" id="sr-sch-retry" style="margin-top:.5rem">Play Again</button>' +
        '</div>';
      document.getElementById('sr-sch-retry').addEventListener('click', function () { srSchulteRun(size); });
    },
  });

  var html = '<div class="sr-schulte-grid" style="grid-template-columns: repeat(' + size + ', 1fr);">';
  var idx = 0;
  for (var r = 0; r < size; r++) {
    for (var c = 0; c < size; c++) {
      var val = _srSchulteGame.grid[idx++];
      var isCenter = r === center && c === center;
      html += '<button class="sr-schulte-cell' + (isCenter ? ' sr-schulte-center' : '') + '" data-val="' + val + '">' +
        (isCenter
          ? '<span class="sr-schulte-center-value">' + val + '</span><span class="sr-schulte-center-dot" aria-hidden="true">●</span>'
          : val) + '</button>';
    }
  }
  html += '</div><div id="sr-schulte-timer" class="sr-schulte-timer">0:00</div>';
  gameEl.innerHTML = html;

  gameEl.querySelectorAll('.sr-schulte-cell').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (_srSchulteGame.isComplete) return;
      _srSchulteGame.click(parseInt(btn.dataset.val));
    });
  });

  // Timer display
  _srSchulteTimerInterval = setInterval(function () {
    var el = document.getElementById('sr-schulte-timer');
    if (el && !_srSchulteGame.isComplete) el.textContent = srFormatTime(_srSchulteGame.elapsedMs);
  }, 100);
}

function srSchulteBest(size) {
  var hist = srStore.get().schulte_history.filter(function (h) { return h.size === size; });
  if (!hist.length) return null;
  return Math.min.apply(null, hist.map(function (h) { return h.elapsed; }));
}

// ── Music Notes Flow ─────────────────────────────────────────────────────────
var _srMusicAudioCtx = null;
var SR_MUSIC_NOTES = [
  { name: 'C', full: 'C4', freq: 261.63, staffTop: 66 },
  { name: 'D', full: 'D4', freq: 293.66, staffTop: 58 },
  { name: 'E', full: 'E4', freq: 329.63, staffTop: 50 },
  { name: 'F', full: 'F4', freq: 349.23, staffTop: 42 },
  { name: 'G', full: 'G4', freq: 392.0,  staffTop: 34 },
];

function srMusicEnsureAudioCtx() {
  if (_srMusicAudioCtx) return _srMusicAudioCtx;
  var Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  _srMusicAudioCtx = new Ctx();
  return _srMusicAudioCtx;
}

function srMusicPlayTone(freq, durationMs) {
  var ctx = srMusicEnsureAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  var len = durationMs || 420;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + len / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + len / 1000 + 0.02);
}

function srMusicStats() {
  var attempts = srStore.get().note_attempts || [];
  function byMode(mode) {
    var rows = attempts.filter(function (a) { return a.mode === mode; });
    if (!rows.length) return { total: 0, acc: 0, ms: 0 };
    var correct = rows.filter(function (a) { return a.correct; }).length;
    var mean = Math.round(rows.reduce(function (s, r) { return s + r.latency_ms; }, 0) / rows.length);
    return { total: rows.length, acc: Math.round((correct / rows.length) * 100), ms: mean };
  }
  var all = byMode('visual');
  var aud = byMode('audio');
  var total = all.total + aud.total;
  var correct = Math.round(((all.total * all.acc) + (aud.total * aud.acc)) / Math.max(1, total));
  var mean = total ? Math.round(((all.total * all.ms) + (aud.total * aud.ms)) / total) : 0;
  return {
    total: total,
    acc: correct,
    ms: mean,
    visual: all,
    audio: aud,
  };
}

function srShowMusic() {
  srShowPanel('sr-music');
  var stats = srMusicStats();
  var content = document.getElementById('sr-music-content');
  content.innerHTML = srModeShell(
    'Music Notes',
    'Train note recognition as memory primitives. Run <strong>Visual</strong> (see note → name it) and <strong>Ear</strong> (hear note → name it) drills.',
    srModeSurface(
      '<div class="sr-stats-grid" style="margin-bottom:var(--cup-space-md)">' +
        '<div class="sr-stat-card"><div class="sr-stat-val">' + stats.total + '</div><div class="sr-stat-lbl">Attempts</div></div>' +
        '<div class="sr-stat-card"><div class="sr-stat-val">' + stats.acc + '%</div><div class="sr-stat-lbl">Accuracy</div></div>' +
        '<div class="sr-stat-card"><div class="sr-stat-val">' + (stats.ms ? stats.ms + 'ms' : '–') + '</div><div class="sr-stat-lbl">Mean Latency</div></div>' +
      '</div>' +
      '<div class="sr-action-row" style="margin-bottom:var(--cup-space-md)">' +
        '<button class="btn btn-primary" id="sr-music-visual">Start Visual Drill</button>' +
        '<button class="btn btn-secondary" id="sr-music-audio">Start Ear Drill</button>' +
      '</div>' +
      '<div class="sr-note-channel-grid">' +
        '<div class="sr-note-channel-card"><h3>Visual</h3><div class="sr-note-channel-meta">Accuracy: <strong>' + stats.visual.acc + '%</strong></div><div class="sr-note-channel-meta">Mean latency: <strong>' + (stats.visual.ms ? stats.visual.ms + 'ms' : '–') + '</strong></div></div>' +
        '<div class="sr-note-channel-card"><h3>Ear</h3><div class="sr-note-channel-meta">Accuracy: <strong>' + stats.audio.acc + '%</strong></div><div class="sr-note-channel-meta">Mean latency: <strong>' + (stats.audio.ms ? stats.audio.ms + 'ms' : '–') + '</strong></div></div>' +
      '</div>'
    )
  );

  document.getElementById('sr-music-visual').addEventListener('click', function () { srMusicRunSession('visual'); });
  document.getElementById('sr-music-audio').addEventListener('click', function () { srMusicRunSession('audio'); });
}

function srMusicRunSession(mode) {
  var state = { mode: mode, idx: 0, total: 10, correct: 0, prompt: null, shownAt: 0, locked: false };
  srMusicRenderPrompt(state);
}

function srMusicPick() {
  return SR_MUSIC_NOTES[Math.floor(Math.random() * SR_MUSIC_NOTES.length)];
}

function srMusicRenderPrompt(state) {
  if (state.idx >= state.total) return srMusicRenderComplete(state);
  state.prompt = srMusicPick();
  state.locked = false;

  var content = document.getElementById('sr-music-content');
  var answers = SR_MUSIC_NOTES.map(function (n) {
    return '<button class="btn btn-ghost sr-note-answer" data-note="' + n.name + '">' + n.name + '</button>';
  }).join('');

  var promptHtml = state.mode === 'visual'
    ? '<div class="sr-note-staff-wrap">' +
        '<div class="sr-note-staff" role="img" aria-label="Guess this note on staff">' +
          '<div class="sr-note-line"></div><div class="sr-note-line"></div><div class="sr-note-line"></div><div class="sr-note-line"></div><div class="sr-note-line"></div>' +
          '<div class="sr-note-dot" style="top:' + state.prompt.staffTop + '%"></div>' +
        '</div>' +
        '<p class="sr-instr" style="margin-top:var(--cup-space-sm)">Name this note (C D E F or G)</p>' +
      '</div>'
    : '<div class="sr-note-audio-wrap">' +
        '<p class="sr-instr">Listen, then choose the note name.</p>' +
        '<button class="btn btn-secondary" id="sr-note-replay">🔊 Replay Note</button>' +
      '</div>';

  content.innerHTML = srModeShell(
    state.mode === 'visual' ? 'Visual Note Drill' : 'Ear Note Drill',
    'Prompt ' + (state.idx + 1) + ' of ' + state.total + '.',
    srModeSurface(
      promptHtml +
      '<div class="sr-note-answer-grid" style="margin-top:var(--cup-space-md)">' + answers + '</div>' +
      '<div id="sr-note-feedback" class="sr-note-feedback" aria-live="polite"></div>' +
      '<div class="sr-action-row"><button class="btn btn-ghost sr-back-btn">← Back</button></div>'
    )
  );

  if (state.mode === 'audio') srMusicPlayTone(state.prompt.freq);
  state.shownAt = performance.now();

  var replayBtn = document.getElementById('sr-note-replay');
  if (replayBtn) replayBtn.addEventListener('click', function () { srMusicPlayTone(state.prompt.freq); });

  document.querySelectorAll('.sr-note-answer').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (state.locked) return;
      state.locked = true;
      var guess = btn.dataset.note;
      var ms = performance.now() - state.shownAt;
      var ok = guess === state.prompt.name;
      if (ok) state.correct += 1;
      srStore.recordNoteAttempt({ mode: state.mode, note: state.prompt.name, guess: guess, correct: ok, latency_ms: ms });

      var fb = document.getElementById('sr-note-feedback');
      if (ok) {
        fb.className = 'sr-note-feedback sr-note-feedback--ok';
        fb.textContent = 'Correct — ' + state.prompt.full + ' (' + Math.round(ms) + 'ms)';
        srMusicPlayTone(state.prompt.freq, 300);
      } else {
        fb.className = 'sr-note-feedback sr-note-feedback--bad';
        fb.textContent = 'Not quite. You picked ' + guess + '; correct was ' + state.prompt.name + ' (' + state.prompt.full + ').';
        if (state.mode === 'audio') {
          var guessed = SR_MUSIC_NOTES.find(function (n) { return n.name === guess; });
          if (guessed) {
            srMusicPlayTone(guessed.freq, 240);
            setTimeout(function () { srMusicPlayTone(state.prompt.freq, 320); }, 320);
          }
        }
      }

      state.idx += 1;
      setTimeout(function () { srMusicRenderPrompt(state); }, 900);
    });
  });
}

function srMusicRenderComplete(state) {
  var content = document.getElementById('sr-music-content');
  var pct = Math.round((state.correct / state.total) * 100);
  content.innerHTML = srModeShell(
    'Session Complete',
    (state.mode === 'visual' ? 'Visual' : 'Ear') + ' drill complete.',
    srModeSurface(
      '<div class="sr-stats-grid" style="margin-bottom:var(--cup-space-md)">' +
        '<div class="sr-stat-card"><div class="sr-stat-val">' + state.correct + '/' + state.total + '</div><div class="sr-stat-lbl">Correct</div></div>' +
        '<div class="sr-stat-card"><div class="sr-stat-val">' + pct + '%</div><div class="sr-stat-lbl">Accuracy</div></div>' +
      '</div>' +
      '<div class="sr-action-row">' +
        '<button class="btn btn-primary" id="sr-note-again">Run Again</button>' +
        '<button class="btn btn-secondary" id="sr-note-home">Back to Music</button>' +
      '</div>'
    )
  );

  document.getElementById('sr-note-again').addEventListener('click', function () { srMusicRunSession(state.mode); });
  document.getElementById('sr-note-home').addEventListener('click', function () { srShowMusic(); });
}

// ── Progress Panel ────────────────────────────────────────────────────────────
function srRenderProgress() {
  var st = srStore.get();
  var sessions = st.sessions;
  var content = document.getElementById('sr-progress-content');

  content.innerHTML =
    '<h2 class="section-title">Progress</h2>' +
    '<div class="sr-chart-grid">' +
      '<div class="sr-chart-card"><div class="sr-chart-title">WPM Over Time</div><canvas id="sr-ch-wpm" height="160"></canvas></div>' +
      '<div class="sr-chart-card"><div class="sr-chart-title">WPM × Comprehension</div><canvas id="sr-ch-scatter" height="160"></canvas></div>' +
      '<div class="sr-chart-card"><div class="sr-chart-title">Effective WPM</div><canvas id="sr-ch-ewpm" height="160"></canvas></div>' +
      '<div class="sr-chart-card"><div class="sr-chart-title">Schulte Times</div><canvas id="sr-ch-schulte" height="160"></canvas></div>' +
    '</div>' +
    '<h3 class="section-title" style="margin-top:1.5rem">Technique Mastery</h3>' +
    '<div id="sr-mastery-list"></div>' +
    '<div class="sr-action-row">' +
      '<button class="btn btn-secondary btn-sm" id="sr-btn-reassess">Re-Assess Baseline</button>' +
    '</div>';

  // Charts (need layout first)
  requestAnimationFrame(function () {
    var wpmData = sessions.map(function (s) { return s.wpm; });
    var ewpmData = sessions.map(function (s) { return s.effective_wpm; });
    var labels = sessions.map(function (s) { return new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); });

    var wpmCanvas = document.getElementById('sr-ch-wpm');
    if (wpmCanvas) SR_CHART.line(wpmCanvas, [{ data: wpmData, color: '#4fc3f7' }], 'WPM');

    var ewpmCanvas = document.getElementById('sr-ch-ewpm');
    if (ewpmCanvas) SR_CHART.line(ewpmCanvas, [{ data: ewpmData, color: '#66bb6a' }], 'Eff. WPM');

    var scatterCanvas = document.getElementById('sr-ch-scatter');
    if (scatterCanvas) SR_CHART.scatter(scatterCanvas, sessions.map(function (s) { return { wpm: s.wpm, comp: s.comp }; }));

    var schulteData = st.schulte_history.slice(-10).map(function (h) { return h.elapsed / 1000; });
    var schulteLabels = st.schulte_history.slice(-10).map(function (_, i) { return 'R' + (i + 1); });
    var schulteCanvas = document.getElementById('sr-ch-schulte');
    if (schulteCanvas) SR_CHART.bar(schulteCanvas, schulteData, schulteLabels);
  });

  // Mastery list
  var masteryHtml = '';
  SR_TECHNIQUES.forEach(function (t) {
    var m = (st.mastery[t.id] || 0) * 100;
    masteryHtml +=
      '<div class="sr-mastery-item">' +
        '<div class="sr-mastery-name">' + escapeHtml(t.name) + '</div>' +
        '<div class="sr-mastery-bar-wrap"><div class="sr-mastery-bar" style="width:' + m.toFixed(0) + '%"></div></div>' +
        '<div class="sr-mastery-pct">' + m.toFixed(0) + '%</div>' +
      '</div>';
  });
  document.getElementById('sr-mastery-list').innerHTML = masteryHtml || '<p style="color:var(--cup-color-secondary)">Complete sessions to build mastery.</p>';

  document.getElementById('sr-btn-reassess').addEventListener('click', function () { srShowAssess(); });
}

// ── Lessons Panel ─────────────────────────────────────────────────────────────
function srShowLessonList() {
  srShowPanel('sr-lesson-list');
  var content = document.getElementById('sr-lesson-list-content');
  var st = srStore.get();

  content.innerHTML = '<h2 class="section-title">Techniques</h2>';
  var stages = [
    { n: 1, label: 'Foundation' },
    { n: 2, label: 'Core' },
    { n: 3, label: 'Advanced' },
    { n: 4, label: 'Mastery' },
  ];

  stages.forEach(function (stage) {
    var techs = SR_TECHNIQUES.filter(function (t) { return t.stage === stage.n; });
    if (!techs.length) return;
    var html = '<h3 class="sr-stage-header">Stage ' + stage.n + ': ' + stage.label + '</h3><div class="sr-lesson-grid">';
    techs.forEach(function (t) {
      var m = ((st.mastery[t.id] || 0) * 100).toFixed(0);
      html += '<button class="sr-lesson-card" data-tid="' + t.id + '">' +
        '<div class="sr-lesson-name">' + escapeHtml(t.name) + '</div>' +
        '<div class="sr-lesson-summary">' + escapeHtml(t.summary) + '</div>' +
        '<div class="sr-lesson-mastery"><div class="sr-mastery-bar" style="width:' + m + '%"></div><span>' + m + '% mastery</span></div>' +
        '</button>';
    });
    html += '</div>';
    content.innerHTML += html;
  });

  content.querySelectorAll('.sr-lesson-card').forEach(function (btn) {
    btn.addEventListener('click', function () { srShowLesson(btn.dataset.tid); });
  });
}

function srShowLesson(tid) {
  var tech = srTechniqueById(tid);
  if (!tech) return;
  srShowPanel('sr-lesson-detail');
  var content = document.getElementById('sr-lesson-detail-content');
  content.innerHTML =
    '<h2 class="section-title">' + escapeHtml(tech.name) + '</h2>' +
    '<div class="sr-lesson-body">' + tech.detail + '</div>' +
    '<div class="sr-action-row">';

  if (tid === 'T6' || tid === 'T3') {
    content.innerHTML += '<button class="btn btn-primary" id="sr-lesson-rsvp">Practice in RSVP →</button>';
  }
  if (tid === 'T9') {
    content.innerHTML += '<button class="btn btn-primary" id="sr-lesson-schulte">Practice Schulte →</button>';
  }
  if (tid === 'T1' || tid === 'T2' || tid === 'T10' || tid === 'T12' || tid === 'T14') {
    content.innerHTML += '<button class="btn btn-primary" id="sr-lesson-reader">Practice in Reader →</button>';
  }
  if (tid === 'T13') {
    content.innerHTML += '<button class="btn btn-primary" id="sr-lesson-fixation">3-2-1 Fixation Drill →</button>';
  }
  if (tid === 'T15') {
    content.innerHTML += '<button class="btn btn-primary" id="sr-lesson-periph">Soft Focus Drill →</button>';
  }
  content.innerHTML += '</div>';

  var rBtn = document.getElementById('sr-lesson-rsvp');
  if (rBtn) rBtn.addEventListener('click', function () { srShowRsvp(); });
  var sBtn = document.getElementById('sr-lesson-schulte');
  if (sBtn) sBtn.addEventListener('click', function () { srShowSchulte(); });
  var rdBtn = document.getElementById('sr-lesson-reader');
  if (rdBtn) rdBtn.addEventListener('click', function () { srShowReader(); });
  var fBtn = document.getElementById('sr-lesson-fixation');
  if (fBtn) fBtn.addEventListener('click', function () { srShowFixation(); });
  var pBtn = document.getElementById('sr-lesson-periph');
  if (pBtn) pBtn.addEventListener('click', function () { srShowPeriphDrill(); });
}

// ── Result Panel ──────────────────────────────────────────────────────────────
function srShowResult(wpm, comp, passageId, mode) {
  var session = srStore.recordSession({ wpm: wpm, comp: comp, mode: mode, passage_id: passageId });
  var st = srStore.get();
  var isFirst = !st.baseline_wpm || mode === 'assess';
  if (isFirst) srStore.set({ baseline_wpm: wpm, baseline_comp: parseFloat(comp.toFixed(3)) });

  // Feed Lane A Glicko-2 rating
  if (window.mfGlickoUpdateReading) window.mfGlickoUpdateReading(wpm, comp);

  var g = srGearForWpm(wpm);
  var compPct = Math.round(comp * 100);
  var effWpm = session.effective_wpm;
  var compColor = comp >= 0.8 ? 'var(--cup-color-success)' : comp >= 0.6 ? 'var(--cup-color-warning)' : 'var(--cup-color-error)';
  var wpmColor = wpm >= 400 ? 'var(--cup-color-success)' : wpm >= 250 ? 'var(--cup-color-primary)' : 'var(--cup-color-warning)';

  srShowPanel('sr-result');
  document.getElementById('sr-result-content').innerHTML =
    '<h2 class="section-title">Session Result</h2>' +
    '<div class="sr-result-grid">' +
      '<div class="sr-result-card"><div class="sr-result-val" style="color:' + wpmColor + '">' + wpm + '</div><div class="sr-result-lbl">WPM</div></div>' +
      '<div class="sr-result-card"><div class="sr-result-val" style="color:' + compColor + '">' + compPct + '%</div><div class="sr-result-lbl">Comprehension</div></div>' +
      '<div class="sr-result-card"><div class="sr-result-val" style="color:var(--cup-color-primary)">' + effWpm + '</div><div class="sr-result-lbl">Effective WPM</div></div>' +
      '<div class="sr-result-card"><div class="sr-result-val">Gear ' + g.gear + '</div><div class="sr-result-lbl">' + g.name + '</div></div>' +
    '</div>' +
    (isFirst ? '<p class="sr-instr" style="color:var(--cup-color-success)">Baseline saved! Your starting point is ' + wpm + ' WPM at ' + compPct + '% comprehension.</p>' : '') +
    '<div class="sr-action-row">' +
      '<button class="btn btn-primary" id="sr-result-home">Home</button>' +
      '<button class="btn btn-secondary" id="sr-result-again">Another Session</button>' +
      '<button class="btn btn-secondary" id="sr-result-progress">View Progress</button>' +
    '</div>';

  document.getElementById('sr-result-home').addEventListener('click', function () { srShowPanel('sr-home'); srRenderHome(); });
  document.getElementById('sr-result-again').addEventListener('click', function () {
    if (mode === 'rsvp') srShowRsvp();
    else if (mode === 'reader') srShowReader();
    else if (mode === 'assess') srShowAssess();
    else { srShowPanel('sr-home'); srRenderHome(); }
  });
  document.getElementById('sr-result-progress').addEventListener('click', function () {
    srShowPanel('sr-progress'); srRenderProgress();
  });
}

// ── Tab + Global Event Wiring ─────────────────────────────────────────────────
// ── 3-2-1 Fixation Drill ─────────────────────────────────────────────────────
var _srFixPhase = 1;
var _srFixSentIdx = 0;
var _srFixSentences = [];
var _srFixPassage = null;
var _srFixKeyHandler = null;

function srShowFixation() {
  srShowPanel('sr-fixation');
  var content = document.getElementById('sr-fixation-content');
  content.innerHTML =
    '<h2 class="section-title">3-2-1 Fixation Drill</h2>' +
    '<p class="sr-instr">Land your eyes on the colored guide dots — let peripheral vision handle the rest. Three stops per sentence, then two, then one.</p>' +
    '<div id="sr-fixation-picker"></div>';
  srPassagePicker(document.getElementById('sr-fixation-picker'), function (pid) {
    srFixationStart(srPassageById(pid));
  });
}

function srFixationStart(passage) {
  _srFixSentences = passage.text.match(/[^.!?]+[.!?]*/g) || [passage.text];
  _srFixSentences = _srFixSentences.map(function (s) { return s.trim(); }).filter(Boolean);
  _srFixPhase = 1;
  _srFixSentIdx = 0;
  _srFixPassage = passage;
  srFixationRender();
}

function srFixationRender() {
  if (_srFixKeyHandler) { document.removeEventListener('keydown', _srFixKeyHandler); _srFixKeyHandler = null; }
  var content = document.getElementById('sr-fixation-content');
  var total = _srFixSentences.length;
  var perPhase = Math.ceil(total / 3);
  var stops = [0, 3, 2, 1][_srFixPhase];
  var phaseColors = ['', '#f59e0b', '#10b981', '#4fc3f7'];
  var phaseNames  = ['', '3 stops', '2 stops', '1 stop'];
  var sent = _srFixSentences[_srFixSentIdx] || '';

  var dotsHtml = '<div class="sr-fix-dots">';
  for (var di = 0; di < stops; di++) {
    var pct = stops === 1 ? 50 : Math.round(di * (100 / (stops - 1)));
    dotsHtml += '<span class="sr-fix-dot" style="left:' + pct + '%;background:' + phaseColors[_srFixPhase] + '"></span>';
  }
  dotsHtml += '</div>';

  content.innerHTML =
    '<h2 class="section-title">3-2-1 Fixation Drill</h2>' +
    '<div class="sr-fix-phase-bar">' +
      [1, 2, 3].map(function (p) {
        var active = p === _srFixPhase;
        return '<span class="sr-fix-phase-item' + (active ? ' active' : '') + '"' +
          (active ? ' style="border-color:' + phaseColors[p] + ';color:' + phaseColors[p] + '"' : '') +
          '>' + phaseNames[p] + '</span>';
      }).join('') +
    '</div>' +
    '<p class="sr-quiz-progress">Sentence ' + (_srFixSentIdx + 1) + ' of ' + total + '</p>' +
    '<div class="sr-fix-stage">' +
      dotsHtml +
      '<div class="sr-fix-sentence">' + escapeHtml(sent) + '</div>' +
    '</div>' +
    '<div class="sr-action-row">' +
      '<button class="btn btn-primary" id="sr-fix-next">Next →</button>' +
      '<span class="sr-kbd-hint">or press <kbd>Space</kbd></span>' +
    '</div>';

  function advance() {
    if (_srFixKeyHandler) { document.removeEventListener('keydown', _srFixKeyHandler); _srFixKeyHandler = null; }
    _srFixSentIdx++;
    if (_srFixSentIdx >= perPhase * _srFixPhase && _srFixPhase < 3) { _srFixPhase++; }
    if (_srFixSentIdx >= total) {
      content.innerHTML =
        '<h2 class="section-title">Drill Complete!</h2>' +
        '<p class="sr-instr">You trained 3-stop, 2-stop, and 1-stop fixation patterns. Repeat regularly to build the habit.</p>' +
        '<div class="sr-action-row">' +
          '<button class="btn btn-primary" id="sr-fix-again">Practice Again</button>' +
          '<button class="btn btn-secondary sr-back-btn">\u2190 Home</button>' +
        '</div>';
      document.getElementById('sr-fix-again').addEventListener('click', function () { srFixationStart(_srFixPassage); });
      return;
    }
    srFixationRender();
  }

  document.getElementById('sr-fix-next').addEventListener('click', advance);
  _srFixKeyHandler = function (e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); }
  };
  document.addEventListener('keydown', _srFixKeyHandler);
}

// ── Soft Focus / Peripheral Detection Drill ───────────────────────────────────
var SR_PERIPH_WORDBANK = [
  'river', 'forest', 'echo', 'bright', 'cloud', 'swift', 'hollow', 'garden', 'flame', 'silver',
  'distant', 'anchor', 'velvet', 'ember', 'marble', 'crystal', 'thunder', 'lantern', 'meadow',
  'compass', 'whisper', 'granite', 'current', 'falcon', 'harvest', 'cobalt', 'mist', 'cipher',
  'prism', 'canopy', 'sector', 'mosaic', 'vertex', 'torrent', 'gilded', 'summit', 'trident',
];
var _srPeriphRound = 0;
var _srPeriphScore = 0;
var _srPeriphWords = [];
var _srPeriphCenter = 0;
var _srPeriphQuestion = 'first';

function srShowPeriphDrill() {
  _srPeriphRound = 0;
  _srPeriphScore = 0;
  srShowPanel('sr-periph');
  var content = document.getElementById('sr-periph-content');
  content.innerHTML =
    '<h2 class="section-title">Soft Focus Drill</h2>' +
    '<p class="sr-instr">Fix your gaze on the <span style="color:#ef5350;font-weight:700">red center word</span>. Relax your eyes — let peripheral vision absorb the edges. After words fade, answer the quiz from memory.</p>' +
    '<div style="text-align:center;margin-top:2rem">' +
      '<button class="btn btn-primary btn-lg" id="sr-periph-start">Begin (10 Rounds)</button>' +
    '</div>';
  document.getElementById('sr-periph-start').addEventListener('click', function () { srPeriphRound(); });
}

function srPeriphRound() {
  _srPeriphRound++;
  var count = Math.min(5 + Math.floor((_srPeriphRound - 1) / 2), 9);
  var pool = SR_PERIPH_WORDBANK.slice().sort(function () { return Math.random() - 0.5; });
  _srPeriphWords = pool.slice(0, count);
  _srPeriphCenter = Math.floor(count / 2);
  _srPeriphQuestion = Math.random() > 0.5 ? 'first' : 'last';
  var displayMs = Math.max(1100, 2000 - (_srPeriphRound - 1) * 80);

  var content = document.getElementById('sr-periph-content');
  content.innerHTML =
    '<h2 class="section-title">Round ' + _srPeriphRound + ' / 10 <span class="sr-wpm-badge">' + _srPeriphScore + ' correct</span></h2>' +
    '<p class="sr-instr">Gaze at the <span style="color:#ef5350;font-weight:700">red word</span>. Do not look away.</p>' +
    '<div class="sr-periph-stage" id="sr-periph-words">' +
      _srPeriphWords.map(function (w, i) {
        return '<span class="sr-periph-word' + (i === _srPeriphCenter ? ' sr-periph-center' : '') + '">' + w + '</span>';
      }).join('') +
    '</div>' +
    '<p class="sr-periph-timer" id="sr-periph-timer">&nbsp;</p>';

  var elapsed = 0;
  var iv = setInterval(function () {
    elapsed += 100;
    var el = document.getElementById('sr-periph-timer');
    if (el) el.textContent = ((displayMs - elapsed) / 1000).toFixed(1) + 's';
  }, 100);

  setTimeout(function () { clearInterval(iv); srPeriphQuiz(); }, displayMs);
}

function srPeriphQuiz() {
  var targetIdx = _srPeriphQuestion === 'first' ? 0 : _srPeriphWords.length - 1;
  var correct = _srPeriphWords[targetIdx];
  var pool = SR_PERIPH_WORDBANK.filter(function (w) { return _srPeriphWords.indexOf(w) === -1; });
  pool.sort(function () { return Math.random() - 0.5; });
  var options = [correct].concat(pool.slice(0, 3)).sort(function () { return Math.random() - 0.5; });

  var content = document.getElementById('sr-periph-content');
  content.innerHTML =
    '<h2 class="section-title">Round ' + _srPeriphRound + ' / 10</h2>' +
    '<p class="sr-quiz-question">What was the <strong>' + _srPeriphQuestion + '</strong> word?</p>' +
    '<div class="sr-quiz-options">' +
      options.map(function (opt) {
        return '<button class="sr-quiz-option" data-opt="' + opt + '">' + opt + '</button>';
      }).join('') +
    '</div>';

  document.querySelectorAll('#sr-periph-content .sr-quiz-option').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var chosen = this.getAttribute('data-opt');
      document.querySelectorAll('#sr-periph-content .sr-quiz-option').forEach(function (b) { b.disabled = true; });
      if (chosen === correct) {
        this.classList.add('correct');
        _srPeriphScore++;
      } else {
        this.classList.add('wrong');
        var rightBtn = document.querySelector('#sr-periph-content .sr-quiz-option[data-opt="' + correct + '"]');
        if (rightBtn) rightBtn.classList.add('correct');
      }
      setTimeout(function () {
        if (_srPeriphRound >= 10) { srPeriphFinish(); } else { srPeriphRound(); }
      }, 900);
    });
  });
}

function srPeriphFinish() {
  var pct = Math.round((_srPeriphScore / 10) * 100);
  var content = document.getElementById('sr-periph-content');
  content.innerHTML =
    '<h2 class="section-title">Drill Complete!</h2>' +
    '<div class="sr-result-grid">' +
      '<div class="sr-result-card"><div class="sr-result-val">' + _srPeriphScore + '/10</div><div class="sr-result-lbl">Correct</div></div>' +
      '<div class="sr-result-card"><div class="sr-result-val">' + pct + '%</div><div class="sr-result-lbl">Accuracy</div></div>' +
    '</div>' +
    '<div class="sr-action-row">' +
      '<button class="btn btn-primary" id="sr-periph-again">Practice Again</button>' +
      '<button class="btn btn-secondary sr-back-btn">\u2190 Home</button>' +
    '</div>';
  document.getElementById('sr-periph-again').addEventListener('click', function () {
    _srPeriphRound = 0;
    _srPeriphScore = 0;
    srPeriphRound();
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var view = document.getElementById('view-speed-reading');
  if (!view) return;

  // Tab clicks
  view.querySelectorAll('.sr-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var panel = 'sr-' + tab.dataset.srTab;
      srShowPanel(panel);
      if (panel === 'sr-home') srRenderHome();
      else if (panel === 'sr-progress') srRenderProgress();
      else if (panel === 'sr-lesson-list') srShowLessonList();
    });
  });

  // Back buttons in speed reading sub-panels
  view.addEventListener('click', function (e) {
    if (e.target.classList.contains('sr-back-btn')) {
      srShowPanel('sr-home');
      srRenderHome();
    }
  });

  // Lesson back button
  var lessonBack = document.getElementById('sr-lesson-back');
  if (lessonBack) {
    lessonBack.addEventListener('click', function () { srShowLessonList(); });
  }

  // Quiz back: skip quiz → go home
  var quizBack = document.getElementById('sr-quiz-back');
  if (quizBack) {
    quizBack.addEventListener('click', function () { srShowPanel('sr-home'); srRenderHome(); });
  }

  // Fixation drill back button
  var fixBack = document.getElementById('sr-fixation-back');
  if (fixBack) {
    fixBack.addEventListener('click', function () { srShowPanel('sr-home'); srRenderHome(); });
  }

  // Soft focus drill back button
  var periphBack = document.getElementById('sr-periph-back');
  if (periphBack) {
    periphBack.addEventListener('click', function () { srShowPanel('sr-home'); srRenderHome(); });
  }

  // Render home immediately if we land on speed-reading hash
  if (location.hash === '#speed-reading' || location.hash === '#view-speed-reading') {
    srOnActivate();
  }
});

// Listen for mf-data-cleared event (dispatched by app.js after btn-clear)
document.addEventListener('mf-data-cleared', function () {
  srStore.clearAll();
});
