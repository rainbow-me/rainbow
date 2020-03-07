import PropTypes from 'prop-types';
import React from 'react';
import { useDimensions } from '../../hooks';
import { colors } from '../../styles';
import { Centered, ColumnWithMargins, Row, RowWithMargins } from '../layout';
import { Emoji, Rounded } from '../text';
import ApplePayButton from './ApplePayButton';

const AddCashFooter = ({ disabled, onDisabledPress, onSubmit, ...props }) => {
  const { isNarrowPhone } = useDimensions();
  return (
    <ColumnWithMargins
      align="center"
      margin={19}
      paddingHorizontal={15}
      paddingTop={isNarrowPhone ? 4 : 24}
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
      <RowWithMargins align="center" margin={6}>
        <Centered marginTop={2}>
          <Emoji name="us" size="lmedium" />
        </Centered>
        <Rounded
          color={colors.alpha(colors.blueGreyDark, 0.6)}
          letterSpacing="looseyGoosey"
          lineHeight="normal"
          size="lmedium"
          weight="semibold"
        >
          Supports most US debit cards
        </Rounded>
      </RowWithMargins>
    </ColumnWithMargins>
  );
};

AddCashFooter.propTypes = {
  disabled: PropTypes.bool,
  onDisabledPress: PropTypes.func,
  onSubmit: PropTypes.func,
};

export default React.memo(AddCashFooter);
