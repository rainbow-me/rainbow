export function adjustSize(
  orinalUrl: string,
  width: number | undefined,
  height: number | undefined
): string {
  const base = orinalUrl.split('=')[0];
  let extension = '';

  if (width !== undefined) {
    extension += `w${width}`;
  }

  if (height !== undefined) {
    extension = extension ? extension + '-' : extension;
    extension += `h${height}`;
  }

  if (extension) {
    return `${base}=${extension}`;
  }

  const url = extension ? `${base}=${extension}` : orinalUrl;

  return url;
}

export function isGoogleUserContent(url: string | undefined): boolean {
  return url?.startsWith('https://lh3.googleusercontent.com') ?? false;
}
