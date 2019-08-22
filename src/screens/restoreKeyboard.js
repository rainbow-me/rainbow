import { TextInput } from 'react-native';

let input = null;

const restoreKeyboard = () => {
  const currentInput = TextInput.State.currentlyFocusedField();
  if (!currentInput && input) {
    TextInput.State.focusTextInput(input);
  }

  if (currentInput) {
    input = currentInput;
  }
};

export default restoreKeyboard;
