import React from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder, RowWithMargins } from '../layout';
import { Text } from '../text';
import { colors_NOT_REACTIVE, position, shadow } from '@rainbow-me/styles';

const ButtonBorderRadius = 15;

const sxFactory = darkMode =>
  StyleSheet.create({
    // eslint-disable-next-line react-native/no-unused-styles
    button: {
      ...position.centeredAsObject,
      ...shadow.buildAsObject(
        0,
        4,
        6,
        darkMode ? colors_NOT_REACTIVE.shadow : colors_NOT_REACTIVE.swapPurple,
        darkMode ? 0.15 : 0.4
      ),
      backgroundColor: colors_NOT_REACTIVE.swapPurple,
      borderRadius: ButtonBorderRadius,
      height: 30,
      paddingBottom: 1,
      paddingRight: 2,
      width: 97,
    },
  });

const sxDark = sxFactory(true);
const sxLight = sxFactory(false);

const SavingsListRowEmptyState = ({ onPress }) => {
  const { isDarkMode } = useTheme();

  const sx = isDarkMode ? sxDark : sxLight;

  return (
    <RowWithMargins align="center" margin={8} paddingLeft={4}>
      <Text
        color={colors_NOT_REACTIVE.blueGreyDark}
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
          color={colors_NOT_REACTIVE.whiteLabel}
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
