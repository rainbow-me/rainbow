import PropTypes from 'prop-types';
import React from 'react';
import TouchID from 'react-native-touch-id';
import stylePropType from 'react-style-proptype';
import {
  compose,
  lifecycle,
  omitProps,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import { position } from '../../styles';
import { Centered } from '../layout';
import Icon from './Icon';

const DefaultBiometryType = 'FaceID';

const BiometryIcon = ({
  isFaceID,
  size,
  style,
  ...props
}) => (
  <Centered
    {...props}
    {...position.sizeAsObject(size)}
    style={[style, { padding: isFaceID ? 2 : 0 }]}
  >
    <Icon
      {...position.sizeAsObject('100%')}
      color="white"
      name={isFaceID ? 'faceid' : 'touchid'}
    />
  </Centered>
);

BiometryIcon.propTypes = {
  isFaceID: PropTypes.bool,
  size: PropTypes.number,
  style: stylePropType,
};

BiometryIcon.defaultProps = {
  size: 34,
};

export default compose(
  withState('biometryType', 'setBiometryType', DefaultBiometryType),
  withHandlers({
    setBiometryType: ({ setBiometryType }) => (biometryType) => {
      setBiometryType(biometryType || DefaultBiometryType);
    },
  }),
  lifecycle({
    componentDidMount() {
      TouchID.isSupported().then(this.props.setBiometryType);
    },
  }),
  withProps(({ biometryType }) => ({ isFaceID: biometryType === DefaultBiometryType })),
  onlyUpdateForKeys(['biometryType', 'size']),
  omitProps('biometryType', 'setBiometryType'),
)(BiometryIcon);
