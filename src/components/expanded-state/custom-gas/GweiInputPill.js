import React, { useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import TextInputMask from 'react-native-text-input-mask';
import { Row } from '../../../components/layout';
import { ButtonPressAnimation } from '../../animations';
import { Text } from '../../text';
import styled from '@rainbow-me/styled-components';
import { buildTextStyles, margin, padding } from '@rainbow-me/styles';

const ANDROID_EXTRA_LINE_HEIGHT = 6;

const GweiPill = styled(LinearGradient).attrs(
  ({ theme: { colors, isDarkMode } }) => ({
    colors: colors.gradients.lightGreyTransparent,
    end: isDarkMode ? { x: 0, y: 0 } : { x: 0.5, y: 1 },
    start: isDarkMode ? { x: 0.5, y: 1 } : { x: 0, y: 0 },
  })
)({
  borderRadius: 15,
  height: 40,
  ...(ios ? { height: 40 } : padding.object(10, 12)),
  maxWidth: 130,
  minWidth: 108,
  ...(android ? { marginHorizontal: 5 } : {}),
});

const GweiNumberInput = styled(TextInputMask).attrs(
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
    ...(ios && {
      height: '100%',
      left: 22,
      paddingLeft: 28,
      paddingRight: 72,
      paddingVertical: 10.5,
    }),
  })
)(props => ({
  ...buildTextStyles.object(props),
  ...(android ? padding.object(0, 0, 0, 0) : {}),
  ...margin.object(
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0,
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0
  ),
}));

const GweiLabel = styled(Text).attrs(() => ({
  align: 'center',
  pointerEvents: 'none',
  size: 'lmedium',
  weight: 'heavy',
}))({
  ...margin.object(
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0,
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0
  ),
  ...(ios ? { right: 50, top: 10.5 } : {}),
});

function GweiInputPill(
  {
    value,
    onPress,
    onChange: onChangeCallback,
    onFocus,
    onBlur,
    testID,
    color,
  },
  ref
) {
  const { colors } = useTheme();

  const onChangeText = useCallback(
    text => {
      text = text === '.' || text === ',' ? `0${text}` : text;
      onChangeCallback(text);
    },
    [onChangeCallback]
  );

  return (
    <ButtonPressAnimation onPress={onPress}>
      <GweiPill>
        <Row alignSelf="center" marginHorizontal={-40}>
          <GweiNumberInput
            allowFontScaling={false}
            contextMenuHidden
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
          <GweiLabel> Gwei</GweiLabel>
        </Row>
      </GweiPill>
    </ButtonPressAnimation>
  );
}

export default React.forwardRef(GweiInputPill);
