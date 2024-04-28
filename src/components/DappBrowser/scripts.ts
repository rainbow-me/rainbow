// ⚠️ TODO: Ensure this background color logic isn't too slow
export const getWebsiteMetadata = `
  requestAnimationFrame(() => {
    function getActualBackgroundColor() {
      if (document.readyState !== 'interactive' && document.readyState !== 'complete' && !document.styleSheets.length) return undefined;

      const darkModeQuery = '(prefers-color-scheme: dark)';
      const isDarkMode = window.matchMedia(darkModeQuery).matches;

      if (isDarkMode) {
        const darkModeColor = window.getComputedStyle(document.documentElement).getPropertyValue('--background-color-dark');
        if (darkModeColor) {
          return darkModeColor;
        }
      } else {
        const lightModeColor = window.getComputedStyle(document.documentElement).getPropertyValue('--background-color-light');
        if (lightModeColor) {
          return lightModeColor;
        }
      }

      const traverseElement = (element, depth = 0) => {
        const bgColor = window.getComputedStyle(element).backgroundColor;
        if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          return bgColor;
        }
        if (depth >= 3) {
          return null;
        }
        for (let i = 0; i < element.children.length; i++) {
          const childColor = traverseElement(element.children[i], depth + 1);
          if (childColor) {
            return childColor;
          }
        }
        return null;
      };

      const htmlColor = window.getComputedStyle(document.documentElement).backgroundColor;
      if (htmlColor && htmlColor !== 'rgba(0, 0, 0, 0)' && htmlColor !== 'transparent') {
        return htmlColor;
      }
      const bodyColor = window.getComputedStyle(document.body).backgroundColor;
      if (bodyColor && bodyColor !== 'rgba(0, 0, 0, 0)' && bodyColor !== 'transparent') {
        return bodyColor;
      }

      const traversedColor = traverseElement(document.documentElement) || traverseElement(document.body);
      return traversedColor || '#FFFFFF';
    }

    const bgColor = getActualBackgroundColor();

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
  });
  `;

export const freezeWebsite = `(function() {
    // Pause media elements
    var mediaElements = document.querySelectorAll('video, audio');
    mediaElements.forEach(function(element) {
      element.pause();
    });
  
    // Suspend expensive animations and transitions
    var animatedElements = document.querySelectorAll('*[style*="animation"], *[style*="transition"]');
    animatedElements.forEach(function(element) {
      element.style.animationPlayState = 'paused';
      element.style.transitionProperty = 'none';
    });
  
    // Disable expensive CSS properties
    var expensiveElements = document.querySelectorAll('*[style*="filter"], *[style*="transform"], *[style*="opacity"], *[style*="box-shadow"]');
    expensiveElements.forEach(function(element) {
      element.style.filter = 'none';
      element.style.transform = 'none';
      element.style.opacity = '1';
      element.style.boxShadow = 'none';
    });
  
    // Suspend expensive JavaScript operations
    var originalSetTimeout = window.setTimeout;
    var originalSetInterval = window.setInterval;
    var originalRequestAnimationFrame = window.requestAnimationFrame;
    window.setTimeout = function() {};
    window.setInterval = function() {};
    window.requestAnimationFrame = function() {};
    window.__originalSetTimeout = originalSetTimeout;
    window.__originalSetInterval = originalSetInterval;
    window.__originalRequestAnimationFrame = originalRequestAnimationFrame;
  })();`;

export const unfreezeWebsite = `(function() {
    // Resume media elements
    var mediaElements = document.querySelectorAll('video, audio');
    mediaElements.forEach(function(element) {
      element.play();
    });
  
    // Resume animations and transitions
    var animatedElements = document.querySelectorAll('*[style*="animation"], *[style*="transition"]');
    animatedElements.forEach(function(element) {
      element.style.animationPlayState = 'running';
      element.style.transitionProperty = '';
    });
  
    // Restore expensive CSS properties
    var expensiveElements = document.querySelectorAll('*[style*="filter"], *[style*="transform"], *[style*="opacity"], *[style*="box-shadow"]');
    expensiveElements.forEach(function(element) {
      element.style.filter = '';
      element.style.transform = '';
      element.style.opacity = '';
      element.style.boxShadow = '';
    });
  
    // Resume expensive JavaScript operations
    window.setTimeout = window.__originalSetTimeout;
    window.setInterval = window.__originalSetInterval;
    window.requestAnimationFrame = window.__originalRequestAnimationFrame;
  })();`;
