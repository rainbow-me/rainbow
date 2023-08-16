import React, { ReactNode } from 'react';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import {
  AccentColorProvider,
  Box,
  Text,
  useForegroundColor,
} from '@/design-system';

type SelectableButtonProps = {
  children: ReactNode;
  onSelect: () => void;
  isSelected: boolean;
  testID?: string;
};

export default function SelectableButton({
  children,
  onSelect,
  isSelected,
  testID,
}: SelectableButtonProps) {
  const secondary06 = useForegroundColor('secondary06 (Deprecated)');
  const secondary30 = useForegroundColor('secondary30 (Deprecated)');
  const accent = useForegroundColor('accent');
  const borderColor = isSelected ? accent : secondary06;
  const textColor = isSelected ? accent : secondary30;
  const height = 30;

  return (
    <AccentColorProvider color={textColor}>
      <Box
        as={ButtonPressAnimation}
        height={`${height}px`}
        // @ts-ignore overloaded props
        onPress={onSelect}
        testID={testID}
      >
        <Box
          alignItems="center"
          borderRadius={12}
          height={`${height}px`}
          justifyContent="center"
          paddingHorizontal="8px"
          style={{
            borderColor: borderColor,
            borderWidth: 2,
            paddingBottom: android ? 2 : 0,
          }}
        >
          <Text
            align="center"
            color="accent"
            size="16px / 22px (Deprecated)"
            weight="heavy"
          >
            {children}
          </Text>
        </Box>
      </Box>
    </AccentColorProvider>
  );
}
