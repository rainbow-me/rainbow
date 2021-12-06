import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../navigation/Navigation' was resolved ... Remove this comment to see the full error message
import { useNavigation } from '../../navigation/Navigation';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, ColumnWithMargins, Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ApplePayButton' was resolved to '/Users/... Remove this comment to see the full error message
import ApplePayButton from './ApplePayButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const AddCashFooter = ({
  disabled,
  onDisabledPress,
  onSubmit,
  ...props
}: any) => {
  const { isTallPhone, isTinyPhone } = useDimensions();
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const onSupportedGeoPress = useCallback(() => {
    navigate(Routes.SUPPORTED_COUNTRIES_MODAL_SCREEN, {
      type: 'supported_countries',
    });
  }, [navigate]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ColumnWithMargins
      align="center"
      margin={19}
      paddingHorizontal={15}
      width="100%"
      {...props}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row width="100%">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ApplePayButton
          disabled={disabled}
          onDisabledPress={onDisabledPress}
          onSubmit={onSubmit}
        />
      </Row>
      {!isTinyPhone && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ButtonPressAnimation
          onPress={onSupportedGeoPress}
          paddingBottom={isTallPhone ? 10 : 15}
          paddingHorizontal={10}
          scaleTo={0.96}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <RowWithMargins align="center" margin={3}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Centered>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Emoji name="earth_americas" size="smedium" />
            </Centered>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              color={colors.alpha(colors.blueGreyDark, 0.5)}
              lineHeight="normal"
              size="lmedium"
              weight="semibold"
            >
              Works with most debit cards
            </Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Centered marginLeft={2} marginTop={0.5}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Icon
                {...position.sizeAsObject(18)}
                color={colors.alpha(colors.blueGreyDark, 0.3)}
                name="info"
              />
            </Centered>
          </RowWithMargins>
        </ButtonPressAnimation>
      )}
    </ColumnWithMargins>
  );
};

AddCashFooter.propTypes = {
  disabled: PropTypes.bool,
  onDisabledPress: PropTypes.func,
  onSubmit: PropTypes.func,
};

export default React.memo(AddCashFooter);
