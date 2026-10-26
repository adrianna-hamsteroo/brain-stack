// Activity templates, the three recommended routines, and the copy shown
// during each step. Durations are evidence-informed defaults; see RESEARCH.md.

// 24×24 stroke icons (drawn with currentColor).
export const ICONS = {
  breathe: '<path d="M3 9h11.5a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 13h15.5a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 17h8"/>',
  journal: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18"/><path d="M12 8h4M12 12h4"/>',
  puzzle: '<path d="M5.5 8.5h3.2a2 2 0 1 1 3.6 0h3.2v3.2a2 2 0 1 1 0 3.6v3.2h-10z"/>',
  color: '<path d="M15.5 4.5l4 4L9 19H5v-4z"/><path d="M13.5 6.5l4 4"/>',
  read: '<path d="M12 6.5C10 5 7.5 4.5 4 4.5v13c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2v-13c-3.5 0-6 .5-8 2z"/><path d="M12 6.5v13"/>',
  gratitude: '<path d="M12 4l1.8 4.6 4.7 1.4-4.7 1.4L12 16l-1.8-4.6L5.5 10l4.7-1.4z"/><path d="M18 16.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>',
  body: '<circle cx="12" cy="5" r="2"/><path d="M5 9l7 2 7-2"/><path d="M12 11v4l-3 5"/><path d="M12 15l3 5"/>',
  lamp: '<path d="M8 4h8l3 7H5z"/><path d="M12 11v7"/><path d="M8 20h8"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.7 1.3A3.5 3.5 0 0 0 7 18z"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/>',
  moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
  cairn: '<ellipse cx="12" cy="18" rx="7.5" ry="2.6"/><ellipse cx="12.5" cy="12.6" rx="5.2" ry="2.3"/><ellipse cx="11.8" cy="7.6" rx="3.2" ry="1.9"/>',
  progress: '<path d="M5 19v-8M12 19V5M19 19v-5"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  play: '<path d="M8 5.5v13l10-6.5z" fill="currentColor"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13" stroke-width="2.4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  next: '<path d="M6 5.5l9 6.5-9 6.5z"/><path d="M18.5 5.5v13"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  sound: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 15V4M7 9l5-5 5 5M5 20h14"/>',
  grip: '<circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M12.5 8 11 14l-2.5 6M11 14l3 3 1 3.5M12.3 9.5 9 12M12.3 9.5l3.2 2.5"/>',
  dumbbell: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  bike: '<circle cx="6" cy="16.5" r="3.5"/><circle cx="18" cy="16.5" r="3.5"/><path d="M6 16.5 9.5 9h6l2.5 7.5M9.5 9l3 7.5H6M15.5 9l-1-3h2.5"/>',
  tree: '<path d="M12 21v-5"/><path d="M12 3l5 7h-3l4 6H6l4-6H7z"/>',
  people: '<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M3.5 19c.5-3.5 2.8-5.5 5.5-5.5s5 2 5.5 5.5"/><path d="M15 14.2c.5-.1 1-.2 1.5-.2 2.2 0 4 1.6 4.5 4.5"/>',
  cup: '<path d="M5 10h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8.5 3.5c0 1.5 1.2 1.5 1.2 3M12 3.5c0 1.5 1.2 1.5 1.2 3"/>',
  ticket: '<path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z"/><path d="M14 7.5v2M14 11v2M14 14.5v2"/>',
  note: '<path d="M9 18V5.5l10-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  pot: '<path d="M4 11h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/><path d="M2.5 11h19"/><path d="M9 7.5c0-1.5 1-1.5 1-3M14 7.5c0-1.5 1-1.5 1-3"/>',
  drop: '<path d="M12 3.5c3 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.5-6 5.5-10z"/>',
  game: '<rect x="3" y="8" width="18" height="10" rx="5"/><path d="M8 11v4M6 13h4"/><path d="M15.5 12h.01M17.5 14h.01" stroke-width="2.4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
};

// Icons a person can pick for their own activities.
export const PICKABLE_ICONS = ['journal', 'puzzle', 'color', 'read', 'breathe', 'gratitude', 'body', 'lamp', 'cloud', 'leaf', 'moon'];

