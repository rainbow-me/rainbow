import React, { useCallback } from 'react';
// @ts-expect-error
import { IS_TESTING } from 'react-native-dotenv';
import LinearGradient from 'react-native-linear-gradient';
// @ts-expect-error
import TextInputMask from 'react-native-text-input-mask';
import { ButtonPressAnimation } from '../../animations';
import styled from '@/styled-thing';
import { buildTextStyles, margin, padding } from '@/styles';
import { useTheme } from '@/theme';
import { TextInput } from 'react-native';
import { Box, Inline, Inset, Text } from '@/design-system';

const ANDROID_EXTRA_LINE_HEIGHT = 6;

const GweiNumberInput = styled(TextInputMask).attrs(
  // @ts-expect-error
  ({ theme: { colors }, value }) => ({
    color: !value && colors.alpha(colors.blueGreyDark, 0.4),
    interval: 1,
    keyboardAppearance: 'dark',
    keyboardType: 'decimal-pad',
    letterSpacing: 'rounded',
    size: 'lmedium',
    textAlign: 'left',
    timing: 'linear',
    weight: 'heavy',
    maxWidth: 80,
  })
)(
  // @ts-expect-error
  props => ({
    // @ts-expect-error
    ...buildTextStyles.object(props),
    ...(android ? padding.object(0, 0, 0, 0) : {}),
    ...margin.object(
      android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
      0,
      android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
      0
    ),
  })
);

function GweiInputPill(
  {
    color,
    editable = true,
    value,
    onPress,
    onChange: onChangeCallback,
    onFocus,
    onBlur,
    testID,
  }: {
    color: string;
    editable: boolean;
    value: string;
    onPress: () => void;
    onChange: (test: string) => void;
    onFocus: () => void;
    onBlur: () => void;
    testID: string;
  },
  ref: React.Ref<TextInput | undefined>
) {
  const { colors, isDarkMode } = useTheme();

  const onChangeText = useCallback(
    (text: string) => {
      text = text === '.' || text === ',' ? `0${text}` : text;
      onChangeCallback(text);
    },
    [onChangeCallback]
  );

  return (
    <Box
      as={ButtonPressAnimation}
      // @ts-expect-error
      onPress={onPress}
    >
      <Box
        as={LinearGradient}
        height="40px"
        borderRadius={15}
        colors={colors.gradients.lightGreyTransparent}
        end={isDarkMode ? { x: 0, y: 0 } : { x: 0.5, y: 1 }}
        start={isDarkMode ? { x: 0.5, y: 1 } : { x: 0, y: 0 }}
      >
        <Inset vertical="10px" horizontal="12px">
          <Inline alignVertical="center">
            <GweiNumberInput
              allowFontScaling={false}
              contextMenuHidden
              editable={editable}
              mask="[9999]{.}[999]"
              onBlur={onBlur}
              onChangeText={onChangeText}
              onFocus={onFocus}
              placeholder="0"
              placeholderTextColor={colors.alpha(colors.blueGreyDark, 0.4)}
              ref={ref}
              selectionColor={color}
              spellCheck={false}
              style={{ color: colors.dark }}
              testID={testID}
              value={value}
            />
            {IS_TESTING !== 'true' && (
              <Text align="center" size="16px" weight="heavy">
                {' '}
                Gwei
              </Text>
            )}
          </Inline>
        </Inset>
      </Box>
    </Box>
  );
}

export default React.forwardRef(GweiInputPill);
