import slugify from 'slugify';
import { transliterate } from 'transliteration';

export function createSlug(text: string): string {
  const transliterated = transliterate(text);
  return slugify(transliterated, {
    lower: true,
    strict: true,
    trim: true,
  });
}
