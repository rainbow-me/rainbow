import { capitalize } from 'lodash';
import React from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RadialGradient from 'react-native-radial-gradient';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Divider' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import Divider from './Divider';
import ButtonPressAnimation from './animations/ButtonPressAnimation';
// @ts-expect-error ts-migrate(6142) FIXME: Module './coin-icon/ChainBadge' was resolved to '/... Remove this comment to see the full error message
import ChainBadge from './coin-icon/ChainBadge';
import { Column, Row } from './layout';
import { Text } from './text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const L2Disclaimer = ({
  assetType,
  colors,
  hideDivider,
  marginBottom = 24,
  onPress,
  prominent,
  sending,
  symbol,
  verb,
}: any) => {
  const radialGradientProps = {
    center: [0, 1],
    colors: colors.gradients.lightGreyWhite,
    pointerEvents: 'none',
    style: {
      ...position.coverAsObject,
      overflow: 'hidden',
    },
  };
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation
        marginBottom={marginBottom}
        onPress={onPress}
        scaleTo={0.95}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row borderRadius={16} marginHorizontal={19} padding={10}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <RadialGradient
            {...radialGradientProps}
            borderRadius={16}
            radius={600}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column justify="center">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ChainBadge
              assetType={assetType}
              position="relative"
              size="small"
            />
          </Column>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column flex={1} justify="center" marginHorizontal={8}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              color={
                prominent
                  ? colors.alpha(colors.blueGreyDark, 0.8)
                  : colors.alpha(colors.blueGreyDark, 0.6)
              }
              numberOfLines={2}
              size="smedium"
              weight={prominent ? 'heavy' : 'bold'}
            >
              {verb ? verb : sending ? `Sending` : `This ${symbol} is`} on the{' '}
              {capitalize(assetType)} network
            </Text>
          </Column>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column align="end" justify="center">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              align="center"
              color={colors.alpha(colors.blueGreyDark, 0.3)}
              size="smedium"
              weight="heavy"
            >
              􀅵
            </Text>
          </Column>
        </Row>
      </ButtonPressAnimation>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      {hideDivider ? null : <Divider color={colors.rowDividerExtraLight} />}
    </>
  );
};

export default L2Disclaimer;
