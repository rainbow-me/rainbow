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
    var mediaElements = document.querySelectorAll('video:not([paused]), audio:not([paused])');
    mediaElements.forEach(function(element) {
      element.setAttribute('data-frozen-playback-state', element.paused ? 'paused' : 'playing');
      element.setAttribute('data-frozen', 'true');
      element.pause();
    });
  
    // Suspend expensive animations and transitions
    var animatedElements = document.querySelectorAll('*[style*="animation"], *[style*="transition"]');
    animatedElements.forEach(function(element) {
      element.setAttribute('data-frozen-animation-play-state', element.style.animationPlayState);
      element.setAttribute('data-frozen-transition-property', element.style.transitionProperty);
      element.style.animationPlayState = 'paused';
      element.style.transitionProperty = 'none';
    });

    // Suspend keyframe animations
    var keyframeAnimatedElements = document.querySelectorAll('*[style*="animation-name"]');
    keyframeAnimatedElements.forEach(function(element) {
      element.setAttribute('data-frozen-animation-name', element.style.animationName);
      element.style.animationName = 'none';
    });
  })();`;

export const unfreezeWebsite = `(function() {
    // Resume media elements
    var pausedMediaElements = document.querySelectorAll('video[data-frozen="true"], audio[data-frozen="true"]');
    pausedMediaElements.forEach(function(element) {
      if (element.getAttribute('data-frozen-playback-state') === 'playing') {
        element.play();
      }
      element.removeAttribute('data-frozen');
      element.removeAttribute('data-frozen-playback-state');
    });

    // Resume animations and transitions
    var animatedElements = document.querySelectorAll('*[style*="animation"], *[style*="transition"]');
    animatedElements.forEach(function(element) {
      element.style.animationPlayState = element.getAttribute('data-frozen-animation-play-state') || 'running';
      element.style.transitionProperty = element.getAttribute('data-frozen-transition-property') || '';
      element.removeAttribute('data-frozen-animation-play-state');
      element.removeAttribute('data-frozen-transition-property');
    });

    // Resume keyframe animations
    var keyframeAnimatedElements = document.querySelectorAll('*[style*="animation-name"]');
    keyframeAnimatedElements.forEach(function(element) {
      element.style.animationName = element.getAttribute('data-frozen-animation-name') || '';
      element.removeAttribute('data-frozen-animation-name');
    });
  })();`;
