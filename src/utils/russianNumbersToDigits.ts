/**
 * Converts Russian spelled-out numbers to digits in text.
 * E.g. "пятьдесят семь тысяч восемьсот девяносто пять дирхамов две копейки" 
 *   → "57 895 дирхамов 2 копейки"
 */

const ONES: Record<string, number> = {
  'ноль': 0, 'один': 1, 'одна': 1, 'одну': 1, 'одного': 1, 'одной': 1,
  'два': 2, 'две': 2, 'двух': 2, 'три': 3, 'трёх': 3, 'трех': 3,
  'четыре': 4, 'четырёх': 4, 'четырех': 4, 'пять': 5, 'пяти': 5,
  'шесть': 6, 'шести': 6, 'семь': 7, 'семи': 7,
  'восемь': 8, 'восьми': 8, 'девять': 9, 'девяти': 9,
};

const TEENS: Record<string, number> = {
  'десять': 10, 'одиннадцать': 11, 'двенадцать': 12, 'тринадцать': 13,
  'четырнадцать': 14, 'пятнадцать': 15, 'шестнадцать': 16, 'семнадцать': 17,
  'восемнадцать': 18, 'девятнадцать': 19,
};

const TENS: Record<string, number> = {
  'двадцать': 20, 'тридцать': 30, 'сорок': 40, 'пятьдесят': 50,
  'шестьдесят': 60, 'семьдесят': 70, 'восемьдесят': 80, 'девяносто': 90,
};

const HUNDREDS: Record<string, number> = {
  'сто': 100, 'ста': 100, 'двести': 200, 'двухсот': 200, 'триста': 300,
  'трёхсот': 300, 'трехсот': 300, 'четыреста': 400, 'четырёхсот': 400,
  'четырехсот': 400, 'пятьсот': 500, 'шестьсот': 600, 'семьсот': 700,
  'восемьсот': 800, 'девятьсот': 900,
};

const MULTIPLIERS: Record<string, number> = {
  'тысяча': 1000, 'тысячи': 1000, 'тысяч': 1000, 'тысячу': 1000, 'тыс': 1000,
  'миллион': 1_000_000, 'миллиона': 1_000_000, 'миллионов': 1_000_000,
  'миллиард': 1_000_000_000, 'миллиарда': 1_000_000_000, 'миллиардов': 1_000_000_000,
};

const ORDINAL_SUFFIXES: Record<string, number> = {
  'тысячных': 1000, 'тысячная': 1000, 'сотых': 100, 'сотая': 100,
  'десятых': 10, 'десятая': 10,
};

const ALL_NUMBER_WORDS = new Set([
  ...Object.keys(ONES), ...Object.keys(TEENS), ...Object.keys(TENS),
  ...Object.keys(HUNDREDS), ...Object.keys(MULTIPLIERS), ...Object.keys(ORDINAL_SUFFIXES),
  'и', // conjunction used in numbers
]);

function isNumberWord(word: string): boolean {
  return ALL_NUMBER_WORDS.has(word.toLowerCase());
}

function getWordValue(word: string): { type: 'ones' | 'teens' | 'tens' | 'hundreds' | 'multiplier' | 'ordinal' | 'conjunction' | null; value: number } {
  const w = word.toLowerCase();
  if (w === 'и') return { type: 'conjunction', value: 0 };
  if (ONES[w] !== undefined) return { type: 'ones', value: ONES[w] };
  if (TEENS[w] !== undefined) return { type: 'teens', value: TEENS[w] };
  if (TENS[w] !== undefined) return { type: 'tens', value: TENS[w] };
  if (HUNDREDS[w] !== undefined) return { type: 'hundreds', value: HUNDREDS[w] };
  if (MULTIPLIERS[w] !== undefined) return { type: 'multiplier', value: MULTIPLIERS[w] };
  if (ORDINAL_SUFFIXES[w] !== undefined) return { type: 'ordinal', value: ORDINAL_SUFFIXES[w] };
  return { type: null, value: 0 };
}

function wordsToNumber(words: string[]): number {
  let total = 0;
  let current = 0;
  let hasOrdinal = false;
  let ordinalDivisor = 1;

  for (const word of words) {
    const { type, value } = getWordValue(word);
    if (type === 'conjunction') continue;
    if (type === 'ordinal') {
      hasOrdinal = true;
      ordinalDivisor = value;
      continue;
    }
    if (type === 'multiplier') {
      if (current === 0) current = 1;
      total += current * value;
      current = 0;
    } else if (type !== null) {
      current += value;
    }
  }
  total += current;

  if (hasOrdinal) {
    return total / ordinalDivisor;
  }
  return total;
}

function formatNumber(num: number): string {
  if (Number.isInteger(num)) {
    return num.toLocaleString('ru-RU');
  }
  // Format with appropriate decimal places
  const str = num.toFixed(2);
  const [intPart, decPart] = str.split('.');
  const formattedInt = parseInt(intPart).toLocaleString('ru-RU');
  return decPart === '00' ? formattedInt : `${formattedInt},${decPart}`;
}

export function convertRussianNumbersToDigits(text: string): string {
  // Split preserving punctuation
  const tokens = text.split(/(\s+|[,.](?:\s|$))/);
  const result: string[] = [];
  let numberWords: string[] = [];
  let numberStart = -1;

  const flushNumber = () => {
    if (numberWords.length === 0) return;
    // Filter out conjunctions for pure number check
    const meaningful = numberWords.filter(w => w.toLowerCase() !== 'и');
    if (meaningful.length === 0) {
      // Just "и" - put back as text
      result.push(...numberWords);
      numberWords = [];
      return;
    }
    const num = wordsToNumber(numberWords);
    result.push(formatNumber(num));
    numberWords = [];
  };

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) {
      if (numberWords.length === 0) {
        result.push(token);
      }
      continue;
    }

    // Check if this word is part of a number
    if (isNumberWord(trimmed)) {
      // Special case: "и" should only be included if it's between number words
      if (trimmed.toLowerCase() === 'и' && numberWords.length === 0) {
        flushNumber();
        result.push(token);
        continue;
      }
      numberWords.push(trimmed);
    } else {
      flushNumber();
      result.push(token);
    }
  }
  flushNumber();

  return result.join(' ').replace(/\s+/g, ' ').trim();
}
