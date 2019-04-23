import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { colors, position } from '../../styles';
import { Button } from '../buttons';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Text } from '../text';

const SendTransactionSpeed = ({ gasPrice, nativeCurrencySymbol, onPressTransactionSpeed }) => {
  const fee = get(gasPrice, 'txFee.native.value.display', `${nativeCurrencySymbol}0.00`);
  const time = get(gasPrice, 'estimatedTime.display', '');

  return (
    <Row justify="space-between">
      <Button
        backgroundColor={colors.white}
        borderColor={colors.dark}
        borderWidth={1}
        disabled={true}
        showShadow={false}
        size="small"
        textProps={{ color: colors.blueGreyLightest }}
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
            ...position.sizeAsObject(13),
            flex: 0,
            marginRight: 5,
          }}
        />
        <Text color={colors.white} weight="medium">
          Arrives in ~ {time.slice(0, -1)}
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
