export function cityName(city: string): string {
  return city
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (_, separator: string, letter: string) => separator + letter.toUpperCase());
}

export function mosqueAddressLine(
  address: string,
  post: { code: string; city: string } | null | undefined,
): string {
  if (!post || /\b\d{4}\b/.test(address)) return address;
  return `${address}, ${post.code} ${cityName(post.city)}`;
}

function words(text: string): string {
  return ` ${text.toLowerCase().split(/[^\p{L}\d]+/u).filter(Boolean).join(' ')} `;
}

export function mosqueCardSubtitle(address: string | null | undefined, city: string | undefined): string {
  const place = city ? cityName(city) : undefined;
  if (!address) return place ?? '';
  if (!place || words(address).includes(words(place))) return address;
  return `${address} · ${place}`;
}
