global.requestAnimationFrame =
  typeof window !== 'undefined' ? window.requestAnimationFrame : () => {};
global.ios = false;
global.android = false;
global.__DEV__ = true;
