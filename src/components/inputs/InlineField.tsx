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

type InlineFieldProps = {
  label: string;
  placeholder?: string;
  multiline?: boolean;
  inputProps?: Partial<TextInputProps>;
};

export default function InlineField({
  label,
  placeholder,
  multiline,
  inputProps,
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

  return (
    <Columns>
      <Column width="1/4">
        <Inset top="19px">
          <Text size={`${textSize}px`} weight="heavy">
            {label}
          </Text>
        </Inset>
      </Column>
      <Input
        multiline={multiline}
        onContentSizeChange={handleContentSizeChange}
        placeholder={placeholder}
        style={{
          ...textStyle,
          height: inputHeight + 34,
          lineHeight: undefined,
          marginBottom: 0,
          marginTop: 0,
          paddingTop: multiline ? 15 : 0,
        }}
        {...inputProps}
      />
    </Columns>
  );
}
