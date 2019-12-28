export const calculateKeyboardHeight = screenHeight => {
  let keyboardHeight = 0;
  switch (screenHeight) {
    case 568:
      keyboardHeight = 216;
      break;
    case 667:
      keyboardHeight = 216;
      break;
    case 736:
      keyboardHeight = 226;
      break;
    case 812:
      keyboardHeight = 291;
      break;
    case 896:
      keyboardHeight = 301;
      break;
    default:
      keyboardHeight = Math.floor(screenHeight * 0.333);
  }
  return keyboardHeight;
};