// mode: 'timed' counts down; 'open' counts up with a gentle nudge at `minutes`;
// 'breath' counts down with a breathing pacer (pattern 'sigh' or 'slow').
// hardStop hides the "+5 minutes" buttons, for steps that invite hyperfocus.
export const TEMPLATES = {
  scene: {
    name: 'Set the scene', icon: 'lamp', hue: 'scene', mode: 'timed', minutes: 2,
    detail: 'Lights low, phone down',
    prep: 'Dim the lights, put your phone on Do Not Disturb, and lay out what you need.',
    tips: [
      'Switch off the big lights and use a warm lamp. Your body clock reads bright light as daytime.',
      'Phone on Do Not Disturb and face down. Brain Stack will chime when it is time to switch.',
      'Lay out everything for tonight: notebook, pen, puzzle, pencils, book.',
    ],
    why: 'Evening light delays your body clock, so sleep researchers recommend keeping light low for the last few hours before bed (Brown et al., 2022). Getting everything out now also removes the small hurdles that make it easy to drift back to your phone.',
  },
  journal: {
    name: 'Journal', icon: 'journal', hue: 'journal', mode: 'open', minutes: 10,
    detail: 'Brain dump, open-ended',
    prep: 'Notebook and pen. Phone face down.',
    tips: [
      'Brain dump: write down everything taking up space in your head. No order, no editing.',
      'For each worry, ask: can I do something about it? If yes, write the very next step. If not, park it.',
      'Write tomorrow’s to-do list, as specific as you can, so your brain doesn’t have to hold it overnight.',
      'What would you tell a good friend who had your day?',
      'Write about today in the third person, using your own name.',
      'Which thought keeps coming back? Write it down, then write what you will do about it, and when.',
    ],
    nudge: 'If you are going round in circles, write one next step, then park the rest for tomorrow.',
    why: 'In a sleep-lab study, people who spent 5 minutes writing a specific to-do list fell asleep faster than people who wrote about tasks they had finished (Scullin et al., 2018). Concrete "what is my next step?" writing helps, while going over "why?" questions tends to feed rumination (Watkins, 2008). So there is no hard stop, just a gentle nudge.',
  },
  braindump: {
    name: 'Brain dump', icon: 'journal', hue: 'journal', mode: 'timed', minutes: 3,
    detail: 'Quick version',
    prep: 'Any scrap of paper will do.',
    tips: ['Empty your head onto paper, then write tomorrow’s top three. One line still counts.'],
    why: 'Five minutes of writing tomorrow’s to-do list helped people fall asleep faster in a sleep-lab study (Scullin et al., 2018). On hard days, even one line gets the loop out of your head.',
  },
  puzzle: {
    name: 'Puzzle', icon: 'puzzle', hue: 'puzzle', mode: 'timed', minutes: 10, hardStop: true,
    detail: 'Paper puzzle',
    prep: 'Paper puzzle within reach. Pick one that feels a little easy.',
    tips: [
      'Pick something a little easy: a jigsaw, crossword, sudoku or logic grid. Absorbing beats hard.',
      'Paper beats phone tonight: no notifications, no bright screen.',
      'Stuck? Move on. Finishing is not the goal.',
      'No timers, no scores. Tonight it is about focus, not speed.',
    ],
    why: 'Puzzles give you focused, rewarding attention, but the gains mostly stay with the puzzle itself rather than boosting general brain power (Simons et al., 2016). Mental effort right before bed can delay sleep (Wuyts et al., 2012), and puzzles invite hyperfocus, so this step comes early and stops when the time is up.',
  },
  color: {
    name: 'Coloring', icon: 'color', hue: 'color', mode: 'timed', minutes: 15,
    detail: 'Mandalas, patterns',
    prep: 'Coloring book and pencils within reach. A mandala or repeating pattern works best.',
    tips: [
      'Choose a pattern with repetition, like a mandala or a geometric design.',
      'Notice the pencil on the paper and the color filling in. When your mind wanders, come back to the next stroke.',
      'There is no wrong color. Let your hand decide.',
    ],
    why: 'Twenty minutes of coloring a mandala lowered anxiety more than free drawing in two studies (Curry & Kasser, 2005; van der Vennet & Serice, 2012). Ten minutes a day for a week also eased anxiety and low mood (Flett et al., 2017).',
  },
  read: {
    name: 'Reading', icon: 'read', hue: 'read', mode: 'timed', minutes: 20,
    detail: 'Paper book',
    prep: 'Paper book or e-ink, under a warm, dim lamp. Get comfortable, in bed if you like.',
    tips: [
      'Paper or e-ink, under a warm, dim lamp.',
      'Fiction works well: let someone else’s story take the stage.',
      'Getting sleepy? That means it is working.',
    ],
    why: 'In a trial with almost 1,000 people, reading a book in bed for a week improved self-rated sleep: 42% said they slept better, against 28% of non-readers (Finucane et al., 2021). Paper or e-ink is the easy choice, since hours on a bright tablet delayed sleep in a lab study (Chang et al., 2015).',
  },
  gratitude: {
    name: 'Three good things', icon: 'gratitude', hue: 'close', mode: 'timed', minutes: 3,
    detail: 'Close the day',
    prep: 'Same notebook, last page of the night.',
    tips: [
      'Write three things that went well today, and why they happened.',
      'Small counts: a good cup of tea, a kind message, a quiet moment.',
    ],
    why: 'Writing down three good things each night, and why they happened, lifted happiness for months in a randomised trial (Seligman et al., 2005). Later studies find smaller effects, but it takes three minutes and ends the day on a kinder note.',
  },
  breathe: {
    name: 'Breathe', icon: 'breathe', hue: 'breathe', mode: 'breath', minutes: 5, pattern: 'sigh',
    detail: 'Cyclic sighing',
    prep: 'Sit back or lie down. Follow the circle, eyes open or closed.',
    tips: [
      'Two breaths in through the nose, a deep one and a short top-up, then a long, slow breath out through the mouth.',
      'Eyes open or closed, whatever feels better. If it makes you tense, breathe normally. That happens, and it is fine.',
    ],
    why: 'Five minutes a day of breathing exercises lowered anxiety over a month, about as much as mindfulness meditation, and cyclic sighing gave the biggest lift in mood (Balban et al., 2023). Across trials, breathwork lowers stress a little (Fincham et al., 2023). It comes last because it leads straight into lights-out.',
  },
  worry: {
    name: 'Worry time', icon: 'cloud', hue: 'journal', mode: 'timed', minutes: 10,
    detail: 'Best earlier in the evening',
    prep: 'Best done earlier in the evening, not right before bed.',
    tips: [
      'List what is worrying you. For each one: can I act on it? If yes, write the next step. If not, let it wait.',
      'When a worry pops up later, tell it: not now, tomorrow at worry time.',
    ],
    why: 'Giving worries a short daily window, and postponing them the rest of the time, reduced how long and how often people worried in a review of seven trials (Dippel et al., 2023). It did not improve sleep, so keep it away from the last hour before bed.',
  },
  stretch: {
    name: 'Gentle stretch', icon: 'body', hue: 'body', mode: 'timed', minutes: 5,
    detail: 'Slow and easy',
    prep: 'A bit of floor space.',
    tips: ['Slow, easy stretches. Breathe out as you lengthen.'],
    why: 'A few minutes of slow movement releases tension that builds up from sitting.',
  },
  relax: {
    name: 'Muscle relaxation', icon: 'body', hue: 'body', mode: 'timed', minutes: 10,
    detail: 'Tense and release',
    prep: 'Lie down or sit back comfortably.',
    tips: ['Tense one muscle group for five seconds, then let it go for ten. Work from your feet up to your face. If it makes you tense, stop.'],
    why: 'Relaxation training is a recommended option for insomnia (Edinger et al., 2021). Some people feel more tense during relaxation at first (Heide & Borkovec, 1983); if that happens to you, stop and try something else.',
  },
};

