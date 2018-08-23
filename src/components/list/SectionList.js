import PropTypes from 'prop-types';
import React from 'react';
import { SectionList as ReactSectionList } from 'react-native';
import { View } from 'react-primitives';
import styled from 'styled-components/primitives';
import { withSafeAreaViewInsetValues } from '../../hoc';
import { colors, position } from '../../styles';
import ListFooter from './ListFooter';
import ListHeader from './ListHeader';

const DefaultRenderItem = renderItemProps => <View {...renderItemProps} />;

const List = styled(ReactSectionList)`
  ${position.size('100%')}
  background-color: ${colors.white};
`;

const SectionList = ({
  renderItem,
  renderSectionFooter,
  safeAreaInset,
  showSafeAreaInsetBottom,
  ...props
}) => (
  <List
    renderItem={renderItem}
    renderSectionFooter={renderSectionFooter}
    scrollIndicatorInsets={{
      bottom: showSafeAreaInsetBottom ? safeAreaInset.bottom : 0,
      top: ListHeader.height,
    }}
    {...props}
  />
);

SectionList.propTypes = {
  renderItem: PropTypes.func,
  renderSectionFooter: PropTypes.func,
  showSafeAreaInsetBottom: PropTypes.bool,
};

SectionList.defaultProps = {
  renderItem: DefaultRenderItem,
  renderSectionFooter: ListFooter,
  showSafeAreaInsetBottom: true,
};

export default withSafeAreaViewInsetValues(SectionList);
