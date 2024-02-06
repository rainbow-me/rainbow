import React from 'react';
import { ButtonPressAnimation } from '../animations';
import { AccentColorProvider, Box, Inline, Inset, Text, useForegroundColor } from '@/design-system';

export default function CheckboxField({
  color: customColor,
  isChecked,
  label,
  onPress,
  testID,
}: {
  color: string;
  isChecked: boolean;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  const secondary15 = useForegroundColor('secondary15 (Deprecated)');
  const action = useForegroundColor('action (Deprecated)');

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.925} testID={testID}>
      <Inline alignVertical="center" space="8px" wrap={false}>
        <Box
          alignItems="center"
          borderRadius={7}
          height={{ custom: 20 }}
          justifyContent="center"
          style={{
            backgroundColor: isChecked ? customColor : undefined,
            borderColor: isChecked ? customColor || action : secondary15,
            borderWidth: 2,
          }}
          width={{ custom: 20 }}
          {...(!customColor && {
            background: !isChecked ? 'action (Deprecated)' : 'body (Deprecated)',
          })}
        >
          {isChecked && (
            <Inset left="1px (Deprecated)">
              <AccentColorProvider color="white">
                <Text color="accent" size="12px / 14px (Deprecated)" weight="bold">
                  􀆅
                </Text>
              </AccentColorProvider>
            </Inset>
          )}
        </Box>
        <Box flexShrink={1}>
          <AccentColorProvider color={customColor || action}>
            <Text color={isChecked ? 'accent' : 'secondary80 (Deprecated)'} size="16px / 22px (Deprecated)" weight="bold">
              {label}
            </Text>
          </AccentColorProvider>
        </Box>
      </Inline>
    </ButtonPressAnimation>
  );
}
