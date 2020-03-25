import PropTypes from 'prop-types';
import React from 'react';
import { useDimensions } from '../../hooks';
import { colors } from '../../styles';
import { Centered, ColumnWithMargins, Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import ApplePayButton from './ApplePayButton';

const AddCashFooter = ({ disabled, onDisabledPress, onSubmit, ...props }) => {
  const { isTinyPhone } = useDimensions();
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
        <RowWithMargins align="center" margin={4}>
          <Centered marginTop={1}>
            <Emoji name="us" size="medium" />
          </Centered>
          <Text
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            lineHeight="normal"
            size="lmedium"
            weight="semibold"
          >
            Supports most US debit cards
          </Text>
        </RowWithMargins>
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
