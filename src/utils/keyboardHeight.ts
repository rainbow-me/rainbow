import deviceUtils from '@/utils/deviceUtils';

const FALLBACK_KEYBOARD_HEIGHT = Math.floor(deviceUtils.dimensions.height / 3);

export function getDefaultKeyboardHeight(): number {
  let keyboardHeight = 0;
  switch (deviceUtils.dimensions.height) {
    case 568:
    case 667:
      keyboardHeight = 216;
      break;
    case 736:
      keyboardHeight = 226;
      break;
    case 812:
    case 844:
    case 852: // 15 Pro
    case 874: // 16 Pro
      keyboardHeight = 291;
      break;
    case 896: // 15 Pro Max
      keyboardHeight = 301;
      break;
    case 956: // 16 Pro Max
      keyboardHeight = 318;
      break;
    default:
      keyboardHeight = FALLBACK_KEYBOARD_HEIGHT;
  }

  return keyboardHeight;
}
