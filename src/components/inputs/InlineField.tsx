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
  label: string;
  placeholder?: string;
  inputProps?: Partial<TextInputProps>;
  validations?: {
    allowCharacterRegex?: { match: RegExp };
    maxLength?: { value: number };
  };
};

export default function InlineField({
  label,
  placeholder,
  inputProps,
  validations,
}: InlineFieldProps) {
  const [value, setValue] = React.useState();

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
        setValue(text);
        return;
      }
      if (text === '') {
        setValue(text);
        return;
      }
      if (allowCharacterRegex?.match.test(text)) {
        setValue(text);
        return;
      }
    },
    [validations]
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
