export function normaliseText(value?: string) {
  if (!value) return '';

  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\([^)]*\)/g, '') // remove bracketed text
    .replace(/\[[^\]]*\]/g, '') // remove square bracket text
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}