/* Prayer-linked layers of Today's progress figure (v1.3.1, circles), inside out:
   1. WHITE Fard centre (five Fard),
   2. GREEN ring: Sunnah mu’akkadah tied to the five Fard (Rawatib),
   3. BLACK ring: Nafl tied to the prayers, plus the Sunnah ghayr mu’akkadah
      before Asr and Isha (recommended, not emphasised, as in the app's Hanafi
      rak‘ah guidance),
   4. RED-BLACK STRIPED ring: standalone voluntary prayers (Duha, Awwabin,
      Qiyam, Tahajjud, Witr),
   5. SAFFRON ring: date-specific prayers (Tarawih, Eid prayer), only on days
      that have them.
   Each Sunnah/Nafl slot belongs to one Fard and can be ticked only inside that
   prayer's time window. Stored in record.sunnah / record.nafl, separate from
   record.fard and record.voluntary, so older history is untouched. */

const FRIDAY = 5;
const isFriday = date => date instanceof Date && date.getDay() === FRIDAY;

export const SUNNAH_SLOTS = [
  { key: 'fajr_before', prayer: 'fajr', position: 'before', rakahs: 2, en: '2 Sunnah before', bn: 'আগে ২ রাকাত সুন্নাত' },
  { key: 'dhuhr_before', prayer: 'dhuhr', position: 'before', rakahs: 4, en: '4 Sunnah before', bn: 'আগে ৪ রাকাত সুন্নাত' },
  { key: 'dhuhr_after', prayer: 'dhuhr', position: 'after', rakahs: 2, fridayRakahs: 6, en: '2 Sunnah after', bn: 'পরে ২ রাকাত সুন্নাত',
    friday: { en: 'Sunnah after (Jumu’ah: 4 + 2 · Dhuhr: 2)', bn: 'পরের সুন্নাত (জুমা: ৪ + ২ · যোহর: ২)', shortEn: 'Sunnah after', shortBn: 'পরের সুন্নাত' } },
  { key: 'maghrib_after', prayer: 'maghrib', position: 'after', rakahs: 2, en: '2 Sunnah after', bn: 'পরে ২ রাকাত সুন্নাত' },
  { key: 'isha_after', prayer: 'isha', position: 'after', rakahs: 2, en: '2 Sunnah after', bn: 'পরে ২ রাকাত সুন্নাত' }
];

export const NAFL_SLOTS = [
  { key: 'dhuhr_nafl', prayer: 'dhuhr', position: 'after', rakahs: 2, en: '2 Nafl after', bn: 'পরে ২ রাকাত নফল', shortEn: '2 Nafl', shortBn: '২ নফল' },
  { key: 'asr_before', prayer: 'asr', position: 'before', rakahs: 4, en: '4 Sunnah (ghayr mu’akkadah) before', bn: 'আগে ৪ রাকাত সুন্নাতে গায়রে মুয়াক্কাদা', shortEn: '4 before (optional)', shortBn: 'আগে ৪ (ঐচ্ছিক)' },
  { key: 'maghrib_nafl', prayer: 'maghrib', position: 'after', rakahs: 2, en: '2 Nafl after', bn: 'পরে ২ রাকাত নফল', shortEn: '2 Nafl', shortBn: '২ নফল' },
  { key: 'isha_before', prayer: 'isha', position: 'before', rakahs: 4, en: '4 Sunnah (ghayr mu’akkadah) before', bn: 'আগে ৪ রাকাত সুন্নাতে গায়রে মুয়াক্কাদা', shortEn: '4 before (optional)', shortBn: 'আগে ৪ (ঐচ্ছিক)' },
  { key: 'isha_nafl', prayer: 'isha', position: 'after', rakahs: 2, en: '2 Nafl after', bn: 'পরে ২ রাকাত নফল', shortEn: '2 Nafl', shortBn: '২ নফল' }
];

export const LAYER_NAMES = {
  sunnah: { en: 'Sunnah', bn: 'সুন্নাত' },
  nafl: { en: 'Nafl', bn: 'নফল' }
};

export function slotsFor(layer) {
  return layer === 'sunnah' ? SUNNAH_SLOTS : layer === 'nafl' ? NAFL_SLOTS : [];
}

export function slotsForPrayer(layer, prayerKey) {
  return slotsFor(layer).filter(slot => slot.prayer === prayerKey);
}

export function slotLabel(slot, date, lang = 'en') {
  const l = lang === 'bn' ? 'bn' : 'en';
  return isFriday(date) && slot.friday ? slot.friday[l] : slot[l];
}

export function findSlot(layer, key) {
  return slotsFor(layer).find(slot => slot.key === key) || null;
}

