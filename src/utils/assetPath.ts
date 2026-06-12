export function assetPath(path: string): string {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const base = new URL(import.meta.env.BASE_URL || "/", document.baseURI);

  return new URL(cleanPath, base).pathname;
}
