import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import { useDimensions } from '../../hooks';
import Routes from '../../screens/Routes/routesNames';
import { colors, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, ColumnWithMargins, Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import ApplePayButton from './ApplePayButton';

const AddCashFooter = ({ disabled, onDisabledPress, onSubmit, ...props }) => {
  const { isTallPhone, isTinyPhone } = useDimensions();
  const { navigate } = useNavigation();
  const onSupportedGeoPress = useCallback(() => {
    navigate(Routes.SUPPORTED_COUNTRIES_MODAL_SCREEN, {
      type: 'supported_countries',
    });
  }, [navigate]);

  return (
    <ColumnWithMargins
      align="center"
      margin={19}
      paddingHorizontal={15}
      width="100%"
      {...props}
    >
      <Row width="100%">
        <ApplePayButton
          disabled={disabled}
          onDisabledPress={onDisabledPress}
          onSubmit={onSubmit}
        />
      </Row>
      {!isTinyPhone && (
        <ButtonPressAnimation
          onPress={onSupportedGeoPress}
          paddingBottom={isTallPhone ? 10 : 15}
          paddingHorizontal={10}
          scaleTo={0.96}
        >
          <RowWithMargins align="center" margin={3}>
            <Centered>
              <Emoji name="earth_americas" size="smedium" />
            </Centered>
            <Text
              color={colors.alpha(colors.blueGreyDark, 0.5)}
              lineHeight="normal"
              size="lmedium"
              weight="semibold"
            >
              Works with most debit cards
            </Text>
            <Centered marginLeft={2} marginTop={0.5}>
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
