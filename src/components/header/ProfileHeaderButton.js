import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  pickProps,
  pure,
  withHandlers,
} from 'recompact';
import Avatar from '../Avatar';
import HeaderButton from './HeaderButton';
import { Badge } from '../badge';
import { withRequests } from '../../hoc';
import { Centered } from '../layout';

const ProfileHeaderButton = ({ onPress, pendingRequestCount, ...props }) => (
  <HeaderButton onPress={onPress} transformOrigin="left">
    <Centered>
      <Avatar />
      {pendingRequestCount > 0 && (
        <Badge
          delay={2500}
          value={pendingRequestCount}
          zIndex={1}
        />
      )}
    </Centered>
  </HeaderButton>
);

ProfileHeaderButton.propTypes = {
  onPress: PropTypes.func,
  pendingRequestCount: PropTypes.number,
};

export default compose(
  pure,
  withRequests,
  withHandlers({ onPress: ({ navigation }) => () => navigation.navigate('ProfileScreen') }),
  pickProps(Object.keys(ProfileHeaderButton.propTypes)),
)(ProfileHeaderButton);
