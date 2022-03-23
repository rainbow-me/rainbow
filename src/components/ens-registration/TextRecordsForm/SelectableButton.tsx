import React, { ReactNode, useMemo } from 'react';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import {
  AccentColorProvider,
  Box,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';

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
  const secondary30 = useForegroundColor('secondary30');
  const accent = useForegroundColor('accent');
  const buttonColor = isSelected ? accent : secondary30;
  const height = 30;

  return (
    <AccentColorProvider color={buttonColor}>
      <Box
        as={ButtonPressAnimation}
        height={`${height}px`}
        // @ts-expect-error
        onPress={onSelect}
        testID={testID}
      >
        <Box
          alignItems="center"
          borderRadius={12}
          height={`${height}px`}
          justifyContent="center"
          paddingHorizontal="8px"
          style={useMemo(() => ({ borderColor: buttonColor, borderWidth: 2 }), [
            buttonColor,
          ])}
        >
          <Text color="accent" size="16px" weight="heavy">
            {children}
          </Text>
        </Box>
      </Box>
    </AccentColorProvider>
  );
}
