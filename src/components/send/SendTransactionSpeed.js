import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { colors, position } from '../../styles';
import { Button } from '../buttons';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Text } from '../text';

const SendTransactionSpeed = ({
  gasPrice,
  nativeCurrencySymbol,
  onPressTransactionSpeed,
}) => {
  const fee = get(
    gasPrice,
    'txFee.native.value.display',
    `${nativeCurrencySymbol}0.00`
  );
  const time = get(gasPrice, 'estimatedTime.display', '');

  return (
    <Row justify="space-between" marginBottom={10}>
      <Button
        backgroundColor={colors.white}
        borderColor={colors.dark}
        borderWidth={1}
        onPress={onPressTransactionSpeed}
        opacity={1}
        showShadow={false}
        size="small"
        textProps={{ color: colors.alpha(colors.blueGreyDark, 0.6) }}
        type="pill"
      >
        Fee: {fee}
      </Button>
      <Button
        backgroundColor={colors.blueGreyDark}
        borderWidth={1}
        onPress={onPressTransactionSpeed}
        scaleTo={0.96}
        size="small"
        type="pill"
      >
        <Icon
          color={colors.white}
          name="clock"
          style={{
            ...position.sizeAsObject(14),
            flex: 0,
            marginRight: 5,
          }}
        />
        <Text color={colors.white} size="medium" weight="medium">
          Arrives in ~ {time}
        </Text>
      </Button>
    </Row>
  );
};

SendTransactionSpeed.propTypes = {
  gasPrice: PropTypes.object,
  nativeCurrencySymbol: PropTypes.string,
  onPressTransactionSpeed: PropTypes.func.isRequired,
};

export default SendTransactionSpeed;
