import { Keyboard } from 'react-native';
let keyboardOpen = false;

Keyboard.addListener('keyboardDidShow', () => (keyboardOpen = true));
Keyboard.addListener('keyboardDidHide', () => (keyboardOpen = false));
export default function isKeyboardOpen() {
  return keyboardOpen;
}
