export const getRawReferralCode = (code: string) =>
  code.replace(/-/g, '').slice(0, 6).toLocaleUpperCase();
