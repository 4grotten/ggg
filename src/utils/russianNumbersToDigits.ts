/**
 * Converts Russian spelled-out numbers to digits in text.
 * Handles cardinal and ordinal forms, compound numbers like "две тысячи двадцать шестого".
 */

const ONES: Record<string, number> = {
  'ноль': 0, 'нуля': 0,
  'один': 1, 'одна': 1, 'одну': 1, 'одного': 1, 'одной': 1, 'одно': 1, 'первого': 1, 'первое': 1, 'первый': 1, 'первая': 1,
  'два': 2, 'две': 2, 'двух': 2, 'второго': 2, 'второе': 2, 'второй': 2, 'вторая': 2,
  'три': 3, 'трёх': 3, 'трех': 3, 'третьего': 3, 'третье': 3, 'третий': 3, 'третья': 3,
  'четыре': 4, 'четырёх': 4, 'четырех': 4, 'четвёртого': 4, 'четвертого': 4,
  'пять': 5, 'пяти': 5, 'пятого': 5, 'пятое': 5, 'пятый': 5,
  'шесть': 6, 'шести': 6, 'шестого': 6, 'шестое': 6, 'шестой': 6,
  'семь': 7, 'семи': 7, 'седьмого': 7, 'седьмое': 7, 'седьмой': 7,
  'восемь': 8, 'восьми': 8, 'восьмого': 8, 'восьмое': 8, 'восьмой': 8,
  'девять': 9, 'девяти': 9, 'девятого': 9, 'девятое': 9, 'девятый': 9,
};

const TEENS: Record<string, number> = {
  'десять': 10, 'десятого': 10,
  'одиннадцать': 11, 'одиннадцатого': 11,
  'двенадцать': 12, 'двенадцатого': 12,
  'тринадцать': 13, 'тринадцатого': 13,
  'четырнадцать': 14, 'четырнадцатого': 14,
  'пятнадцать': 15, 'пятнадцатого': 15,
  'шестнадцать': 16, 'шестнадцатого': 16,
  'семнадцать': 17, 'семнадцатого': 17,
  'восемнадцать': 18, 'восемнадцатого': 18,
  'девятнадцать': 19, 'девятнадцатого': 19,
};

const TENS: Record<string, number> = {
  'двадцать': 20, 'двадцатого': 20,
  'тридцать': 30, 'тридцатого': 30,
  'сорок': 40, 'сорокового': 40,
  'пятьдесят': 50, 'пятидесятого': 50,
  'шестьдесят': 60, 'шестидесятого': 60,
  'семьдесят': 70, 'семидесятого': 70,
  'восемьдесят': 80, 'восьмидесятого': 80,
  'девяносто': 90, 'девяностого': 90,
};

const HUNDREDS: Record<string, number> = {
  'сто': 100, 'ста': 100, 'сотого': 100,
  'двести': 200, 'двухсот': 200, 'двухсотого': 200,
  'триста': 300, 'трёхсот': 300, 'трехсот': 300, 'трёхсотого': 300,
  'четыреста': 400, 'четырёхсот': 400, 'четырехсот': 400,
  'пятьсот': 500, 'шестьсот': 600, 'семьсот': 700,
  'восемьсот': 800, 'девятьсот': 900,
};

const MULTIPLIERS: Record<string, number> = {
  'тысяча': 1000, 'тысячи': 1000, 'тысяч': 1000, 'тысячу': 1000, 'тыс': 1000, 'тысячного': 1000,
  'миллион': 1_000_000, 'миллиона': 1_000_000, 'миллионов': 1_000_000,
  'миллиард': 1_000_000_000, 'миллиарда': 1_000_000_000, 'миллиардов': 1_000_000_000,
};

// Fractional ordinals like "тысячных", "сотых" for decimal expressions
const FRACTIONAL_SUFFIXES: Record<string, number> = {
  'тысячных': 1000, 'тысячная': 1000,
  'сотых': 100, 'сотая': 100,
  'десятых': 10, 'десятая': 10,
};

