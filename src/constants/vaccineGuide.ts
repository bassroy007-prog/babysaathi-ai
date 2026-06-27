// Rich guide data for each vaccine in INDIA_VACCINE_SCHEDULE.
// Keys match vaccineId prefix (e.g. 'dtpipvhib1' matches 'dtpipvhib').

export interface VaccineSideEffect {
  severity: 'normal' | 'watch' | 'urgent';
  text: string;
}

export interface VaccineGuideEntry {
  emoji:            string;
  shortName:        string;
  route:            string;        // how it is given
  protectsAgainst:  string[];
  sideEffects:      VaccineSideEffect[];
  duration:         string;        // how long normal reactions last
  comfortTips:      string[];
  doctorIf:         string[];
  importantNote?:   string;        // unique per vaccine
}

// Look up by testing if the vaccine id starts with any of the keys below.
export const VACCINE_GUIDE: Record<string, VaccineGuideEntry> = {

  bcg: {
    emoji: '💉',
    shortName: 'BCG',
    route: 'Intradermal injection — left upper arm',
    protectsAgainst: ['Tuberculosis (TB)', 'TB meningitis', 'Miliary TB in infants'],
    sideEffects: [
      { severity: 'normal', text: 'A small red papule (bump) appears at the injection site 2–4 weeks after the shot' },
      { severity: 'normal', text: 'The bump ulcerates, crusts, and heals over 8–12 weeks, leaving a small scar — this is expected and means the vaccine worked' },
      { severity: 'watch',  text: 'Swelling of the lymph node in the armpit (axillary lymphadenopathy) — common and usually self-resolving' },
    ],
    duration: 'Scar formation takes 8–12 weeks. This is not a complication.',
    comfortTips: [
      '✅ Do NOT apply any cream, bandage, or cover to the BCG site',
      '🚿 Normal bathing is fine — keep the site clean and dry',
      '👀 Photograph the site weekly — document the scar formation',
      '🧺 Loose clothing over the left arm for the first week',
    ],
    doctorIf: [
      'Large abscess (pus-filled lump > 1 cm) at the site after 4 weeks',
      'Swollen axillary lymph node is soft, discharging pus, or growing rapidly',
      'Red streaks spreading from the injection site',
    ],
    importantNote: 'The BCG scar is proof the vaccine worked. Absence of a scar does NOT mean the vaccine failed — discuss with your doctor before repeating.',
  },

  opv: {
    emoji: '💧',
    shortName: 'OPV (Polio drops)',
    route: 'Oral — 2 drops in the mouth',
    protectsAgainst: ['Poliomyelitis (infantile paralysis) — Types 1, 2, 3'],
    sideEffects: [
      { severity: 'normal', text: 'Usually no side effects — oral vaccines are very well tolerated' },
      { severity: 'normal', text: 'Mild loose stools for 1–2 days in some babies' },
    ],
    duration: 'Any loose stools resolve within 24–48 hours.',
    comfortTips: [
      '⏳ Do not feed for 15 minutes before and after the drops — food/milk may dilute the vaccine',
      '🤱 Breastfeeding can resume immediately after the drops are given',
      '🚫 Do not give any food or drink for at least 15 minutes post-dose',
    ],
    doctorIf: [
      'Baby vomits the dose immediately — the dose may need to be repeated',
      'Persistent diarrhoea lasting more than 48 hours',
    ],
    importantNote: 'OPV contains live attenuated virus. The virus is shed in the stool for 4–6 weeks — wash hands thoroughly after nappy changes during this period.',
  },

  hepb: {
    emoji: '💉',
    shortName: 'Hepatitis B',
    route: 'Intramuscular — outer thigh (infants) or upper arm (older)',
    protectsAgainst: ['Hepatitis B (serious liver infection)', 'Cirrhosis of the liver', 'Liver cancer (in later life)'],
    sideEffects: [
      { severity: 'normal', text: 'Mild soreness, redness, or swelling at the injection site' },
      { severity: 'normal', text: 'Low-grade fever (up to 38°C) for 24–48 hours' },
      { severity: 'normal', text: 'Irritability and mild fussiness' },
    ],
    duration: '24–48 hours for fever and soreness.',
    comfortTips: [
      '🤱 Breastfeed during or immediately after the injection — it significantly reduces pain',
      '🧊 Cool (not ice-cold) cloth on the injection site for 20 minutes',
      '🌡️ Give paracetamol only if temperature exceeds 38.5°C — at your doctor\'s recommended dose',
    ],
    doctorIf: [
      'Fever above 39.5°C',
      'Swelling at the injection site larger than a 50-paise coin and still growing after 3 days',
      'Baby refuses all feeds for more than 6 hours',
    ],
  },

  dtpipvhib: {
    emoji: '💉',
    shortName: 'Pentavalent (DTP+IPV+Hib)',
    route: 'Intramuscular — outer thigh (alternating sides each dose)',
    protectsAgainst: [
      'Diphtheria (throat infection blocking airways)',
      'Tetanus (lockjaw)',
      'Pertussis / Whooping Cough (100-day cough)',
      'Polio (via IPV component)',
      'Hib meningitis & pneumonia',
    ],
    sideEffects: [
      { severity: 'normal', text: 'Fever up to 38.5°C — very common, occurs within 24 hours' },
      { severity: 'normal', text: 'Red, swollen, tender injection site on the thigh' },
      { severity: 'normal', text: 'Irritability, crying, and disturbed sleep for 24–48 hours' },
      { severity: 'normal', text: 'Baby may pull the affected leg less — normal, not a sign of limb injury' },
      { severity: 'watch',  text: 'Prolonged crying for 3+ hours (unusual high-pitched cry) — call your doctor' },
      { severity: 'urgent', text: 'Seizure or convulsions — go to casualty immediately' },
      { severity: 'urgent', text: 'Fever above 40°C that does not come down with paracetamol' },
    ],
    duration: 'Fever and soreness resolve within 48 hours. Thigh swelling may persist for 3–5 days.',
    comfortTips: [
      '🤱 Breastfeed during the injection — latch on just before the needle goes in',
      '🧊 Cool compress on the thigh immediately after — 20 minutes on, 20 minutes off',
      '🌡️ Check temperature at 4, 8, and 12 hours after the vaccine',
      '💊 Paracetamol if fever > 38.5°C — AFTER the vaccine, not before',
      '🩳 Dress baby in loose clothing — avoid tight elastics over the thigh',
      '🔄 Alternate thighs for each of the 3 doses (ask your doctor)',
    ],
    doctorIf: [
      'Fever above 40°C or persisting beyond 48 hours',
      'High-pitched, unusual cry lasting more than 3 hours',
      'Seizure or unusual limpness',
      'Breathing difficulty',
      'Swelling at the injection site larger than 5 cm or spreading up the thigh',
    ],
    importantNote: 'DTP is the most reactogenic vaccine in the schedule — side effects are common but almost always mild and self-limiting. Do NOT give paracetamol before the injection as it may reduce the antibody response.',
  },

  dtp_booster: {
    emoji: '💉',
    shortName: 'DTP Booster',
    route: 'Intramuscular — outer thigh or upper arm',
    protectsAgainst: ['Diphtheria', 'Tetanus', 'Pertussis (Whooping Cough)'],
    sideEffects: [
      { severity: 'normal', text: 'More pronounced soreness and swelling at injection site than earlier doses — common with booster doses' },
      { severity: 'normal', text: 'Fever up to 38.5°C for 24–48 hours' },
      { severity: 'watch',  text: 'Firm, painless lump at injection site that may persist for weeks — resolves on its own, not a cyst' },
    ],
    duration: '48 hours for fever; lump may persist for 4–8 weeks.',
    comfortTips: [
      '🧊 Cold compress on injection site for 20 min every 2 hours on day 1',
      '🌡️ Paracetamol only if temperature exceeds 38.5°C — after the injection',
      '🏃 Light activity is fine — no need to restrict movement',
    ],
    doctorIf: [
      'Swelling involves the entire upper arm or thigh',
      'Fever above 40°C',
      'Seizure within 72 hours of vaccination',
    ],
  },

  pcv: {
    emoji: '💉',
    shortName: 'PCV (Pneumo)',
    route: 'Intramuscular — outer thigh',
    protectsAgainst: [
      'Pneumococcal pneumonia (most common cause of severe bacterial pneumonia in infants)',
      'Pneumococcal meningitis',
      'Bloodstream infection (septicaemia)',
      'Ear infections (otitis media)',
    ],
    sideEffects: [
      { severity: 'normal', text: 'Fever — PCV commonly causes more fever than other vaccines in the schedule' },
      { severity: 'normal', text: 'Injection site redness, swelling, and pain' },
      { severity: 'normal', text: 'Irritability, drowsiness, or loss of appetite for 24–48 hours' },
    ],
    duration: '24–48 hours. Fever from PCV may be slightly higher than with other vaccines.',
    comfortTips: [
      '🤱 Breastfeed during/immediately after — reduces pain significantly',
      '🌡️ Check temperature more frequently with PCV — it can spike higher than expected',
      '💊 Paracetamol for fever > 38.5°C at weight-appropriate dose',
    ],
    doctorIf: [
      'Fever above 40°C',
      'Redness spreading beyond 5 cm from the injection site',
      'Persistent fever beyond 48 hours',
    ],
    importantNote: 'PCV is often given on the same day as DTP — both vaccines may combine to cause more significant fever on day 1. This is expected and manageable.',
  },

  rotavirus: {
    emoji: '💧',
    shortName: 'Rotavirus',
    route: 'Oral — liquid squeezed from a tube into the mouth',
    protectsAgainst: ['Rotavirus gastroenteritis (severe vomiting and diarrhoea, leading cause of infant hospitalization in India)'],
    sideEffects: [
      { severity: 'normal', text: 'Mild temporary increase in spitting up or vomiting' },
      { severity: 'normal', text: 'Loose stools for 1–3 days — the vaccine contains a weakened live virus' },
      { severity: 'normal', text: 'Mild fussiness or irritability' },
    ],
    duration: 'Any loose stools or vomiting resolves within 3 days.',
    comfortTips: [
      '🍼 Try to give this vaccine before a feed session, not immediately after — vomiting is more likely on a full stomach',
      '⏳ Do not feed for 15 minutes before and after',
      '🧴 Wash hands after nappy changes for 2 weeks — virus is shed in stool',
    ],
    doctorIf: [
      'Baby develops blood in stools within 6 weeks of vaccination',
      'Signs of intussusception (intestinal blockage): severe abdominal pain with drawing up of legs, bilious vomiting, or jelly-like bloody stools',
    ],
    importantNote: 'Rotavirus vaccine must be completed before 24 weeks of age. It cannot be started after this age due to a small risk of intussusception.',
  },

  measles: {
    emoji: '💉',
    shortName: 'MR (Measles-Rubella)',
    route: 'Subcutaneous injection — upper arm',
    protectsAgainst: [
      'Measles (Khasra) — highly contagious, can cause encephalitis and death',
      'Rubella (German Measles) — causes severe foetal defects if caught in pregnancy',
    ],
    sideEffects: [
      { severity: 'normal', text: 'Fever (38–39.5°C) appearing 5–12 days after the vaccine — NOT the next day' },
      { severity: 'normal', text: 'Mild rash 5–12 days after vaccination — often mistaken for "real measles" but is not contagious' },
      { severity: 'normal', text: 'Runny nose and mild eye redness (5–12 days post-vaccine)' },
      { severity: 'normal', text: 'Soreness at injection site within 24 hours' },
    ],
    duration: 'Injection site soreness 1–2 days. Fever/rash appearing at day 5–12 lasts 1–3 days.',
    comfortTips: [
      '📅 Mark your calendar for Day 5–12 after vaccination — fever/rash appearing then is expected',
      '🌡️ For the delayed fever: treat as you would any fever — paracetamol if >38.5°C',
      '🧴 The rash does not need any treatment — it resolves on its own',
    ],
    doctorIf: [
      'Fever above 40°C at any point',
      'Seizure associated with fever (febrile seizure)',
      'Rash appearing within the first 24 hours (this is not from the vaccine)',
      'Stiff neck, severe headache, or unusual drowsiness',
    ],
    importantNote: 'The delayed fever and rash (Day 5–12) are commonly mistaken for a new illness. This is a mini immune response, not an infection, and is proof the vaccine is working.',
  },

  je: {
    emoji: '💉',
    shortName: 'JE (Japanese Encephalitis)',
    route: 'Subcutaneous injection — upper arm',
    protectsAgainst: ['Japanese Encephalitis (mosquito-borne viral brain inflammation — endemic in parts of India)'],
    sideEffects: [
      { severity: 'normal', text: 'Mild fever for 1–2 days' },
      { severity: 'normal', text: 'Soreness and redness at injection site' },
      { severity: 'normal', text: 'Mild headache (in older children)' },
    ],
    duration: '24–48 hours.',
    comfortTips: [
      '🌡️ Paracetamol if fever > 38.5°C',
      '🧊 Cool compress on injection site',
    ],
    doctorIf: [
      'High fever above 39.5°C',
      'Severe headache, neck stiffness, or altered consciousness — go to hospital immediately',
      'Allergic reaction within 30 minutes of vaccination (hives, facial swelling, breathing difficulty)',
    ],
    importantNote: 'Given in JE-endemic zones in India (UP, Bihar, Assam, West Bengal, Karnataka, Tamil Nadu). Check with your doctor if your region is endemic.',
  },

  vitamin_a: {
    emoji: '🔶',
    shortName: 'Vitamin A',
    route: 'Oral — liquid by syringe or spoon',
    protectsAgainst: ['Vitamin A deficiency', 'Blindness from deficiency', 'Increased severity of measles and diarrhoea'],
    sideEffects: [
      { severity: 'normal', text: 'Mild nausea or vomiting immediately after the large dose' },
      { severity: 'normal', text: 'Bulging fontanelle (soft spot) in infants — transient, resolves in 24–48 hours' },
    ],
    duration: 'Any nausea or fontanelle bulging resolves within 24–48 hours.',
    comfortTips: [
      '🍼 Give after a feed to reduce nausea',
      '👶 The bulging fontanelle with Vitamin A is temporary — not a sign of meningitis',
    ],
    doctorIf: [
      'Persistent vomiting for more than 12 hours',
      'Fontanelle remains bulging after 48 hours',
    ],
  },
};

