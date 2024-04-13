export const getWebsiteMetadata = `
  const bgColor = window.getComputedStyle(document.body, null).getPropertyValue('background-color') || undefined;

  const icons = Array.from(document.querySelectorAll("link[rel='apple-touch-icon'], link[rel='shortcut icon'], link[rel='icon'], link[rel='icon'][type='image/svg+xml']"));
  let highestResIcon = { href: undefined, size: 0 };

  for (const icon of icons) {
    const iconHref = icon.getAttribute('href');
    if (icon.type === 'image/svg+xml') {
      highestResIcon = { href: iconHref, size: 1000 };
      break;
    } else {
      const sizeAttribute = icon.getAttribute('sizes');
      if (sizeAttribute) {
        const size = Math.max(...sizeAttribute.split('x').map(num => parseInt(num, 10)));
        if (size > highestResIcon.size) {
          highestResIcon = { href: iconHref, size: size };
          if (size >= 180) break;
        }
      } else if (icon.rel === 'apple-touch-icon') {
        highestResIcon = { href: iconHref, size: 180 };
      } else if (iconHref && !highestResIcon.href) {
        highestResIcon = { href: iconHref, size: 0 };
      }
    }
  }

  let logoUrl;
  if (highestResIcon.href) {
    const cleanOrigin = window.location.origin.endsWith('/') ? window.location.origin : window.location.origin + '/';
    let cleanHref = highestResIcon.href;
    if(!(highestResIcon.href.startsWith('http:') || highestResIcon.href.startsWith('https:'))){
      cleanHref = cleanHref.startsWith('/') ? cleanHref.substring(1) : cleanHref;
      logoUrl = cleanOrigin + cleanHref;
    } else {
      logoUrl = cleanHref;
    }
    
  } else {
    logoUrl = undefined;
  }

  const pageTitle = document.title || undefined;

  const websiteMetadata = {
    topic: "websiteMetadata",
    payload: {
      bgColor: bgColor,
      logoUrl: logoUrl,
      pageTitle: pageTitle,
    }
  };

  window.ReactNativeWebView.postMessage(JSON.stringify(websiteMetadata));
  true;
  `;
