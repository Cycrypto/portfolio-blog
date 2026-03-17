export function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s가-힣-]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
