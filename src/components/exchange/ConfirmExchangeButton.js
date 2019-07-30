import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  // compose,
  // withHandlers,
  // withProps,
  // withState,
} from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding, position, shadow } from '../../styles';

import { Button } from '../buttons';
import { Icon } from '../icons';
import { Text } from '../text';

  // ${shadow.build(0, 6, 10, colors.purple, 0.14)};
  // width:  100%;
// const ConfirmExchangeButton = styled(Button)`
//   padding-horizontal: 5;
// `;
  // height: 64;

const ConfirmExchangeButton = ({
  disabled,
  onPress,
}) => (
  <Button
    backgroundColor={disabled ? colors.blueGreyLighter : colors.appleBlue}
    disabled={disabled}
    height={59}
    onPress={onPress}
    paddingHorizontal={5}
  >
    {disabled
      ? 'Enter an amount'
      : (
        <Fragment>
          <Icon
            {...position.sizeAsObject(32)}
            color="white"
            name='faceid'
            style={{ left: 16, position: 'absolute' }}
          />
          <Text
            color="white"
            size='h5'
            weight="semibold"
          >
            Hold to swap
          </Text>
        </Fragment>
      )}
  </Button>
);

ConfirmExchangeButton.propTypes = {
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
};

export default ConfirmExchangeButton;
