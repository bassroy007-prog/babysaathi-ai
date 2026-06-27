// ─── Postpartum Mom Health Data ───────────────────────────────────────────────

export const MOOD_OPTIONS = [
  { value: 'great'       as const, emoji: '😄', label: 'Great',       color: '#2D7A3A', score: 4 },
  { value: 'good'        as const, emoji: '😊', label: 'Good',        color: '#006B6B', score: 3 },
  { value: 'okay'        as const, emoji: '😐', label: 'Okay',        color: '#B8860B', score: 2 },
  { value: 'low'         as const, emoji: '😔', label: 'Low',         color: '#C05A00', score: 1 },
  { value: 'overwhelmed' as const, emoji: '😰', label: 'Overwhelmed', color: '#C0392B', score: 0 },
];

export const BLEEDING_OPTIONS = [
  { value: 'heavy'    as const, label: 'Heavy',    color: '#C0392B' },
  { value: 'moderate' as const, label: 'Moderate', color: '#E07B00' },
  { value: 'light'    as const, label: 'Light',    color: '#B8860B' },
  { value: 'none'     as const, label: 'None',     color: '#2D7A3A' },
  { value: 'na'       as const, label: 'N/A',      color: '#888' },
];

export interface EPDSQuestion {
  id: number;
  text: string;
  options: { text: string; score: number }[];
}

export const EPDS_QUESTIONS: EPDSQuestion[] = [
  {
    id: 1, text: 'I have been able to laugh and see the funny side of things',
    options: [
      { text: 'As much as I always could', score: 0 },
      { text: 'Not quite so much now', score: 1 },
      { text: 'Definitely not so much now', score: 2 },
      { text: 'Not at all', score: 3 },
    ],
  },
  {
    id: 2, text: 'I have looked forward with enjoyment to things',
    options: [
      { text: 'As much as I ever did', score: 0 },
      { text: 'Rather less than I used to', score: 1 },
      { text: 'Definitely less than I used to', score: 2 },
      { text: 'Hardly at all', score: 3 },
    ],
  },
  {
    id: 3, text: 'I have blamed myself unnecessarily when things went wrong',
    options: [
      { text: 'Yes, most of the time', score: 3 },
      { text: 'Yes, some of the time', score: 2 },
      { text: 'Not very often', score: 1 },
      { text: 'No, never', score: 0 },
    ],
  },
  {
    id: 4, text: 'I have been anxious or worried for no good reason',
    options: [
      { text: 'No, not at all', score: 0 },
      { text: 'Hardly ever', score: 1 },
      { text: 'Yes, sometimes', score: 2 },
      { text: 'Yes, very often', score: 3 },
    ],
  },
  {
    id: 5, text: 'I have felt scared or panicky for no very good reason',
    options: [
      { text: 'Yes, quite a lot', score: 3 },
      { text: 'Yes, sometimes', score: 2 },
      { text: 'No, not much', score: 1 },
      { text: 'No, not at all', score: 0 },
    ],
  },
  {
    id: 6, text: 'Things have been getting on top of me',
    options: [
      { text: "Yes, most of the time I haven't been able to cope at all", score: 3 },
      { text: "Yes, sometimes I haven't been coping as well as usual", score: 2 },
      { text: 'No, most of the time I have coped quite well', score: 1 },
      { text: 'No, I have been coping as well as ever', score: 0 },
    ],
  },
  {
    id: 7, text: 'I have been so unhappy that I have had difficulty sleeping',
    options: [
      { text: 'Yes, most of the time', score: 3 },
      { text: 'Yes, sometimes', score: 2 },
      { text: 'Not very often', score: 1 },
      { text: 'No, not at all', score: 0 },
    ],
  },
  {
    id: 8, text: 'I have felt sad or miserable',
    options: [
      { text: 'Yes, most of the time', score: 3 },
      { text: 'Yes, quite often', score: 2 },
      { text: 'Not very often', score: 1 },
      { text: 'No, not at all', score: 0 },
    ],
  },
  {
    id: 9, text: 'I have been so unhappy that I have been crying',
    options: [
      { text: 'Yes, most of the time', score: 3 },
      { text: 'Yes, quite often', score: 2 },
      { text: 'Only occasionally', score: 1 },
      { text: 'No, never', score: 0 },
    ],
  },
  {
    id: 10, text: 'The thought of harming myself has occurred to me',
    options: [
      { text: 'Yes, quite often', score: 3 },
      { text: 'Sometimes', score: 2 },
      { text: 'Hardly ever', score: 1 },
      { text: 'Never', score: 0 },
    ],
  },
];