// Order of the template picker when adding a step.
export const TEMPLATE_ORDER = ['scene', 'journal', 'braindump', 'puzzle', 'color', 'read', 'gratitude', 'breathe', 'worry', 'stretch', 'relax'];

// Ordered from mental effort to bodily calm: the puzzle comes early, the
// breathing leads into lights-out.
export const ROUTINES = [
  {
    id: 'full', name: 'Full stack', label: 'Full',
    blurb: 'For evenings with energy to spare.',
    steps: [['scene', 2], ['journal', 10], ['puzzle', 10], ['color', 15], ['read', 20], ['gratitude', 3], ['breathe', 5]],
  },
  {
    id: 'standard', name: 'Everyday', label: 'Everyday',
    blurb: 'The version to do most nights.',
    steps: [['scene', 1], ['journal', 5], ['color', 10], ['read', 15], ['breathe', 4]],
  },
  {
    id: 'mini', name: 'Low battery', label: 'Low battery',
    blurb: 'For hard days. Small still counts.',
    steps: [['braindump', 3], ['read', 6], ['breathe', 3]],
  },
];

// The check-in scale: how loud the mind is right now.
export const NOISE = ['Quiet', 'Settled', 'Busy', 'Noisy', 'Racing'];

export const CALM_LINES = [
  'Soft, slow breaths. Not deep, just slow.',
  'Panic peaks and then passes. Your body knows how to come back down.',
  'You have got through this feeling before.',
  'Let your shoulders drop each time you breathe out.',
  'Feel your feet on the floor and the weight of your body in the seat.',
];

