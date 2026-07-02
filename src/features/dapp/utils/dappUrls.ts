export const getDappHost = (url?: string) => {
  if (!url) return '';
  try {
    const host = new URL(url).host;
    if (host.indexOf('www.') === 0) {
      return host.replace('www.', '');
    }
    return host;
  } catch {
    return '';
  }
};

export const getDappHostname = (url: string) => {
  if (!url) return '';
  try {
    const urlObject = new URL(url);
    let hostname;
    const subdomains = urlObject.hostname.split('.');
    if (subdomains.length === 2) {
      hostname = urlObject.hostname;
    } else if (subdomains.length > 2) {
      hostname = `${subdomains[subdomains.length - 2]}.${subdomains[subdomains.length - 1]}`;
    }
    return hostname;
  } catch {
    return '';
  }
};