export function getEPDSRisk(score: number): { risk: 'low' | 'moderate' | 'high'; color: string; title: string; message: string } {
  if (score <= 9)  return { risk: 'low',      color: '#2D7A3A', title: 'Low Risk',           message: 'You seem to be coping well. Keep practicing self-care — rest, nutrition, and asking for help when you need it.' };
  if (score <= 12) return { risk: 'moderate', color: '#B8860B', title: 'Some Symptoms',      message: 'Some postnatal symptoms detected. Talk to someone you trust or your doctor. You do not have to feel this way alone.' };
  return               { risk: 'high',     color: '#C0392B', title: 'Please Seek Support', message: 'Your score suggests you may be experiencing postnatal depression. Please reach out to your doctor or a mental health professional. Help is available and you deserve it.' };
}

export const WELLNESS_TIPS = [
  { emoji: '💧', tip: 'Drink at least 8–10 glasses of water today — breastfeeding increases fluid needs significantly.' },
  { emoji: '🌿', tip: 'Methi (fenugreek) water helps with milk production and recovery. Soak 1 tsp overnight, drink in morning.' },
  { emoji: '🥬', tip: 'Eat iron-rich foods: palak, rajma, chana, dates. Anemia after delivery is very common and worsens fatigue.' },
  { emoji: '😴', tip: 'Sleep when the baby sleeps — even 20-minute naps add up. Dishes can wait. Your rest cannot.' },
  { emoji: '☀️', tip: 'A 10-minute walk in sunlight boosts mood, Vitamin D, and energy. Even just standing in the sun helps.' },
  { emoji: '🤝', tip: 'Accept every offer of help. You cannot pour from an empty cup — let family support you.' },
  { emoji: '🌙', tip: 'Haldi doodh (turmeric milk) at night helps with wound healing and natural anti-inflammation.' },
  { emoji: '💛', tip: 'Baby blues in the first 2 weeks are normal — hormones fluctuating. If feelings persist past 2 weeks, please talk to your doctor.' },
  { emoji: '🏃', tip: 'Gentle pelvic floor exercises (Kegels) from day 1 help recovery. Hold 5 sec, release, repeat 10×.' },
  { emoji: '🎵', tip: 'Music changes brain chemistry. Play your favorite songs while feeding or bathing baby — it lifts both your moods.' },
  { emoji: '🧘', tip: 'Even 5 minutes of deep breathing — in for 4 counts, hold 4, out for 6 — reduces cortisol and anxiety.' },
  { emoji: '💬', tip: 'Talk about how you\'re feeling with your partner, your mother, or your best friend. Silence makes it heavier.' },
  { emoji: '🥛', tip: 'Calcium is critical for breastfeeding moms: dahi, paneer, ragi, til (sesame) are all excellent sources.' },
  { emoji: '⏱️', tip: 'Your body grew a baby for 9 months. Give it at least 9 months to recover. Be patient and kind with yourself.' },
  { emoji: '🌸', tip: 'Shower, comb your hair, change clothes — even small acts of self-care signal to your brain that you matter.' },
  { emoji: '🍲', tip: 'Ajwain (carom seeds) in ghee roti helps with gas and abdominal discomfort — a time-tested Indian postpartum remedy.' },
  { emoji: '👶', tip: 'You don\'t need to be a perfect mother. A good-enough mother who is present and warm is everything your baby needs.' },
  { emoji: '🧠', tip: '"Mommy brain" is real — hormones, sleep deprivation, and neuroplasticity all affect memory. You\'re not losing your mind.' },
  { emoji: '🌺', tip: 'Shatavari (an Ayurvedic herb) is traditionally used postpartum for hormonal balance. Ask your doctor if it\'s right for you.' },
  { emoji: '❤️', tip: 'Asking for help is a sign of strength, not weakness. Postpartum recovery is not something you were designed to do alone.' },
];

export function getTodaysTip(): typeof WELLNESS_TIPS[0] {
  const idx = new Date().getDate() % WELLNESS_TIPS.length;
  return WELLNESS_TIPS[idx];
}
