import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder, RowWithMargins } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position, shadow } from '@rainbow-me/styles';

const ButtonBorderRadius = 15;

const sxFactory = (darkMode: any, colors: any) =>
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
      paddingRight: 2,
      width: 97,
    },
  });

const SavingsListRowEmptyState = ({ onPress }: any) => {
  const { isDarkMode, colors } = useTheme();

  const sx = useMemo(() => sxFactory(isDarkMode, colors), [isDarkMode, colors]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <RowWithMargins align="center" margin={8} paddingLeft={4}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text
        color={colors.blueGreyDark}
        letterSpacing="roundedTightest"
        opacity={0.5}
        size="lmedium"
        weight="bold"
      >
        $0.00
      </Text>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation onPress={onPress} scaleTo={0.92} style={sx.button}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text
          align="center"
          color={colors.whiteLabel}
          letterSpacing="roundedTight"
          size="lmedium"
          weight="bold"
        >
          􀁍 Deposit
        </Text>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <InnerBorder radius={ButtonBorderRadius} />
      </ButtonPressAnimation>
    </RowWithMargins>
  );
};

const neverRerender = () => true;
export default React.memo(SavingsListRowEmptyState, neverRerender);
