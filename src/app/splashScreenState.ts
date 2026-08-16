let splashScreenHidden = false;

export function markSplashScreenHidden(): void {
  splashScreenHidden = true;
}

export function isSplashScreenHidden(): boolean {
  return splashScreenHidden;
}