/** Done flags, counts and completeness for one layer of a day record. */
export function layerState(record, layer) {
  const slots = slotsFor(layer);
  const map = (record && record[layer]) || {};
  const flags = slots.map(slot => !!map[slot.key]);
  const done = flags.filter(Boolean).length;
  return { flags, done, total: slots.length, complete: slots.length > 0 && done === slots.length };
}

/* Fard rak‘ahs for the performance-order sequence in the prayer list. */
export const FARD_RAKAHS = Object.freeze({ fajr: 2, dhuhr: 4, asr: 4, maghrib: 3, isha: 4 });

/* Date-specific prayers counted on the saffron ring instead of the striped one. */
export const SEASONAL_KEYS = Object.freeze(['tarawih', 'eid_prayer']);

export function isSeasonal(key) {
  return SEASONAL_KEYS.includes(key);
}

/** Split voluntary events into standalone (striped) and seasonal (saffron), each in prayer-time order. */
export function splitVoluntary(events = []) {
  const ordered = [...events].sort((a, b) => (a.start?.getTime?.() ?? 0) - (b.start?.getTime?.() ?? 0));
  return { standalone: ordered.filter(event => !isSeasonal(event.key)), seasonal: ordered.filter(event => isSeasonal(event.key)) };
}

/** Short chip label (with rak‘ah count) for a Sunnah/Nafl slot. */
export function slotShortLabel(slot, date, lang = 'en') {
  const bn = lang === 'bn';
  if (isFriday(date) && slot.friday) return bn ? slot.friday.shortBn : slot.friday.shortEn;
  return (bn ? slot.shortBn : slot.shortEn) || slot[bn ? 'bn' : 'en'];
}

/** Fard chip label: "4 Fard"; on Friday Dhuhr "2 Jumu’ah / 4 Dhuhr". */
export function fardPartLabel(prayerKey, date, lang = 'en') {
  const bn = lang === 'bn';
  if (prayerKey === 'dhuhr' && isFriday(date)) return bn ? '২ জুমা / ৪ যোহর' : '2 Jumu’ah / 4 Dhuhr';
  const n = FARD_RAKAHS[prayerKey] || 0;
  return bn ? `${'০১২৩৪৫৬৭৮৯'[n]} ফরজ` : `${n} Fard`;
}

/** Rak‘ahs represented by one performance-order part. Friday Jumu‘ah is 2; the Friday after-Sunnah slot is 4 + 2. */
export function partRakahCount(part, date) {
  if (part.layer === 'fard') return part.key === 'dhuhr' && isFriday(date) ? 2 : (FARD_RAKAHS[part.key] || 0);
  const slot = part.slot;
  if (!slot) return 0;
  return isFriday(date) && slot.fridayRakahs ? slot.fridayRakahs : (slot.rakahs || 0);
}

/** Rak‘ahs already recorded for one day, split by kind. Voluntary counts use the saved rak‘ah total. */
export function recordedRakahs(record = {}, date = new Date()) {
  const safe = record || {};
  let fard = 0;
  let sunnah = 0;
  let nafl = 0;
  for (const key of Object.keys(FARD_RAKAHS)) if (safe.fard?.[key]) fard += partRakahCount({ layer: 'fard', key }, date);
  for (const slot of SUNNAH_SLOTS) if (safe.sunnah?.[slot.key]) sunnah += partRakahCount({ layer: 'sunnah', slot }, date);
  for (const slot of NAFL_SLOTS) if (safe.nafl?.[slot.key]) nafl += partRakahCount({ layer: 'nafl', slot }, date);
  let voluntary = 0;
  const counts = safe.rakahs || {};
  for (const [key, value] of Object.entries(safe.voluntary || {})) if (value) voluntary += Number(counts[key]) || 0;
  for (const [key, value] of Object.entries(safe.situational || {})) if (value) voluntary += Number(counts[key]) || 0;
  const extra = Math.max(Number(safe.otherNafl) || 0, Number(counts.other_nafl) || 0);
  voluntary += extra;
  return { fard, sunnah, nafl, voluntary, total: fard + sunnah + nafl + voluntary };
}

/** Parts of one prayer in performance order: Sunnah/Nafl before, Fard, after. */
export function prayerParts(prayerKey) {
  const linked = [...slotsForPrayer('sunnah', prayerKey).map(slot => ({ layer: 'sunnah', slot })), ...slotsForPrayer('nafl', prayerKey).map(slot => ({ layer: 'nafl', slot }))];
  const before = linked.filter(part => part.slot.position === 'before');
  const after = linked.filter(part => part.slot.position !== 'before').sort((a, b) => (a.layer === 'sunnah' ? 0 : 1) - (b.layer === 'sunnah' ? 0 : 1));
  return [...before, { layer: 'fard', key: prayerKey }, ...after];
}
