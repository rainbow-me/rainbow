import { resolveEmoji } from '../resolveEmoji';

describe('resolveEmoji', () => {
  it('resolves emoji names from emojis data, including :wrapped: notation', () => {
    expect(resolveEmoji('flag_united_states')).toBe('🇺🇸');
    expect(resolveEmoji(':flag_united_states:')).toBe('🇺🇸');
    expect(resolveEmoji('rainbow')).toBe('🌈');
  });

  it('returns null for unknown or invalid values', () => {
    expect(resolveEmoji('does_not_exist')).toBeNull();
    expect(resolveEmoji(undefined)).toBeNull();
    expect(resolveEmoji(123)).toBeNull();
  });
});