// Match a vaccineId to the guide by prefix or exact match
export function getVaccineGuide(vaccineId: string): VaccineGuideEntry | null {
  const id = vaccineId.toLowerCase();
  for (const key of Object.keys(VACCINE_GUIDE)) {
    if (id.startsWith(key) || id === key) return VACCINE_GUIDE[key];
  }
  return null;
}

// ─── Pre-visit checklist ──────────────────────────────────────────────────────

export const PRE_VISIT_CHECKLIST = [
  { id: 'card',    text: 'Bring the immunisation / MCP card',              icon: '📋' },
  { id: 'dress',   text: 'Dress baby in clothing with easy thigh access',  icon: '👗' },
  { id: 'feed',    text: 'Breastfeed just before the injection',           icon: '🤱' },
  { id: 'nopara',  text: 'Do NOT give paracetamol before — it reduces antibody response', icon: '🚫' },
  { id: 'change',  text: 'Pack a change of clothes',                       icon: '🎒' },
  { id: 'hold',    text: 'Hold baby skin-to-skin during the jab',          icon: '🤗' },
  { id: 'lot',     text: 'Ask the nurse to record the lot/batch number',   icon: '📝' },
  { id: 'wait',    text: 'Wait 15–20 minutes after all vaccines before leaving the clinic', icon: '⏳' },
];

