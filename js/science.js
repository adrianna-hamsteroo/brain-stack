// "Why these timings?": the evidence behind each step, in plain words.
// Every source is listed in RESEARCH.md with its full citation.
import { h, icon } from './ui.js';

const doi = id => `https://doi.org/${id}`;
const REFS = {
  bell: { label: 'Bell, 2026, Mashable: What is brain stacking?', url: 'https://www.yahoo.com/lifestyle/articles/brain-stacking-tiktoks-latest-trend-090000132.html' },
  keller: { label: 'Keller et al., 2021, Br J Health Psychol', url: doi('10.1111/bjhp.12504') },
  wuyts: { label: 'Wuyts et al., 2012, Int J Psychophysiol', url: doi('10.1016/j.ijpsycho.2011.09.016') },
  brown: { label: 'Brown et al., 2022, PLoS Biology', url: doi('10.1371/journal.pbio.3001571') },
  scullin: { label: 'Scullin et al., 2018, J Exp Psychol Gen', url: doi('10.1037/xge0000374') },
  frattaroli: { label: 'Frattaroli, 2006, Psychol Bull', url: doi('10.1037/0033-2909.132.6.823') },
  watkins: { label: 'Watkins, 2008, Psychol Bull', url: doi('10.1037/0033-2909.134.2.163') },
  moran: { label: 'Moran & Eyal, 2022, Pers Soc Psychol Rev', url: doi('10.1177/10888683211069025') },
  simons: { label: 'Simons et al., 2016, Psychol Sci Public Interest', url: doi('10.1177/1529100616661983') },
  fissler: { label: 'Fissler et al., 2018, Front Aging Neurosci', url: doi('10.3389/fnagi.2018.00299') },
  flett: { label: 'Flett et al., 2017, Creativity Research Journal', url: doi('10.1080/10400419.2017.1376505') },
  hupfeld: { label: 'Hupfeld et al., 2019, ADHD Atten Defic Hyperact Disord', url: doi('10.1007/s12402-018-0272-y') },
  fong: { label: 'Fong et al., 2015, J Positive Psychol', url: doi('10.1080/17439760.2014.967799') },
  curry: { label: 'Curry & Kasser, 2005, Art Therapy', url: doi('10.1080/07421656.2005.10129441') },
  vennet: { label: 'van der Vennet & Serice, 2012, Art Therapy', url: doi('10.1080/07421656.2012.680047') },
  mantzios: { label: 'Mantzios & Giannou, 2018, Front Psychol', url: doi('10.3389/fpsyg.2018.00056') },
  finucane: { label: 'Finucane et al., 2021, Trials', url: doi('10.1186/s13063-021-05831-3') },
  chang: { label: 'Chang et al., 2015, PNAS', url: doi('10.1073/pnas.1418490112') },
  gronli: { label: 'Grønli et al., 2016, Sleep Medicine', url: doi('10.1016/j.sleep.2016.02.006') },
  seligman: { label: 'Seligman et al., 2005, American Psychologist', url: doi('10.1037/0003-066X.60.5.410') },
  cregg: { label: 'Cregg & Cheavens, 2021, J Happiness Stud', url: doi('10.1007/s10902-020-00236-6') },
  balban: { label: 'Balban et al., 2023, Cell Reports Medicine', url: doi('10.1016/j.xcrm.2022.100895') },
  fincham: { label: 'Fincham et al., 2023, Scientific Reports', url: doi('10.1038/s41598-022-27247-y') },
  vandiest: { label: 'Van Diest et al., 2014, Appl Psychophysiol Biofeedback', url: doi('10.1007/s10484-014-9253-x') },
  pompoli: { label: 'Pompoli et al., 2018, Psychological Medicine', url: doi('10.1017/S0033291717003919') },
  heide: { label: 'Heide & Borkovec, 1983, J Consult Clin Psychol', url: doi('10.1037/0022-006X.51.2.171') },
  dippel: { label: 'Dippel et al., 2023, Int J Cogn Ther', url: doi('10.1007/s41811-023-00193-x') },
  mccarrick: { label: 'McCarrick et al., 2025, Psychology & Health', url: doi('10.1080/08870446.2025.2590072') },
  edinger: { label: 'Edinger et al., 2021, J Clin Sleep Med', url: doi('10.5664/jcsm.8986') },
  marx: { label: 'Marx et al., 2022, J Am Acad Child Adolesc Psychiatry', url: doi('10.1016/j.jaac.2021.12.004') },
  muris: { label: 'Muris et al., 2026, Clin Child Fam Psychol Rev', url: doi('10.1007/s10567-026-00563-9') },
  silverman: { label: 'Silverman & Barasch, 2023, J Consumer Research', url: doi('10.1093/jcr/ucac029') },
  six: { label: 'Six et al., 2021, JMIR Mental Health', url: doi('10.2196/32199') },
  sharif: { label: 'Sharif & Shu, 2017, J Marketing Research', url: doi('10.1509/jmr.15.0231') },
  lally: { label: 'Lally et al., 2010, Eur J Soc Psychol', url: doi('10.1002/ejsp.674') },
  chinoy: { label: 'Chinoy et al., 2018, Physiological Reports', url: doi('10.14814/phy2.13692') },
  coogan: { label: 'Coogan & McGowan, 2017, ADHD Atten Defic Hyperact Disord', url: doi('10.1007/s12402-016-0214-5') },
};

