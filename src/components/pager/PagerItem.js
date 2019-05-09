import PropTypes from 'prop-types';
import React, { cloneElement } from 'react';
import { View } from 'react-primitives';
import { withNeverRerender } from '../../hoc';
import { dimensionsPropType } from '../../utils';

export const pagerPagePropType = PropTypes.shape({
  component: PropTypes.node.isRequired,
  dimensions: dimensionsPropType,
  name: PropTypes.string.isRequired,
});

const PagerItem = ({ item: { component, dimensions } }) => (
  <View style={dimensions}>
    {cloneElement(component, { dimensions })}
  </View>
);

PagerItem.propTypes = {
  item: pagerPagePropType,
};

export default withNeverRerender(PagerItem);
