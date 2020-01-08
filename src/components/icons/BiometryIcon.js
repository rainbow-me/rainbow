import PropTypes from 'prop-types';
import React from 'react';
import { position } from '../../styles';
import { Centered } from '../layout';
import Icon from './Icon';

const BiometryTypeStyles = {
  faceid: {
    ...position.sizeAsObject(27),
    marginBottom: 2,
    marginLeft: 4,
  },
  passcode: {
    height: 25,
    marginBottom: 4,
    marginLeft: 4,
    width: 18,
  },
  touchid: {
    ...position.sizeAsObject(31),
    marginBottom: 1,
  },
};

const BiometryIcon = ({ biometryType, ...props }) => {
  if (!biometryType || biometryType === 'none') return null;
  const type = biometryType.toLowerCase();

  return (
    <Centered {...props} {...BiometryTypeStyles[type]} align="start">
      <Icon {...position.sizeAsObject('100%')} color="white" name={type} />
    </Centered>
  );
};

BiometryIcon.propTypes = {
  biometryType: PropTypes.string,
};

const arePropsEqual = (prev, next) => prev.biometryType === next.biometryType;
export default React.memo(BiometryIcon, arePropsEqual);