export const SECTIONS = [
  {
    title: 'What brain stacking is',
    body: [
      'Brain stacking is a 2025–26 social media trend: you stack a few screen-free activities, like a puzzle, a novel or journaling, in place of evening scrolling. Nobody has studied the stack as a whole, but most of its pieces have been studied on their own. The timings in Brain Stack come from those studies, rounded to what fits into a weeknight.',
      'It is not the same as habit stacking, which means tying a new habit to one you already have: after I brush my teeth, I open Brain Stack. That trick helps too. Cues tied to an existing routine worked as well as fixed clock times in a trial (Keller et al., 2021).',
    ],
    refs: ['bell', 'keller'],
  },
  {
    title: 'Why this order',
    body: [
      'The routine moves from mental effort to bodily calm. Brain work right before bed can keep you awake (Wuyts et al., 2012), so the puzzle comes early, at least half an hour before lights-out, and breathing comes last so it leads straight into sleep.',
      'Nobody has tested different orders head to head, so treat this as a sensible default. If you arrive wound up, open Quick calm first.',
    ],
    refs: ['wuyts'],
  },
  {
    type: 'scene', icon: 'lamp', hue: 'scene', title: 'Set the scene', rec: '1–2 min',
    body: [
      'Dim the lights, put your phone on Do Not Disturb and lay everything out. Light is the strongest signal to your body clock, and sleep researchers recommend keeping light dim for the last three hours before bed (Brown et al., 2022). A bright phone screen alone can be too much, which is why Brain Stack fades its own screen during long steps.',
    ],
    refs: ['brown'],
  },
  {
    type: 'journal', icon: 'journal', hue: 'journal', title: 'Journal', rec: 'Open, nudge at 10 min',
    body: [
      'A specific to-do list beats reflecting. In a sleep-lab study, people who spent 5 minutes writing tomorrow’s to-do list fell asleep faster than people who wrote about tasks they had finished (Scullin et al., 2018). It was one night with 57 healthy adults, so it is a hint rather than proof.',
      'Classic expressive writing uses 15–20 minute sessions over about four days, and people often feel worse right afterwards (Frattaroli, 2006). It works better as an occasional course than as a nightly habit.',
      'Asking "what is my next step?" is the helpful kind of repetitive thinking, while going round "why?" questions feeds rumination (Watkins, 2008). Looking at your day as a friend would, or in the third person, also softens it (Moran & Eyal, 2022). So the prompts are concrete, and journaling gets a gentle nudge instead of a hard stop.',
    ],
    refs: ['scullin', 'frattaroli', 'watkins', 'moran'],
  },
  {
    type: 'puzzle', icon: 'puzzle', hue: 'puzzle', title: 'Puzzle', rec: '10 min, firm stop',
    body: [
      'Puzzles are a satisfying way to focus, but the skills mostly stay with the puzzle. Brain-training studies find little transfer to everyday thinking (Simons et al., 2016), a month of daily jigsaws did not improve cognition (Fissler et al., 2018), and in one study logic puzzles did not lower anxiety while coloring did (Flett et al., 2017).',
      'The firm stop has two reasons: mental effort right before bed delays sleep (Wuyts et al., 2012), and ADHD brains are prone to hyperfocus (Hupfeld et al., 2019). Pick something a little easy, because flow comes when the challenge matches your skill (Fong et al., 2015).',
    ],
    refs: ['simons', 'fissler', 'flett', 'wuyts', 'hupfeld', 'fong'],
  },
  {
    type: 'color', icon: 'color', hue: 'color', title: 'Coloring', rec: '15 min',
    body: [
      'Twenty minutes of coloring a mandala lowered anxiety more than free drawing in two small studies (Curry & Kasser, 2005; van der Vennet & Serice, 2012). Ten minutes a day for a week eased anxiety and low mood (Flett et al., 2017), though a single 10-minute session made no difference in another study (Mantzios & Giannou, 2018). Fifteen minutes is the middle ground.',
    ],
    refs: ['curry', 'vennet', 'flett', 'mantzios'],
  },
  {
    type: 'read', icon: 'read', hue: 'read', title: 'Reading', rec: '20 min',
    body: [
      'In an online trial with 991 people, reading a book in bed for a week improved self-rated sleep: 42% of readers said they slept better, against 28% of non-readers (Finucane et al., 2021). Sleep was self-reported, so it is a modest signal.',
      'Paper or e-ink is the easy choice. Four hours of reading on a bright tablet delayed sleep and the body clock in a lab study (Chang et al., 2015), although 30 minutes on an iPad made little difference to how fast people fell asleep (Grønli et al., 2016).',
    ],
    refs: ['finucane', 'chang', 'gronli'],
  },
  {
    type: 'gratitude', icon: 'gratitude', hue: 'close', title: 'Three good things', rec: '3 min',
    body: [
      'Writing down three things that went well each day, and why, for one week raised happiness and lowered depressive symptoms for six months in a randomised trial (Seligman et al., 2005). A later review found smaller effects, especially against active comparisons (Cregg & Cheavens, 2021). It is short and pleasant, which is reason enough.',
    ],
    refs: ['seligman', 'cregg'],
  },
  {
    type: 'breathe', icon: 'breathe', hue: 'breathe', title: 'Breathing', rec: '5 min',
    body: [
      'In a month-long trial, 5 minutes a day of breathing exercises or mindfulness lowered anxiety in every group. Cyclic sighing, two inhales and one long exhale, gave the biggest lift in mood and slowed breathing at rest (Balban et al., 2023). Across trials, breathwork lowers stress by a small amount (Fincham et al., 2023).',
      'Longer exhales feel more relaxing (Van Diest et al., 2014), so both patterns in Brain Stack breathe out for longer than they breathe in, at six breaths a minute.',
      'For panic, gentle slow breathing without breath holds is the safer choice, because deep breathing can add to dizziness. Breathing helps you ride out a wave, but on its own it is not a treatment for panic disorder (Pompoli et al., 2018).',
      'Some people feel more tense when they try to relax (Heide & Borkovec, 1983). If that happens, open your eyes, breathe normally, or use the grounding exercise in Quick calm.',
    ],
    refs: ['balban', 'fincham', 'vandiest', 'pompoli', 'heide'],
  },
  {
    type: 'worry', icon: 'cloud', hue: 'journal', title: 'Worry time (optional)', rec: '10 min, early evening',
    body: [
      'Giving worries a short daily slot, and postponing them the rest of the time, cut how long and how often people worried in a review of seven trials, though the effects were small (Dippel et al., 2023). It did not improve sleep in a larger trial (McCarrick et al., 2025), so do it earlier in the evening rather than as part of the bedtime stack.',
    ],
    refs: ['dippel', 'mccarrick'],
  },
  {
    type: 'relax', icon: 'body', hue: 'body', title: 'Muscle relaxation (optional)', rec: '10 min, in bed',
    body: [
      'Relaxation techniques such as progressive muscle relaxation are a recommended option for insomnia (Edinger et al., 2021). There is no standard length; 5–20 minutes is typical.',
    ],
    refs: ['edinger'],
  },
  {
    title: 'Built for an ADHD brain',
    body: [
      'Visual timer. Time can be harder to sense with ADHD (Marx et al., 2022), so each step shows the time left as a shrinking wedge, plus the clock time it ends.',
      'Soft transitions. A heads-up chime before a step ends, an up-next screen, and "+5 minutes" when you are in the middle of something. These come from ADHD coaching practice rather than trials.',
      'Fresh prompts. Boredom is closely tied to ADHD (Muris et al., 2026), so the structure stays the same while the prompts rotate each night.',
      'No streaks. Broken streaks make people more likely to give up (Silverman & Barasch, 2023), and points and badges did not help in mental health apps (Six et al., 2021). Instead there is a weekly goal with rest nights built in, because goals with some slack are easier to stick to (Sharif & Shu, 2017). Missing a night does not slow down habit forming (Lally et al., 2010).',
      'Gentle on light. The screen fades while you are away from it, because evening screens can push bedtime later (Chinoy et al., 2018) and body clocks often run late with ADHD (Coogan & McGowan, 2017).',
    ],
    refs: ['marx', 'muris', 'silverman', 'six', 'sharif', 'lally', 'chinoy', 'coogan'],
  },
  {
    title: 'Claims left out on purpose',
    body: [
      '"Six minutes of reading cuts stress by 68%." It traces to a 2009 commercial report with no published methods.',
      '"Puzzles keep your brain young." The skills mostly stay with the puzzle you practice.',
      '"Cyclic sighing beats mindfulness for anxiety." Anxiety fell equally in both; sighing did better on mood.',
      '"It takes 21 days to form a habit." In the best-known study the median was 66 days, with a range of 18 to 254 (Lally et al., 2010).',
      '"E-readers wreck your sleep." Hours on a bright tablet can; half an hour mostly does not.',
    ],
    refs: [],
  },
];

export function scienceView(app) {
  return h('div', { class: 'view science' },
    h('button', { class: 'back', onclick: app.closeSub }, icon('back'), 'Settings'),
    h('header', { class: 'masthead' },
      h('p', { class: 'eyebrow' }, 'The research'),
      h('h1', { class: 'display lg' }, 'Why these timings?')),
    SECTIONS.map(sec => h('section', { class: 'science-section', style: sec.hue ? { '--hue': `var(--hue-${sec.hue})` } : null },
      h('div', { class: 'science-head' },
        sec.icon && h('span', { class: 'pebble-icon' }, icon(sec.icon)),
        h('h2', { class: 'display md' }, sec.title),
        sec.rec && h('span', { class: 'chip' }, sec.rec)),
      sec.body.map(p => h('p', null, p)),
      sec.refs.length > 0 && h('ul', { class: 'refs' },
        sec.refs.map(key => h('li', null, h('a', { href: REFS[key].url, target: '_blank', rel: 'noopener' }, REFS[key].label)))))),
    h('p', { class: 'muted small' }, 'Brain Stack is a self-care tool, not treatment. If racing thoughts or panic are getting in the way of your life, a doctor or therapist can help. CBT is a well-established treatment for both panic and worry.'),
  );
}
