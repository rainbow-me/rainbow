import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { compose, withHandlers } from 'recompact';
import { colors } from '../../styles';
import { Badge } from '../badge';
import Icon from '../icons/Icon';
import { Centered } from '../layout';
import HeaderButton from './HeaderButton';

const ActivityHeaderButton = ({ onPress, pendingRequestCount }) => (
  <HeaderButton onPress={onPress}>
    <Centered>
      <Icon color={colors.dark} name="clock" />
      {pendingRequestCount && <Badge delay={2500} value={pendingRequestCount} />}
    </Centered>
  </HeaderButton>
);

ActivityHeaderButton.propTypes = {
  onPress: PropTypes.func,
  pendingRequestCount: PropTypes.number,
};

export default compose(
  withNavigation,
  withHandlers({
    onPress: ({ navigation, onPress }) => (event) => {
      if (onPress) {
        return onPress(event);
      }

      return navigation.navigate('ActivityScreen');
    },
  }),
)(ActivityHeaderButton);