// 5-4-3-2-1 grounding, for when breathing exercises make things worse.
export const GROUNDING = [
  '5 things you can see',
  '4 things you can feel',
  '3 things you can hear',
  '2 things you can smell',
  '1 thing you can taste',
];

// Things you did today outside the stack, logged with one tap.
export const EXTRA_PRESETS = [
  { type: 'walk', name: 'Walk', icon: 'walk' },
  { type: 'workout', name: 'Workout', icon: 'dumbbell' },
  { type: 'yoga', name: 'Yoga', icon: 'body' },
  { type: 'bike', name: 'Bike ride', icon: 'bike' },
  { type: 'outdoors', name: 'Time outdoors', icon: 'tree' },
  { type: 'friends', name: 'Friends', icon: 'people' },
  { type: 'cafe', name: 'Café', icon: 'cup' },
  { type: 'cinema', name: 'Cinema', icon: 'ticket' },
  { type: 'music', name: 'Music', icon: 'note' },
  { type: 'cooking', name: 'Cooking', icon: 'pot' },
  { type: 'bath', name: 'Bath', icon: 'drop' },
  { type: 'gaming', name: 'Gaming', icon: 'game' },
];

export const EXTRA_ICONS = ['walk', 'dumbbell', 'body', 'bike', 'tree', 'people', 'cup', 'ticket', 'note', 'pot', 'drop', 'game', 'sun', 'heart', 'gratitude', 'read'];

// Daily check-up: tap-only questions after the stack, shown one at a time.
// `better` says which end of the options is the easier day.
export const CHECKUP = [
  { id: 'mood', label: 'Mood', q: 'How was your mood today?', options: ['Low', 'Meh', 'Okay', 'Good', 'Great'], better: 'up', on: true },
  { id: 'worry', label: 'Worry', q: 'How much did worry take up today?', options: ['Hardly any', 'A little', 'Some', 'A lot', 'Most of the day'], better: 'down', on: true },
  { id: 'panic', label: 'Panic', q: 'Any panicky moments today?', options: ['None', 'A wobble', 'Yes, one', 'More than one'], better: 'down', on: true },
  { id: 'sleep', label: 'Sleep', q: 'How did you sleep last night?', options: ['Badly', 'Restless', 'Okay', 'Well', 'Really well'], better: 'up', on: true },
  { id: 'energy', label: 'Energy', q: 'How was your energy today?', options: ['Drained', 'Low', 'Okay', 'Good', 'Full of energy'], better: 'up', on: false },
  { id: 'focus', label: 'Focus', q: 'How was your focus today?', options: ['Scattered', 'Up and down', 'Mostly okay', 'Focused'], better: 'up', on: false },
  { id: 'connect', label: 'Connection', q: 'Did you connect with someone you like?', options: ['No', 'A little', 'Yes'], better: 'up', on: false },
  { id: 'kind', label: 'Kindness', q: 'Were you kind to yourself today?', options: ['Not really', 'Sometimes', 'Mostly'], better: 'up', on: false },
];

// 0 = hardest answer, 1 = easiest, whichever way round the options run.
export function checkupEase(q, index) {
  const t = index / (q.options.length - 1);
  return q.better === 'up' ? t : 1 - t;
}

// Color themes; the colors themselves live in styles.css.
export const THEMES = [
  { id: 'dusk', name: 'Lamplight' },
  { id: 'rose', name: 'Pink' },
  { id: 'violet', name: 'Violet' },
  { id: 'forest', name: 'Green' },
  { id: 'ocean', name: 'Blue' },
  { id: 'sunset', name: 'Orange' },
  { id: 'honey', name: 'Yellow' },
];

let uid = 0;
export function makeId(prefix = 's') {
  return `${prefix}${Date.now().toString(36)}${(uid++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function stepFromTemplate(type, minutes) {
  const t = TEMPLATES[type];
  const step = {
    id: makeId(), type, name: t.name, icon: t.icon, hue: t.hue,
    mode: t.mode, minutes: minutes ?? t.minutes, tip: '',
  };
  if (t.hardStop) step.hardStop = true;
  if (t.pattern) step.pattern = t.pattern;
  return step;
}

export function recommendedRoutines() {
  return ROUTINES.map(r => ({
    id: r.id, name: r.name, label: r.label, blurb: r.blurb,
    steps: r.steps.map(([type, min]) => stepFromTemplate(type, min)),
  }));
}

// Tip for tonight: custom text wins, otherwise rotate through the template's tips by date.
export function tipFor(step, date = new Date()) {
  if (step.tip) return step.tip;
  const tips = TEMPLATES[step.type]?.tips;
  if (!tips?.length) return '';
  const day = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 864e5);
  return tips[day % tips.length];
}
