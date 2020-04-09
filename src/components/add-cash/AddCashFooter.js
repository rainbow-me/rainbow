import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { useDimensions } from '../../hooks';
import { colors } from '../../styles';
import { Centered, ColumnWithMargins, Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import ApplePayButton from './ApplePayButton';
import { ButtonPressAnimation } from '../animations';
import { useNavigation } from 'react-navigation-hooks';

const AddCashFooter = ({ disabled, onDisabledPress, onSubmit, ...props }) => {
  const { isTinyPhone } = useDimensions();
  const { navigate } = useNavigation();
  const onSupportedGeoPress = useCallback(() => {
    navigate('OverlayExpandedSupportedCountries', {
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
        <ButtonPressAnimation onPress={onSupportedGeoPress}>
          <RowWithMargins align="center" margin={4}>
            <Centered marginTop={1}>
              <Emoji name="earth_americas" size="medium" />
            </Centered>
            <Text
              color={colors.alpha(colors.blueGreyDark, 0.6)}
              lineHeight="normal"
              size="lmedium"
              weight="semibold"
            >
              Available in 20+ countries
            </Text>
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
