import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForPropTypes, withHandlers } from 'recompact';
import { withRequests } from '../../hoc';
import { colors } from '../../styles';
import { Badge } from '../badge';
import Icon from '../icons/Icon';
import { Centered } from '../layout';
import HeaderButton from './HeaderButton';

const ActivityHeaderButton = ({ onPress, pendingRequestCount }) => (
  <HeaderButton onPress={onPress} transformOrigin="right">
    <Centered>
      <Icon color={colors.dark} name="clock" />
      {pendingRequestCount > 0 && (
        <Badge
          delay={2500}
          value={pendingRequestCount}
        />
      )}
    </Centered>
  </HeaderButton>
);

ActivityHeaderButton.propTypes = {
  onPress: PropTypes.func,
  pendingRequestCount: PropTypes.number,
};

export default compose(
  withRequests,
  withHandlers({
    onPress: ({ navigation }) => () => navigation.navigate('ActivityScreen'),
  }),
  onlyUpdateForPropTypes,
)(ActivityHeaderButton);
