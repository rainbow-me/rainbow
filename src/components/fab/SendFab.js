import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { withNavigation } from 'react-navigation';
import RadialGradient from 'react-native-radial-gradient';
import { compose, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import Icon from '../icons/Icon';
import FloatingActionButton from './FloatingActionButton';

const GradientBackground = styled(RadialGradient)`
  ${position.cover}
`;

const SendIcon = styled(Icon)`
  margin-bottom: 2px;
`;

const SendFab = ({ disabled, onPress, ...props }) => (
  <FloatingActionButton {...props} disabled={disabled} onPress={onPress}>
    {({ size }) => (
      <Fragment>
        {!disabled && (
          <GradientBackground
            center={[0, (size / 2)]}
            colors={[colors.primaryBlue, '#006FFF']}
            radius={size}
          />
        )}
        <SendIcon name="send" />
      </Fragment>
    )}
  </FloatingActionButton>
);

SendFab.propTypes = {
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
};

export default compose(
  withNavigation,
  withHandlers({
    onPress: ({ navigation, onPress }) => (event) => {
      if (onPress) {
        return onPress(event);
      }

      return navigation.navigate('SendScreen');
    },
  }),
)(SendFab);