// ─── Post-vaccine care ────────────────────────────────────────────────────────

export const POST_VACCINE_CARE = [
  {
    day: 'Day 0 (Today)',
    color: '#1D4ED8',
    steps: [
      'Cool (not ice-cold) cloth on injection site for 20 min on, 20 min off',
      'Breastfeed or bottle-feed more frequently for comfort',
      'Check temperature at 4, 8, and 12 hours post-vaccine',
      'Paracetamol ONLY if temperature exceeds 38.5°C — use weight-appropriate dose',
      'Keep baby in a comfortable, slightly cooler room',
    ],
  },
  {
    day: 'Day 1–2',
    color: '#6D28D9',
    steps: [
      'Injection site may be red and swollen — gentle massage is fine',
      'Mild fever and fussiness are expected — continue paracetamol if needed',
      'Ensure adequate fluid intake; breastfeed more often',
      'Baby may sleep more than usual — this is normal',
    ],
  },
  {
    day: 'Day 3+',
    color: '#15803D',
    steps: [
      'Most side effects should have resolved by now',
      'Injection site lump (if present) may persist for several weeks — normal',
      'If fever persists beyond 48 hours, call your paediatrician',
      'For MR vaccine: watch for fever or mild rash appearing around Day 5–12 — this is a delayed normal reaction',
    ],
  },
];