function getWordValue(word: string): { type: 'value' | 'multiplier' | 'fractional' | null; value: number } {
  const w = word.toLowerCase();
  if (ONES[w] !== undefined) return { type: 'value', value: ONES[w] };
  if (TEENS[w] !== undefined) return { type: 'value', value: TEENS[w] };
  if (TENS[w] !== undefined) return { type: 'value', value: TENS[w] };
  if (HUNDREDS[w] !== undefined) return { type: 'value', value: HUNDREDS[w] };
  if (MULTIPLIERS[w] !== undefined) return { type: 'multiplier', value: MULTIPLIERS[w] };
  if (FRACTIONAL_SUFFIXES[w] !== undefined) return { type: 'fractional', value: FRACTIONAL_SUFFIXES[w] };
  return { type: null, value: 0 };
}

function isNumberWord(word: string): boolean {
  const w = word.toLowerCase();
  if (w === 'и') return true; // conjunction in numbers
  return getWordValue(w).type !== null;
}

function wordsToNumber(words: string[]): number {
  // Filter out conjunctions
  const filtered = words.filter(w => w.toLowerCase() !== 'и');
  if (filtered.length === 0) return 0;

  let total = 0;
  let current = 0; // accumulator for the current group (below multiplier)
  let hasFractional = false;
  let fractionalDivisor = 1;

  for (const word of filtered) {
    const { type, value } = getWordValue(word);
    
    if (type === 'fractional') {
      hasFractional = true;
      fractionalDivisor = value;
      continue;
    }
    
    if (type === 'multiplier') {
      // If current is 0, treat as 1 (e.g., "тысяча" = 1000)
      if (current === 0) current = 1;
      total += current * value;
      current = 0;
    } else if (type === 'value') {
      current += value;
    }
  }
  
  total += current;

  if (hasFractional) {
    return total / fractionalDivisor;
  }
  return total;
}

function formatNumber(num: number): string {
  if (Number.isInteger(num)) {
    return num.toLocaleString('ru-RU');
  }
  const str = num.toFixed(2);
  const [intPart, decPart] = str.split('.');
  const formattedInt = parseInt(intPart).toLocaleString('ru-RU');
  return decPart === '00' ? formattedInt : `${formattedInt},${decPart}`;
}

export function convertRussianNumbersToDigits(text: string): string {
  // Tokenize: split into words and non-word tokens (punctuation, spaces)
  const tokenRegex = /[а-яА-ЯёЁa-zA-Z]+|[^\s\wа-яА-ЯёЁ]+|\s+/g;
  const tokens: string[] = [];
  let match;
  while ((match = tokenRegex.exec(text)) !== null) {
    tokens.push(match[0]);
  }

  const result: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    const trimmed = token.trim();

    // Skip whitespace/punctuation
    if (!trimmed || !isNumberWord(trimmed)) {
      result.push(token);
      i++;
      continue;
    }

    // Don't start with just "и"
    if (trimmed.toLowerCase() === 'и') {
      result.push(token);
      i++;
      continue;
    }

    // Collect consecutive number words
    const numberWords: string[] = [trimmed];
    let j = i + 1;
    
    while (j < tokens.length) {
      const next = tokens[j].trim();
      if (!next) {
        // whitespace - look ahead
        j++;
        continue;
      }
      if (isNumberWord(next)) {
        // "и" only counts if followed by another number word
        if (next.toLowerCase() === 'и') {
          // Look ahead past whitespace for another number word
          let k = j + 1;
          while (k < tokens.length && !tokens[k].trim()) k++;
          if (k < tokens.length && isNumberWord(tokens[k].trim()) && tokens[k].trim().toLowerCase() !== 'и') {
            numberWords.push(next);
            j++;
            continue;
          } else {
            break;
          }
        }
        numberWords.push(next);
        j++;
      } else {
        break;
      }
    }

    const num = wordsToNumber(numberWords);
    result.push(formatNumber(num));
    i = j;
  }

  // Clean up multiple spaces
  return result.join('').replace(/\s{2,}/g, ' ').trim();
}
