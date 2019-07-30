import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  pickProps,
  onlyUpdateForKeys,
  withHandlers,
} from 'recompact';
import { withRequests } from '../../hoc';
import { Badge } from '../badge';
import { Centered } from '../layout';
import Avatar from '../Avatar';
import HeaderButton from './HeaderButton';

const ProfileHeaderButton = ({ onPress, pendingRequestCount }) => (
  <HeaderButton
    testID="goToProfile"
    onPress={onPress}
    shouldRasterizeIOS
    transformOrigin="left"
  >
    <Centered>
      <Avatar size={34} />
      {pendingRequestCount > 0 && (
        <Badge
          delay={1500}
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
  withRequests,
  withHandlers({ onPress: ({ navigation }) => () => navigation.navigate('ProfileScreen') }),
  pickProps(Object.keys(ProfileHeaderButton.propTypes)),
  onlyUpdateForKeys(['pendingRequestCount']),
)(ProfileHeaderButton);
