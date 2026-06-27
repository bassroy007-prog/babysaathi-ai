export type KBCategory = 'development' | 'feeding' | 'sleep' | 'health' | 'concerns';

export interface KBArticle {
  id:           string;
  title:        string;
  emoji:        string;
  category:     KBCategory;
  minWeeks:     number;
  maxWeeks:     number;
  summary:      string;
  content:      string[];      // paragraphs
  tips:         string[];      // emoji-led bullets
  doctorIf?:   string[];      // warning signs
  trackerLink?: { screen: string; label: string };
}

export const CATEGORY_META: Record<KBCategory, { label: string; color: string; bg: string }> = {
  development: { label: 'Development', color: '#5B3FA8', bg: '#F0ECFF' },
  feeding:     { label: 'Feeding',     color: '#C05A00', bg: '#FFF3E0' },
  sleep:       { label: 'Sleep',       color: '#1A3A6B', bg: '#EBF0FF' },
  health:      { label: 'Health',      color: '#2D7A3A', bg: '#E6F4EA' },
  concerns:    { label: 'Concerns',    color: '#9C2763', bg: '#FDE8F2' },
};

export const KB_ARTICLES: KBArticle[] = [

  // ═══ NEWBORN  0–8 weeks ════════════════════════════════════════════════════

  {
    id: 'newborn_sleep_cycles',
    title: 'Why Newborns Sleep So Erratically',
    emoji: '🌙',
    category: 'sleep',
    minWeeks: 0, maxWeeks: 8,
    summary: 'Newborns have 45-minute sleep cycles and spend half their sleep in active REM. Short, frequent sleep is protective — not a problem to fix.',
    content: [
      'Newborn sleep cycles last only 45–50 minutes, compared to an adult\'s 90 minutes. Between cycles, babies surface briefly and often startle or cry — this is completely normal and is actually protective against SIDS. It also supports rapid brain development; newborns spend nearly 50% of sleep in active REM, which is essential for neural wiring.',
      'Most newborns need 14–17 hours of sleep per day spread across 8–12 short stretches. Day-night confusion (sleeping all day, awake at night) is very common in weeks 1–3 because the circadian system hasn\'t matured. Gentle light exposure during day feeds and dim, quiet feeds at night help set the body clock within a few weeks.',
    ],
    tips: [
      '🌞 Keep the room normally lit and talk normally during day feeds',
      '🌙 At night, feed in dim light with minimal eye contact or talking',
      '💤 Watch for sleepy cues — yawning, glazed eyes, eye-rubbing — and put down drowsy-but-awake',
      '🛏️ Safe sleep: firm flat surface, on back, room temperature 24–26°C, no loose bedding',
    ],
    doctorIf: [
      'Baby sleeps more than 5 hours without waking for a feed in the first 4 weeks',
      'Baby is very difficult to rouse even when clearly hungry',
    ],
    trackerLink: { screen: 'SleepTracker', label: 'Log a sleep session' },
  },

  {
    id: 'newborn_feeding_basics',
    title: 'Breastfeeding in the First Weeks',
    emoji: '🤱',
    category: 'feeding',
    minWeeks: 0, maxWeeks: 8,
    summary: 'Milk supply works on demand — the more your baby feeds, the more you make. Feeding 8–12 times per day in week 1 is not overfeeding; it is building your supply.',
    content: [
      'Colostrum — the thick yellowish milk in the first 2–5 days — is small in volume but packed with antibodies and perfectly calibrated for a newborn\'s marble-sized stomach. By day 3–5, breasts feel fuller as transitional milk comes in. Supply is driven entirely by demand: the more milk removed, the more is made. Skipping feeds or topping up with formula without guidance can reduce supply.',
      'Feed on demand, roughly every 2–3 hours, counting from the start of one feed to the start of the next. A feeding session may last 10–45 minutes. Signs of good transfer: audible swallowing, baby releasing the breast spontaneously, and 6+ wet nappies per day by week 2. Weight loss up to 7% in the first week is normal; most babies regain birth weight by day 10–14.',
    ],
    tips: [
      '🍼 Aim for 8–12 feeds per 24 hours in the first month',
      '✅ Check for a deep latch — wide mouth, lower lip flanged out, chin touching the breast',
      '💧 6+ wet nappies and 1–3 dirty nappies per day from week 2 = adequate intake',
      '☎️ IYCF Helpline (India): 1800-180-1104 (free breastfeeding support)',
    ],
    doctorIf: [
      'Baby has fewer than 6 wet nappies in 24 hours after day 5',
      'Baby has not regained birth weight by day 14',
      'Feeding is painful throughout and not improving after positioning changes',
    ],
    trackerLink: { screen: 'FeedTracker', label: 'Log a feed' },
  },

  {
    id: 'newborn_jaundice',
    title: 'Jaundice — What\'s Normal, What\'s Not',
    emoji: '🌼',
    category: 'health',
    minWeeks: 0, maxWeeks: 6,
    summary: 'Up to 60% of newborns develop some yellowing of skin. Physiological jaundice peaks at day 3–5 and resolves by 2 weeks. Knowing when to act matters.',
    content: [
      'Jaundice is caused by bilirubin, a yellow pigment released when the body breaks down foetal red blood cells. It appears first in the face, then moves down — the lower it reaches (chest, abdomen, legs), the higher the likely bilirubin level. Physiological jaundice peaks between day 3–5 and usually fades by day 14 in full-term babies. Frequent feeding (8–12 times/day) helps clear bilirubin through stools.',
      'Pathological jaundice is different — it appears within 24 hours of birth, or persists beyond 2 weeks (3 weeks in breastfed babies), or is accompanied by pale/white stools and dark urine (sign of liver issue). These require urgent evaluation. In India, outdoor light exposure is commonly advised; while gentle indirect light helps, it does not replace phototherapy when bilirubin levels are clinically significant.',
    ],
    tips: [
      '☀️ Frequent feeds (8–12x/day) help clear bilirubin faster than sunlight',
      '📋 Ask the hospital to check bilirubin at the 48-hour discharge check',
      '👁️ Check the whites of the eyes — yellowing there indicates higher bilirubin',
      '🚫 Do not place baby in direct sunlight — the risk of overheating and UV exposure is real',
    ],
    doctorIf: [
      'Yellow colour appears within the first 24 hours of birth',
      'Yellow colour reaches the legs or soles of feet',
      'Baby is unusually sleepy or difficult to feed',
      'Jaundice has not resolved by 2 weeks (formula-fed) or 3 weeks (breastfed)',
      'Stools are pale/white or urine is dark yellow',
    ],
  },

  {
    id: 'newborn_development',
    title: 'What Your Newborn Can Actually Do',
    emoji: '👶',
    category: 'development',
    minWeeks: 0, maxWeeks: 6,
    summary: 'Newborns are far more capable than they look. They recognise your voice, prefer face-like shapes, smell your skin, and have several built-in reflexes that shape early development.',
    content: [
      'Your baby has been hearing your voice since about week 25 of pregnancy and will preferentially turn towards it at birth. Newborns can focus clearly on objects 20–30 cm away — about the distance from your breast to your face during a feed — and prefer high-contrast patterns and faces. The rooting, sucking, grasp, and Moro reflex are all present at birth and form the foundation for later voluntary movement.',
      'The most important thing for development in the first 8 weeks is responsive interaction: making eye contact, talking, and responding to cries promptly. This builds the neural pathways for attachment and emotional regulation. Tummy time can start from day 1 when awake and supervised — even 1–2 minutes at a time is enough in the beginning.',
    ],
    tips: [
      '👁️ Hold your face 25 cm from baby\'s and watch them track your movement',
      '🗣️ Narrate what you\'re doing — "Now I\'m changing your nappy, left leg, right leg…"',
      '🤲 Skin-to-skin contact for at least 1 hour daily boosts weight gain and bonding',
      '⏱️ Start tummy time from week 1 — even 1 minute after each nappy change counts',
    ],
    trackerLink: { screen: 'MilestoneTracker', label: 'Log a milestone' },
  },

  // ═══ 2–4 MONTHS  8–16 weeks ════════════════════════════════════════════════

  {
    id: 'colic_crying_peak',
    title: 'The 6-Week Crying Peak',
    emoji: '😭',
    category: 'concerns',
    minWeeks: 4, maxWeeks: 16,
    summary: 'Crying intensity peaks at around 6 weeks and then gradually decreases. This is developmental, not a sign that something is wrong with your baby or your parenting.',
    content: [
      'All babies cry most in the evening ("witching hour"), and all babies show increased crying that peaks around 6 weeks regardless of feeding method or culture. This is called the PURPLE period of crying — it is Predictable, Unexpected, Resistant to soothing, Pain-like in appearance, Long-lasting, and Evening-concentrated. Understanding it as a developmental phase, not a medical problem, significantly reduces parental distress.',
      'Colic is defined as crying for more than 3 hours per day, more than 3 days per week, for more than 3 weeks in an otherwise healthy baby. It affects around 20% of infants. The cause is not well understood but is not caused by wind, formula type, or parenting quality. Most colic resolves spontaneously by 3–4 months. The danger is not to the baby — it is shaken baby syndrome, which occurs when a frustrated caregiver loses control. If you feel you are at risk, put baby down safely and walk away.',
    ],
    tips: [
      '🚶 A 20-minute walk in a pram often works when nothing else does',
      '🤱 "5 S\'s": Swaddle, Side/Stomach position, Shush, Swing, Suck',
      '🔄 Take turns with a partner or family member — you cannot soothe effectively when exhausted',
      '📞 If you feel unsafe, put baby down and call someone immediately',
    ],
    doctorIf: [
      'Baby has a fever above 38°C',
      'Baby seems to be in genuine physical pain with rigid abdomen or back arching',
      'Crying is accompanied by vomiting, bloody stools, or unusual rash',
      'You or your partner feel unsafe or at risk of harming the baby',
    ],
  },

  {
    id: 'tummy_time',
    title: 'Tummy Time — The Why and How',
    emoji: '🐢',
    category: 'development',
    minWeeks: 0, maxWeeks: 20,
    summary: 'Tummy time builds the neck, shoulder, and core strength needed for rolling, sitting, and crawling. The goal is 30 minutes per day total, spread across multiple sessions.',
    content: [
      'Since back-sleeping was recommended to prevent SIDS (which has reduced SIDS by 50%), babies spend less time developing the muscles used to lift their heads and push up. Tummy time counters this by exercising the neck extensors, shoulder stabilisers, and core — all essential for every subsequent gross motor milestone. Babies who skip tummy time often have delayed rolling and crawling.',
      'Start with 1–2 minutes after each nappy change in week 1, working up to 30 cumulative minutes per day by 3 months. Never do tummy time on a soft surface or unsupervised. If your baby hates it, try tummy-to-chest position (baby on your chest while you recline), or place a rolled towel under their chest for support. A toy or mirror at eye level dramatically increases engagement.',
    ],
    tips: [
      '⏱️ Aim for 30 min/day total, spread across sessions as short as 3–5 min',
      '🪞 Place a baby-safe mirror in front — babies love looking at faces, including their own',
      '🧸 Rotate interesting toys at eye level to encourage head lifting',
      '🤱 Tummy-on-your-chest counts — try it while watching TV',
    ],
    trackerLink: { screen: 'MilestoneTracker', label: 'Log head control milestone' },
  },

  {
    id: 'vaccines_first_quarter',
    title: 'India\'s Vaccine Schedule — 0 to 3 Months',
    emoji: '💉',
    category: 'health',
    minWeeks: 0, maxWeeks: 16,
    summary: 'India\'s National Immunisation Schedule protects against 12 diseases in the first 3 months alone. Vaccines work best on schedule — even a few weeks late can leave a window of vulnerability.',
    content: [
      'At birth: BCG (tuberculosis), OPV-0 (polio), and HepB-1 (Hepatitis B). At 6 weeks: DTwP/DTaP (diphtheria, tetanus, pertussis), IPV (polio), HepB-2, Hib (meningitis), PCV (pneumonia), Rotavirus. At 10 weeks: DTwP/IPV/HepB/Hib booster + Rotavirus-2. At 14 weeks: DTwP/IPV/Hib/PCV booster + Rotavirus-3. This schedule is designed to provide immunity before the peak risk period for these diseases.',
      'Common side effects — mild fever, fussiness, sore leg — are expected and resolve within 48 hours. Paracetamol (as per weight, prescribed dose) can be given for fever or discomfort. Feeding more frequently after vaccines provides comfort and may slightly boost antibody response. Serious adverse events are extremely rare and monitored actively by India\'s Adverse Events Following Immunisation (AEFI) surveillance system.',
    ],
    tips: [
      '📅 Book vaccine appointments proactively — don\'t wait for the exact date to pass',
      '🤱 Breastfeed during or immediately after the injection — it significantly reduces pain response',
      '🌡️ A fever up to 38.5°C for 24–48 hours is normal; above 39°C, call your doctor',
      '📋 Keep a vaccine card and photograph it for your records',
    ],
    doctorIf: [
      'Fever above 39°C or fever lasting more than 48 hours post-vaccine',
      'Persistent crying for more than 3 hours after vaccination',
      'A lump at the injection site that grows rather than shrinks over 2 weeks',
    ],
    trackerLink: { screen: 'VaccinationTracker', label: 'Update vaccine record' },
  },

  // ═══ 4–6 MONTHS  16–24 weeks ═══════════════════════════════════════════════

  {
    id: 'sleep_regression_4m',
    title: 'The 4-Month Sleep Regression',
    emoji: '😴',
    category: 'sleep',
    minWeeks: 14, maxWeeks: 26,
    summary: 'Around 4 months, babies\' sleep architecture permanently matures to be more adult-like — with real light sleep phases they must now learn to transition through independently.',
    content: [
      'The 4-month sleep regression is not a phase that passes on its own — it is a permanent neurological change. Your baby\'s sleep cycles mature from simple newborn cycles into adult-like stages with distinct light sleep (N1/N2), deep sleep (N3), and REM. Between cycles, they now rouse into genuine light sleep. If they have been falling asleep being fed, rocked, or held, they now need that same condition to return to sleep at each cycle boundary — which can mean waking every 45 minutes.',
      'The solution is not to wait it out — it is to help your baby learn to fall asleep independently. Put them down drowsy-but-awake at the start of sleep so they practice transitioning without your help. This is the single most impactful sleep habit you can establish. Consistent bedtime routines (bath → feed → book → dark room → white noise → down) signal sleep effectively and can reduce bedtime resistance significantly.',
    ],
    tips: [
      '🌙 Establish a 20-30 minute bedtime routine and do it identically every night',
      '💤 Put baby down drowsy-but-awake at least once per day for practice',
      '📻 White noise at 60–65 dB (similar to a running shower) can help bridge sleep cycles',
      '⏰ Ideal bedtime for this age: 7–8 PM, not later — overtiredness causes worse sleep',
    ],
    trackerLink: { screen: 'SleepAnalysis', label: 'View sleep patterns' },
  },

  {
    id: 'starting_solids_readiness',
    title: 'Is My Baby Ready for Solid Foods?',
    emoji: '🥄',
    category: 'feeding',
    minWeeks: 16, maxWeeks: 28,
    summary: 'WHO and IAP recommend starting solids at around 6 months. Signs of readiness are developmental, not hunger-based — starting too early increases allergy and digestive risk.',
    content: [
      'The three signs of readiness are: (1) sitting upright with minimal support and holding their head steady, (2) showing interest in food — watching your plate, reaching for food, opening their mouth when they see you eat, and (3) loss of the tongue-thrust reflex — they no longer automatically push food out of their mouths. Weight doubling from birth is a common myth as a readiness indicator — it is not clinically supported.',
      'Starting before 4 months significantly increases the risk of allergies, digestive issues, and displaces breast milk at a critical immunity window. Starting after 7 months increases the risk of iron deficiency (breast milk iron decreases) and texture aversion. The sweet spot is 5.5–6 months for most babies. Teeth are not required — babies can mash soft foods with their gums effectively.',
    ],
    tips: [
      '✅ All three signs (sitting, interest, no tongue-thrust) should be present together',
      '🌾 Introduce iron-rich foods first — moong dal, masoor dal, ragi — not just fruit',
      '🥄 Start with one new food every 3 days to identify any reactions',
      '🍼 Milk (breast or formula) remains the primary nutrition until 12 months',
    ],
    doctorIf: [
      'Baby consistently gags and vomits on even smooth purees past 7 months',
      'Any signs of allergic reaction: hives, swelling, breathing difficulty within 2 hours of a new food',
    ],
    trackerLink: { screen: 'BabyFoodGuide', label: 'Open Food Guide' },
  },

  {
    id: 'first_foods_india',
    title: 'First Foods the Indian Way',
    emoji: '🍚',
    category: 'feeding',
    minWeeks: 22, maxWeeks: 36,
    summary: 'Indian kitchen staples are perfectly suited for weaning. Dal water, ragi kanji, rice porridge, and mashed banana offer iron, calcium, and energy that commercial purees often lack.',
    content: [
      'Start with single-ingredient purees of low-allergenic foods. Great Indian starters: moong dal water (cook, blend, strain) provides easily digestible protein; ragi (finger millet) kanji is high in calcium and iron; soft-cooked rice mashed with a little ghee and a pinch of hing (asafoetida) aids digestion; banana mashed with breast milk is sweet and iron-rich. Avoid adding salt, sugar, honey, or jaggery before 12 months.',
      'After 2 weeks of single foods, begin combinations: rice + dal (khichdi) is a nutritionally complete meal; sweet potato + ghee provides beta-carotene and healthy fats; soft papaya provides enzymes that aid early digestion. Ghee is excellent for babies — it is rich in butyrate (gut health) and fat-soluble vitamins. There is no need to avoid any spice except salt and chilli — cumin, coriander, hing, and turmeric are all beneficial.',
    ],
    tips: [
      '🌾 Ragi kanji (100g ragi = 344mg calcium) is better than commercial rice cereals',
      '🫘 Moong dal is the most digestible legume for beginners — start here',
      '🧈 1/4 tsp ghee per meal improves absorption of fat-soluble vitamins',
      '🚫 No salt, sugar, honey, whole nuts, or cow\'s milk as a main drink until 12 months',
      '🌶️ Mild spices are fine — Indian babies have eaten them for thousands of years',
    ],
    trackerLink: { screen: 'BabyFoodGuide', label: 'Log introduced foods' },
  },

  {
    id: 'rolling_development',
    title: 'Rolling Over — Front to Back & Back to Front',
    emoji: '🔄',
    category: 'development',
    minWeeks: 12, maxWeeks: 28,
    summary: 'Rolling front-to-back typically comes first (3–5 months), then back-to-front (4–6 months). Both require the core and neck strength built through tummy time.',
    content: [
      'Front-to-back rolling is usually the first to emerge (around 3–5 months) because babies often discover it accidentally during tummy time when their top-heavy head tips them over. Back-to-front rolling requires more active core engagement and typically follows 4–8 weeks later. Once rolling begins, never leave your baby unattended on a raised surface — the transition from "not rolling" to "rolling" can happen overnight.',
      'Rolling is not just a cute trick — it is the first sign that the deep core stabilisers are working, and is the mechanical foundation for sitting and crawling. Babies who do abundant tummy time usually roll earlier. If your baby is 6 months old and not rolling either direction, mention it at the next well-baby visit but do not panic — the normal range extends to 6.5 months.',
    ],
    tips: [
      '🧸 Place a toy just out of reach to encourage baby to reach and tip',
      '⚠️ Once rolling begins, never leave on a nappy-changing table unsupervised',
      '🔄 Practice "log rolling" play — gently help baby roll to both sides',
      '⏱️ More tummy time = earlier rolling. Aim for 30+ minutes per day by 4 months',
    ],
    trackerLink: { screen: 'MilestoneTracker', label: 'Log rolling milestone' },
  },

  // ═══ 6–9 MONTHS  24–36 weeks ═══════════════════════════════════════════════

  {
    id: 'allergen_introduction',
    title: 'Introducing Allergens — Sooner is Safer',
    emoji: '🥜',
    category: 'feeding',
    minWeeks: 22, maxWeeks: 40,
    summary: 'Evidence now strongly shows that early introduction of common allergens (peanuts, eggs, fish) between 4–11 months dramatically reduces the risk of food allergies.',
    content: [
      'The LEAP study (2015) proved that early introduction of peanuts reduced peanut allergy by 80% in high-risk infants. Current guidance from the Indian Academy of Paediatrics (IAP) and WHO endorses introducing all allergenic foods between 6–11 months, one at a time, watching for 3 days before introducing the next. The "avoid until age 2" advice from the 2000s has been reversed.',
      'The top 9 allergens to introduce: peanuts (thin peanut butter dissolved in porridge), tree nuts, eggs (well-cooked yolk first, then whole), fish, shellfish, wheat, sesame, soy, and milk (in cooked form like curd or paneer — not as a drink). Introduce each one on a weekday morning so you can monitor for 2 hours. Mild symptoms like a rash around the mouth from acidic foods are not allergic reactions; hives, vomiting, or breathing changes are.',
    ],
    tips: [
      '🥜 Mix a tiny amount of smooth peanut butter into ragi porridge — start with 1/8 tsp',
      '🥚 Introduce well-cooked egg yolk at 6 months; add egg white at 8 months',
      '📅 Introduce one new allergen per 3 days — do it on a weekday morning',
      '🏥 Keep your paediatrician\'s number handy for the first introduction of each top allergen',
    ],
    doctorIf: [
      'Hives, swelling of lips or face, or difficulty breathing within 2 hours of a new food',
      'Vomiting within 1–4 hours of a new food eaten repeatedly',
    ],
    trackerLink: { screen: 'BabyFoodGuide', label: 'Log allergen introduction' },
  },

  {
    id: 'stranger_anxiety',
    title: 'Stranger Anxiety is a Sign of Healthy Attachment',
    emoji: '👀',
    category: 'development',
    minWeeks: 24, maxWeeks: 52,
    summary: 'Crying when held by relatives or strangers, and clinging to parents, is a developmental milestone — not shyness or "spoiling". It peaks between 8–10 months.',
    content: [
      'Stranger anxiety emerges when babies develop object permanence — the understanding that things exist even when out of sight. This means your baby now knows that you are a specific, irreplaceable person. Distress at separation is not a regression or a result of "carrying them too much" — it is evidence of secure attachment, which is the strongest predictor of emotional resilience in adult life.',
      'The peak is usually 8–10 months, and it wanes through the second year as language and understanding of time develop. Forcing a baby to be held by someone they are anxious about does not help them "get used to it" — it undermines their trust in you as a safe base. Instead, let them warm up gradually with you present. Familiar visitors who approach slowly and wait for the baby to initiate contact are usually accepted faster.',
    ],
    tips: [
      '🤗 Never force a baby to be held by someone they resist — let them approach on their own terms',
      '👋 Ask visitors to make eye contact and talk before reaching out — no sudden grabs',
      '🪞 Stay visible during handoffs: "Mama is right here" while passing to grandparent',
      '⏱️ Brief, consistent separations (leaving and returning) build trust that you always come back',
    ],
  },

  {
    id: 'teething',
    title: 'Teething — Relief Without Risk',
    emoji: '🦷',
    category: 'health',
    minWeeks: 20, maxWeeks: 60,
    summary: 'Teething can cause drooling, gum swelling, and mild irritability — but fever above 38°C, diarrhoea, and congestion are caused by something else, not teething.',
    content: [
      'The first tooth typically appears between 5–7 months (lower central incisors), though anywhere from 4–12 months is normal. Some babies are clearly uncomfortable in the days before a tooth erupts; others show no signs at all. Symptoms genuinely attributable to teething: excessive drooling, gum rubbing, mild sleep disturbance, and a wish to chew on everything. What teething does NOT cause: fever, diarrhoea, or serious illness — blaming teething can delay treatment of real infections.',
      'Safe relief: chilled (not frozen) teething rings, chilled cucumber or carrot sticks for babies over 6 months (with supervision), gentle gum massage with a clean finger. Products to avoid: teething gels containing lignocaine/benzocaine (can cause serious harm in infants), amber teething necklaces (strangulation and choking risk), and homeopathic teething tablets (FDA warning for inconsistent belladonna content).',
    ],
    tips: [
      '❄️ Chill a teething ring in the fridge (not freezer) for 15 min before offering',
      '👆 Rub gums gently with a clean finger — the pressure provides real relief',
      '🦷 Start gum/tooth cleaning from the first tooth: small soft brush, no toothpaste under 2',
      '🚫 Avoid teething gels, amber necklaces, and homeopathic tablets',
    ],
    doctorIf: [
      'Fever above 38°C — this is from an infection, not teething',
      'Diarrhoea lasting more than 24 hours alongside teething symptoms',
    ],
  },

  // ═══ 9–12 MONTHS  36–52 weeks ══════════════════════════════════════════════

  {
    id: 'first_words',
    title: 'First Words & Language Development',
    emoji: '🗣️',
    category: 'development',
    minWeeks: 32, maxWeeks: 60,
    summary: 'Language development begins at birth with every conversation. Babies understand far more than they can say — a 9-month-old typically understands 20+ words before producing any.',
    content: [
      'Language milestones are sequential: cooing (1–2 months), babbling with consonants like "ba-ba, da-da" (4–6 months), jargon (melodic babbling that sounds like speech, 7–10 months), first meaningful words (9–14 months), and then vocabulary explosion (18+ months). "Mama" and "papa" are typically first because those sounds are the easiest to produce — initial m, b, d sounds require only lip movement.',
      'The single biggest predictor of language development is the amount and quality of speech directed to the baby. Not screen time — live, contingent, back-and-forth conversation. Serve-and-return interactions — where you respond to the baby\'s babble and they respond back — literally build synaptic connections. Bilingual exposure does not cause confusion or delay; babies exposed to multiple languages from birth are better at distinguishing speech sounds.',
    ],
    tips: [
      '🗣️ Narrate everything: "Now I\'m putting on your left sock, then your right sock"',
      '📚 Shared book reading daily — even at 6 months — builds vocabulary faster than any app',
      '🔁 Serve-and-return: when baby babbles, respond in turn and wait for them to reply',
      '📵 Screen time before 18 months delays language development — the AAP and IAP both advise against it',
    ],
    trackerLink: { screen: 'MilestoneTracker', label: 'Log first words' },
  },

  {
    id: 'walking_timeline',
    title: 'Walking — Understanding the Real Timeline',
    emoji: '👣',
    category: 'development',
    minWeeks: 36, maxWeeks: 70,
    summary: 'The normal range for first independent steps is 9–16 months. Early walkers are not more advanced; late walkers within the normal range are not delayed.',
    content: [
      'Walking develops in a predictable sequence: pulling to stand (8–10 months) → cruising along furniture (9–12 months) → standing briefly unsupported (10–13 months) → first steps (9–16 months). Babies who bottom-shuffle (rather than crawl on hands and knees) tend to walk later — up to 18 months — but catch up completely. Crawling is not required before walking; some babies go directly from sitting to standing.',
      'Walkers (the wheeled device) delay independent walking by reducing the motivation to bear weight on legs and navigate balance. The American Academy of Pediatrics, IAP, and a Canadian ban all reflect evidence that walkers cause thousands of injuries annually without providing developmental benefit. Baby\'s feet should be bare on safe floors whenever possible — barefoot walking provides proprioceptive feedback that socks and shoes block.',
    ],
    tips: [
      '👣 Let baby walk barefoot indoors — socks make floors slippery and reduce balance feedback',
      '🪑 "Cruise practice": arrange stable furniture in a circuit for baby to walk along',
      '🚫 Avoid baby walkers — they delay walking and cause serious injury',
      '🧸 Offer a push-toy (not a wheeled seat) once baby can pull to stand confidently',
    ],
    doctorIf: [
      'Not pulling to stand by 12 months',
      'Not walking by 18 months',
      'Loses a walking skill they had previously gained',
    ],
    trackerLink: { screen: 'MilestoneTracker', label: 'Log first steps' },
  },

  {
    id: 'iron_deficiency',
    title: 'Iron Deficiency — India\'s Most Common Nutritional Issue',
    emoji: '🫘',
    category: 'health',
    minWeeks: 20, maxWeeks: 104,
    summary: 'Breast milk iron is low after 6 months, and rice-dominant Indian weaning diets often lack enough iron. Deficiency affects brain development silently — no obvious symptoms until it is severe.',
    content: [
      'Breast milk is beautifully designed for newborns but low in iron after 6 months. Foetal iron stores, laid down in the third trimester, last approximately 6 months. From 6 months, babies need 11mg of iron per day from food. In Indian diets where rice porridge and fruit dominate early weaning, iron intake is often inadequate. India has the highest prevalence of childhood anaemia globally — NFHS-5 data (2021) shows 67% of children under 5 are anaemic.',
      'Iron from animal sources (haem iron) is best absorbed. Plant-based iron (non-haem) absorption is enhanced significantly by Vitamin C. Pairing dal or ragi with amla, tomato, or lime juice doubles or triples iron absorption. Tea, coffee, and calcium (milk) given at the same time reduce iron absorption — keep them separated by at least an hour. Phytates in whole grains also reduce iron absorption; soaking and fermenting (as in idli, dosa) reduce phytate content.',
    ],
    tips: [
      '🫘 Prioritise iron-rich foods: ragi, masoor/moong dal, methi, garden cress (halim) seeds',
      '🍋 Add a squeeze of lime or a tomato to every dal or iron-rich meal',
      '🚫 Avoid giving cow\'s milk as a main drink before 12 months — it displaces iron-rich foods',
      '☕ Never give tea or coffee to babies — even in small amounts it blocks iron',
    ],
    doctorIf: [
      'Baby looks pale, especially inner eyelids or lips',
      'Baby seems unusually fatigued or disinterested in activity',
      'At the 9-month check, ask for a haemoglobin check',
    ],
  },

  // ═══ 12–18 MONTHS  52–78 weeks ═════════════════════════════════════════════

  {
    id: 'tantrums',
    title: 'Tantrums — What\'s Really Happening',
    emoji: '🌋',
    category: 'concerns',
    minWeeks: 48, maxWeeks: 104,
    summary: 'Toddler tantrums are neurological, not manipulative. The prefrontal cortex (impulse control, emotional regulation) is not mature until the mid-20s. Your toddler literally cannot control the storm.',
    content: [
      'A tantrum is the result of a nervous system flood — cortisol and adrenaline surge faster than the immature prefrontal cortex can regulate. The child is not being manipulative; they have genuinely lost control of their state. Trying to reason, argue, or punish during a tantrum is ineffective because the rational brain is effectively offline. The most effective response is to stay calm, ensure safety, and wait for the storm to pass.',
      'After the tantrum, reconnect warmly without retracing the incident. Then, when the child is fully calm, briefly name the emotion: "You were very angry because we had to leave the park." This builds emotional literacy. Preventing tantrums: give choices wherever safe ("red shirt or blue shirt?"), use transition warnings ("5 more minutes, then we go"), and ensure adequate sleep — an overtired child is a tantrum waiting to happen.',
    ],
    tips: [
      '🌊 During: stay close, ensure safety, say little — "I\'m here when you\'re ready"',
      '✅ After: warmly reconnect — "That was really hard. I love you."',
      '⏰ Prevent: give 5-minute warnings before transitions, offer limited choices',
      '😴 Most tantrums happen when overtired — guard the nap and bedtime routine',
    ],
  },

  {
    id: 'two_naps_to_one',
    title: 'The 2-to-1 Nap Transition',
    emoji: '☀️',
    category: 'sleep',
    minWeeks: 52, maxWeeks: 78,
    summary: 'Most babies transition from 2 naps to 1 between 14–18 months. Signs of readiness: consistently resisting one nap, taking too long to fall asleep for the second nap, or night sleep being disrupted.',
    content: [
      'The 2-to-1 nap transition is one of the most disruptive sleep changes of the toddler period. Unlike the 4-month regression, this one is optional timing — you can influence when it happens by adjusting the schedule. Signs of readiness include consistently taking more than 30 minutes to fall asleep for the second nap, or the second nap pushing bedtime so late it disrupts night sleep.',
      'The transition typically takes 4–6 weeks and often creates a "nap gap" where one nap is not enough but two are too many. During this period, alternate days of one and two naps, or use an earlier single nap with an earlier bedtime. The new single nap settles around 12–1 PM. Temporarily moving bedtime 30–45 minutes earlier during the transition prevents overtiredness.',
    ],
    tips: [
      '📅 Aim for the single nap at 12–1 PM once transitioned',
      '🌙 Move bedtime 30–45 min earlier during the transition period',
      '🔄 On rough days, a short "bridge nap" (20–30 min in the car) can help you through',
      '⏳ The transition takes 4–6 weeks — be patient and consistent',
    ],
    trackerLink: { screen: 'SleepAnalysis', label: 'View sleep patterns' },
  },

  {
    id: 'dental_care',
    title: 'Baby Dental Care From the First Tooth',
    emoji: '🦷',
    category: 'health',
    minWeeks: 24, maxWeeks: 104,
    summary: 'Dental decay is the most common chronic disease of childhood and is entirely preventable. It begins with the first tooth. Bottle with juice or milk at bedtime is the most common cause.',
    content: [
      'As soon as the first tooth appears, start cleaning it twice daily with a small soft toothbrush and a smear (grain-of-rice size) of fluoride toothpaste. Fluoride is safe and effective at this quantity — the "no toothpaste before age 2" advice has been updated by the Indian Dental Association and IAP. Baby bottle tooth decay — dark spots on the front upper teeth — is caused by pooling of milk or juice against teeth during sleep feeds or bedtime bottles.',
      'Night feeds beyond 12 months significantly increase decay risk because saliva production decreases during sleep and does not wash away sugars. If night feeds continue, clean the teeth after. First dental visit is recommended by 12 months or within 6 months of the first tooth — whichever comes first. Dentists identify early risk factors and demonstrate cleaning technique. Fear of the dentist in children is almost entirely caused by delayed first visits.',
    ],
    tips: [
      '🪥 Brush twice daily with rice-grain fluoride toothpaste from tooth #1',
      '🚫 No bottle/sippy cup of milk or juice in bed after 12 months',
      '🦷 First dental visit by 12 months — not just when there\'s a problem',
      '💧 Offer water after any milk feed to rinse teeth if brushing is not possible',
    ],
    doctorIf: [
      'White or brown spots visible on front teeth at any age',
      'Gums look red or swollen around a tooth (may indicate infection)',
    ],
  },

  // ═══ 18–24 MONTHS  78–104 weeks ════════════════════════════════════════════

  {
    id: 'speech_milestones',
    title: 'Speech Milestones — When to Refer',
    emoji: '💬',
    category: 'development',
    minWeeks: 68, maxWeeks: 104,
    summary: 'By 18 months, most children have 10–20 words. By 24 months, 50+ words and 2-word phrases. Early intervention for speech delay is far more effective than waiting.',
    content: [
      'Key speech checkpoints: 12 months — 2–3 words plus "mama/papa" meaningfully; 15 months — 5–10 words; 18 months — 10–20 words; 24 months — 50+ words, starting to combine 2 words ("more milk", "daddy go"). The 24-month milestone is critical — children who are not combining words at 24 months benefit significantly from early speech and language therapy.',
      'Late talkers (adequate receptive language, social engagement, but limited words) differ from children with autism (who show differences in social communication, eye contact, and play) or hearing loss (which can be tested from birth). Bilingual children may have fewer words in each language but equal total vocabulary — count words across both languages. Never tell parents to "wait and see" beyond 18 months if there are clear signs of delay.',
    ],
    tips: [
      '📚 Read aloud daily — 15 minutes of shared book reading is the most evidence-based language tool',
      '📺 Avoid screens entirely before 18 months — video chat with relatives is the only exception',
      '🔁 Expand, don\'t correct: if child says "doggy", say "Yes, big brown doggy!"',
      '👂 If you have any doubt about hearing, request a formal audiological assessment immediately',
    ],
    doctorIf: [
      'No babbling by 12 months',
      'No single words by 16 months',
      'No 2-word phrases by 24 months',
      'Any loss of previously acquired language at any age',
    ],
  },

  {
    id: 'screen_time',
    title: 'Screen Time — What the Evidence Actually Says',
    emoji: '📱',
    category: 'concerns',
    minWeeks: 0, maxWeeks: 104,
    summary: 'WHO, AAP, and IAP all recommend zero screen time under 18 months (except video calls), and maximum 1 hour/day of co-viewed quality content between 18–36 months.',
    content: [
      'Screen time in the first two years is associated with language delay (studies show a dose-response: more screen time, fewer words), attention difficulties, sleep disruption (blue light suppresses melatonin), and reduced parent-child interaction time — which is the primary driver of cognitive development. The content itself matters less than the displacement of live interaction and play.',
      'The exception is synchronous video calls with family members — these are interactive, involve real contingent responses, and do not carry the same risks. After 18 months, co-viewing with a parent who discusses content in real time dramatically reduces the harms and can build vocabulary. Solo viewing remains high-risk at this age. If screens are unavoidable in the household, maintaining family mealtimes as screen-free and keeping devices out of the bedroom reduces impact.',
    ],
    tips: [
      '🚫 No solo screen time under 18 months — video calls with grandparents are fine',
      '📺 After 18 months: watch together and talk about what you see',
      '🌙 No screens in the 1 hour before bedtime — blue light delays melatonin by 1–3 hours',
      '🍽️ Family meals are screen-free — this one habit protects both language and bonding',
    ],
  },

  {
    id: 'potty_training_readiness',
    title: 'Potty Training Readiness',
    emoji: '🚽',
    category: 'development',
    minWeeks: 78, maxWeeks: 130,
    summary: 'Most children are developmentally ready between 18–36 months. Readiness signs are physical and psychological — starting before the child is ready reliably predicts longer training time and more accidents.',
    content: [
      'Physical readiness signs: staying dry for 2+ hours, having bowel movements on a predictable schedule, being able to pull pants up and down. Psychological readiness: showing interest in the toilet or others using it, being uncomfortable in a wet or dirty nappy, being able to follow 2-step instructions ("Put this in the bin and then come here"). Most children meet all three clusters between 22–30 months, though boys typically take 2–3 months longer than girls.',
      'Child-led toilet training, where the child initiates, has the highest success rate and lowest relapse rate. Parent-led approaches (put child on toilet at timed intervals) work but require more consistency. Punishment for accidents is strongly counterproductive — it creates shame around an involuntary process and reliably delays completion. The first few days at home are the most critical for establishing the habit.',
    ],
    tips: [
      '📖 Read potty books together before starting — normalise it as part of growing up',
      '👶 Let child watch you use the toilet and explain what you\'re doing',
      '⏰ Once started, consistency is key — mixed signals (nappy sometimes) slow progress',
      '🚫 Never punish for accidents — calmly clean up and try again',
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getArticlesForAge(ageWeeks: number): KBArticle[] {
  return KB_ARTICLES.filter((a) => a.minWeeks <= ageWeeks && a.maxWeeks >= ageWeeks);
}

export function getAllArticlesByStage(): Array<{ label: string; minWeeks: number; maxWeeks: number; articles: KBArticle[] }> {
  const stages = [
    { label: 'Newborn',    minWeeks: 0,   maxWeeks: 8   },
    { label: '2–4 months', minWeeks: 8,   maxWeeks: 16  },
    { label: '4–6 months', minWeeks: 16,  maxWeeks: 24  },
    { label: '6–9 months', minWeeks: 24,  maxWeeks: 36  },
    { label: '9–12 months',minWeeks: 36,  maxWeeks: 52  },
    { label: '12–18 months',minWeeks: 52, maxWeeks: 78  },
    { label: '18–24 months',minWeeks: 78, maxWeeks: 104 },
  ];
  return stages.map((s) => ({
    ...s,
    articles: KB_ARTICLES.filter((a) => a.minWeeks < s.maxWeeks && a.maxWeeks >= s.minWeeks),
  }));
}

export function getReadTime(article: KBArticle): string {
  const words = [...article.content, ...article.tips].join(' ').split(' ').length;
  const mins  = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}
