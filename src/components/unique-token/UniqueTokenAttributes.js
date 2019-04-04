import PropTypes from 'prop-types';
import styled from 'styled-components/primitives';
import { sortList } from '@rainbow-me/rainbow-common';
import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import {
  compose,
  hoistStatics,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import { colors, margin, padding } from '../../styles';
import { dimensionsPropType } from '../../utils';
import { Centered, FlexItem } from '../layout';
import { PagerControls } from '../pager';
import Tag from '../Tag';

const AttributesPadding = 15;
const scrollInsetBottom = AttributesPadding + (PagerControls.padding * 4);

const AttributeItemTag = styled(Tag)`
  ${margin(5)}
`;

const Wrapper = styled(Centered).attrs({ wrap: true })`
  ${padding(0, AttributesPadding * 1.125)}
  flex-grow: 1;
`;

const AttributeItem = ({ trait_type: type, value }) => (
  type ? (
    <AttributeItemTag
      key={`${type}${value}`}
      text={value}
      title={type}
    />
  ) : null
);

AttributeItem.propTypes = {
  trait_type: PropTypes.string.isRequired,
  value: PropTypes.string,
};

const UniqueTokenAttributes = ({
  background,
  onListLayout,
  onScroll,
  traits,
  willListOverflow,
}) => (
  <FlexItem>
    <ScrollView
      centerContent={willListOverflow}
      contentContainerStyle={{
        alignItems: 'center',
        flexDirection: 'row',
        flexGrow: 1,
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: willListOverflow ? AttributesPadding : 0,
        paddingBottom: willListOverflow ? scrollInsetBottom : AttributesPadding,
      }}
      indicatorStyle={colors.isColorLight(background) ? 'white' : 'black'}
      onScroll={onScroll}
      overScrollMode="never"
      scrollEnabled={willListOverflow}
      scrollIndicatorInsets={{
        bottom: (scrollInsetBottom - (PagerControls.padding * 2)),
        top: AttributesPadding,
      }}
      showsHorizontalScrollIndicator={false}
      style={{
        paddingBottom: PagerControls.padding,
      }}
    >
      <Wrapper onLayout={onListLayout}>
        {traits.map(AttributeItem)}
      </Wrapper>
    </ScrollView>
  </FlexItem>
);

UniqueTokenAttributes.propTypes = {
  background: PropTypes.string,
  dimensions: dimensionsPropType,
  onListLayout: PropTypes.func,
  onScroll: PropTypes.func,
  traits: PropTypes.arrayOf(PropTypes.shape({
    trait_type: PropTypes.string.isRequired,
    value: PropTypes.node.isRequired,
  })),
  willListOverflow: PropTypes.bool,
};

UniqueTokenAttributes.padding = AttributesPadding;

const enhance = compose(
  onlyUpdateForKeys(['traits', 'willListOverflow']),
  withState('willListOverflow', 'setWillListOverflow', false),
  withProps(({ traits }) => ({
    // Sort traits alphabetically by "trait_type"
    traits: sortList(traits, 'trait_type', 'asc'),
  })),
  withHandlers({
    onListLayout: ({ dimensions, setWillListOverflow }) => ({ nativeEvent: { layout } }) => {
      setWillListOverflow(layout.height > dimensions.height);
    },
    onScroll: () => event => event.stopPropagation(),
  }),
);

export default hoistStatics(enhance)(UniqueTokenAttributes);
