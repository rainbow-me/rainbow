global.requestAnimationFrame = typeof window !== 'undefined' ? window.requestAnimationFrame : () => {};
global.ios = false;
global.android = false;
global.web = true;
global.__DEV__ = true;
