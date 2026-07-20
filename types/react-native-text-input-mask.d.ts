declare module 'react-native-text-input-mask' {
  import { type ForwardRefExoticComponent, type RefAttributes } from 'react';
  import { type TextInput, type TextInputProps } from 'react-native';

  export interface TextInputMaskProps extends Omit<TextInputProps, 'onChangeText'> {
    mask?: string;
    maskDefaultValue?: boolean;
    /** `extracted` is the raw value with the mask's literal characters stripped. */
    onChangeText?: (formatted: string, extracted?: string) => void;
  }

  const TextInputMask: ForwardRefExoticComponent<TextInputMaskProps & RefAttributes<TextInput>>;
  export default TextInputMask;
}
