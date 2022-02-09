import React, { useCallback, useState } from 'react';
import { TextInputProps } from 'react-native';
import Input from './Input';
import {
  Column,
  Columns,
  Inset,
  Text,
  useTextStyle,
} from '@rainbow-me/design-system';

export type InlineFieldProps = {
  defaultValue?: string;
  label: string;
  placeholder?: string;
  inputProps?: Partial<TextInputProps>;
  onChangeText: (text: string) => void;
  onEndEditing?: TextInputProps['onEndEditing'];
  validations?: {
    allowCharacterRegex?: { match: RegExp };
    maxLength?: { value: number };
  };
  value: string;
};

export default function InlineField({
  label,
  onChangeText,
  placeholder,
  inputProps,
  validations,
  onEndEditing,
  value,
}: InlineFieldProps) {
  const textSize = 16;
  const textStyle = useTextStyle({ size: `${textSize}px`, weight: 'bold' });

  const [inputHeight, setInputHeight] = useState(textSize);
  const handleContentSizeChange = useCallback(({ nativeEvent }) => {
    const contentHeight = nativeEvent.contentSize.height;
    if (contentHeight > 30) {
      setInputHeight(nativeEvent.contentSize.height);
    } else {
      setInputHeight(textSize);
    }
  }, []);

  const handleChangeText = useCallback(
    text => {
      const { allowCharacterRegex } = validations || {};
      if (!allowCharacterRegex) {
        onChangeText(text);
        return;
      }
      if (text === '') {
        onChangeText(text);
        return;
      }
      if (allowCharacterRegex?.match.test(text)) {
        onChangeText(text);
        return;
      }
    },
    [onChangeText, validations]
  );

  return (
    <Columns>
      <Column width="1/3">
        <Inset top="19px">
          <Text size={`${textSize}px`} weight="heavy">
            {label}
          </Text>
        </Inset>
      </Column>
      <Input
        maxLength={validations?.maxLength?.value}
        onChangeText={handleChangeText}
        onContentSizeChange={handleContentSizeChange}
        onEndEditing={onEndEditing}
        placeholder={placeholder}
        style={{
          ...textStyle,
          height: inputHeight + 34,
          lineHeight: undefined,
          marginBottom: 0,
          marginTop: 0,
          paddingTop: inputProps?.multiline ? 15 : 0,
        }}
        value={value}
        {...inputProps}
      />
    </Columns>
  );
}
