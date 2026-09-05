import Constants from 'expo-constants';

const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v3/product';
const TIMEOUT_MS = 12000;
const CONTACT = 'https://irn.no/prosjekter/felles-bonnetid/';

const FIELDS = [
  'code',
  'lang',
  'product_name',
  'product_name_nb',
  'brands',
  'quantity',
  'image_front_small_url',
  'ingredients_text',
  'ingredients_text_nb',
  'ingredients_text_da',
  'ingredients_text_sv',
  'ingredients_text_en',
  'ingredients_tags',
].join(',');

export const OFF_ADD_PRODUCT_URL = 'https://world.openfoodfacts.org/cgi/product.pl?type=add&code=';
export const OFF_EDIT_PRODUCT_URL = 'https://world.openfoodfacts.org/cgi/product.pl?type=edit&code=';

export type ScannedProduct = {
  barcode: string;
  name: string | null;
  brand: string | null;
  quantity: string | null;
  imageUrl: string | null;
  ingredientsText: string;
  ingredientsLanguage: string | null;
  ingredientTags: string[];
};

type ProductRow = {
  code?: string;
  lang?: string;
  product_name?: string;
  product_name_nb?: string;
  brands?: string;
  quantity?: string;
  image_front_small_url?: string;
  ingredients_text?: string;
  ingredients_text_nb?: string;
  ingredients_text_da?: string;
  ingredients_text_sv?: string;
  ingredients_text_en?: string;
  ingredients_tags?: string[];
};

type ProductResponse = {
  status?: string;
  product?: ProductRow;
};

export class RateLimitedError extends Error {
  constructor() {
    super('Open Food Facts rate limit reached');
    this.name = 'RateLimitedError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(public barcode: string) {
    super(`Product ${barcode} is not in Open Food Facts`);
    this.name = 'ProductNotFoundError';
  }
}

function userAgent(): string {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return `Bonnetid/${version} (${CONTACT})`;
}

function trimmed(value: string | undefined): string | null {
  const text = value?.trim();
  return text && text.length > 0 ? text : null;
}

function pickIngredients(row: ProductRow): { text: string; language: string | null } {
  const candidates: [string | null, string][] = [
    [trimmed(row.ingredients_text_nb), 'nb'],
    [trimmed(row.ingredients_text_da), 'da'],
    [trimmed(row.ingredients_text_sv), 'sv'],
    [trimmed(row.ingredients_text_en), 'en'],
  ];
  for (const [text, language] of candidates) {
    if (text) return { text, language };
  }
  const fallback = trimmed(row.ingredients_text);
  if (fallback) return { text: fallback, language: trimmed(row.lang) };
  return { text: '', language: null };
}

function toScannedProduct(barcode: string, row: ProductRow): ScannedProduct {
  const ingredients = pickIngredients(row);
  return {
    barcode: trimmed(row.code) ?? barcode,
    name: trimmed(row.product_name_nb) ?? trimmed(row.product_name),
    brand: trimmed(row.brands),
    quantity: trimmed(row.quantity),
    imageUrl: trimmed(row.image_front_small_url),
    ingredientsText: ingredients.text,
    ingredientsLanguage: ingredients.language,
    ingredientTags: row.ingredients_tags ?? [],
  };
}

export function isValidBarcode(barcode: string): boolean {
  return /^\d{8,14}$/.test(barcode);
}

export async function fetchScannedProduct(barcode: string): Promise<ScannedProduct> {
  if (!isValidBarcode(barcode)) throw new ProductNotFoundError(barcode);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${PRODUCT_URL}/${barcode}.json?fields=${FIELDS}`, {
      signal: controller.signal,
      headers: { 'User-Agent': userAgent(), Accept: 'application/json' },
    });

    if (response.status === 404) throw new ProductNotFoundError(barcode);
    if (response.status === 429) throw new RateLimitedError();
    if (!response.ok) throw new Error(`Open Food Facts svarte ${response.status}`);

    const body = (await response.json()) as ProductResponse;
    if (body.status !== 'success' || !body.product) throw new ProductNotFoundError(barcode);

    return toScannedProduct(barcode, body.product);
  } finally {
    clearTimeout(timeout);
  }
}
