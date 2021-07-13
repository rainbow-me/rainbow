import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder, RowWithMargins } from '../layout';
import { Text } from '../text';
import { position, shadow } from '@rainbow-me/styles';

const ButtonBorderRadius = 15;

const sxFactory = (darkMode, colors) =>
  StyleSheet.create({
    // eslint-disable-next-line react-native/no-unused-styles
    button: {
      ...position.centeredAsObject,
      ...shadow.buildAsObject(
        0,
        4,
        6,
        darkMode ? colors.shadow : colors.swapPurple,
        darkMode ? 0.15 : 0.4
      ),
      backgroundColor: colors.swapPurple,
      borderRadius: ButtonBorderRadius,
      height: 30,
      paddingBottom: 1,
      paddingRight: 2,
      width: 97,
    },
  });

const SavingsListRowEmptyState = ({ onPress }) => {
  const { isDarkMode, colors } = useTheme();

  const sx = useMemo(() => sxFactory(isDarkMode, colors), [isDarkMode, colors]);

  return (
    <RowWithMargins align="center" margin={8} paddingLeft={4}>
      <Text
        color={colors.blueGreyDark}
        letterSpacing="roundedTightest"
        opacity={0.5}
        size="lmedium"
        weight="bold"
      >
        $0.00
      </Text>
      <ButtonPressAnimation onPress={onPress} scaleTo={0.92} style={sx.button}>
        <Text
          align="center"
          color={colors.whiteLabel}
          letterSpacing="roundedTight"
          size="lmedium"
          weight="semibold"
        >
          􀁍 Deposit
        </Text>
        <InnerBorder radius={ButtonBorderRadius} />
      </ButtonPressAnimation>
    </RowWithMargins>
  );
};

const neverRerender = () => true;
export default React.memo(SavingsListRowEmptyState, neverRerender);
