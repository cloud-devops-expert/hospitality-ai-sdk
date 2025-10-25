/**
 * Translation Constants
 *
 * Static data for translation UI (languages, phrases, cost calculations)
 * Extracted from universal-translator to avoid bundling Transformers.js in browser
 */

/**
 * Popular language codes for hospitality
 */
export const popularLanguages = [
  { code: 'eng_Latn', name: 'English', flag: '🇬🇧', region: 'Global' },
  { code: 'spa_Latn', name: 'Spanish', flag: '🇪🇸', region: 'Europe/Americas' },
  { code: 'fra_Latn', name: 'French', flag: '🇫🇷', region: 'Europe/Africa' },
  { code: 'deu_Latn', name: 'German', flag: '🇩🇪', region: 'Europe' },
  { code: 'ita_Latn', name: 'Italian', flag: '🇮🇹', region: 'Europe' },
  { code: 'por_Latn', name: 'Portuguese', flag: '🇵🇹', region: 'Europe/Americas' },
  { code: 'rus_Cyrl', name: 'Russian', flag: '🇷🇺', region: 'Europe/Asia' },
  { code: 'zho_Hans', name: 'Chinese (Simplified)', flag: '🇨🇳', region: 'Asia' },
  { code: 'zho_Hant', name: 'Chinese (Traditional)', flag: '🇹🇼', region: 'Asia' },
  { code: 'jpn_Jpan', name: 'Japanese', flag: '🇯🇵', region: 'Asia' },
  { code: 'kor_Hang', name: 'Korean', flag: '🇰🇷', region: 'Asia' },
  { code: 'arb_Arab', name: 'Arabic', flag: '🇸🇦', region: 'Middle East' },
  { code: 'hin_Deva', name: 'Hindi', flag: '🇮🇳', region: 'Asia' },
  { code: 'tha_Thai', name: 'Thai', flag: '🇹🇭', region: 'Asia' },
  { code: 'vie_Latn', name: 'Vietnamese', flag: '🇻🇳', region: 'Asia' },
  { code: 'tur_Latn', name: 'Turkish', flag: '🇹🇷', region: 'Europe/Middle East' },
  { code: 'pol_Latn', name: 'Polish', flag: '🇵🇱', region: 'Europe' },
  { code: 'nld_Latn', name: 'Dutch', flag: '🇳🇱', region: 'Europe' },
  { code: 'swe_Latn', name: 'Swedish', flag: '🇸🇪', region: 'Europe' },
  { code: 'heb_Hebr', name: 'Hebrew', flag: '🇮🇱', region: 'Middle East' },
];

/**
 * Common hotel phrases for testing
 */
export const hotelPhrases = {
  welcome: {
    eng_Latn: 'Welcome to our hotel! We hope you enjoy your stay.',
    spa_Latn: '¡Bienvenido a nuestro hotel! Esperamos que disfrute su estadía.',
    fra_Latn: 'Bienvenue dans notre hôtel ! Nous espérons que vous apprécierez votre séjour.',
  },
  checkIn: {
    eng_Latn: 'Check-in time is 3:00 PM. Early check-in is available upon request.',
    spa_Latn: 'La hora de check-in es a las 3:00 PM. El check-in temprano está disponible bajo pedido.',
    fra_Latn: 'L\'heure d\'arrivée est 15h00. L\'enregistrement anticipé est disponible sur demande.',
  },
  breakfast: {
    eng_Latn: 'Breakfast is served daily from 6:30 AM to 10:30 AM in the main dining room.',
    spa_Latn: 'El desayuno se sirve diariamente de 6:30 AM a 10:30 AM en el comedor principal.',
    fra_Latn: 'Le petit-déjeuner est servi tous les jours de 6h30 à 10h30 dans la salle à manger principale.',
  },
  wifi: {
    eng_Latn: 'Complimentary WiFi is available throughout the hotel. The password is: Guest2024',
    spa_Latn: 'WiFi gratis está disponible en todo el hotel. La contraseña es: Guest2024',
    fra_Latn: 'Le WiFi gratuit est disponible dans tout l\'hôtel. Le mot de passe est : Guest2024',
  },
};

/**
 * Cost savings calculator
 * Google Translate: $20 per 1M characters
 * NLLB-200: $0 (local)
 */
export function calculateTranslationSavings(charactersPerMonth: number): {
  googleTranslateCost: number;
  nllbCost: number;
  savingsPerMonth: number;
  savingsPerYear: number;
} {
  const googleTranslateCost = (charactersPerMonth / 1_000_000) * 20;
  const nllbCost = 0;
  const savingsPerMonth = googleTranslateCost - nllbCost;
  const savingsPerYear = savingsPerMonth * 12;

  return {
    googleTranslateCost,
    nllbCost,
    savingsPerMonth,
    savingsPerYear,
  };
}
