import PropTypes from 'prop-types';
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
import { sortList } from '../../helpers/sortList';
import { colors, margin, padding, position } from '../../styles';
import Tag from '../Tag';
import { Centered, FlexItem } from '../layout';
import { PagerControls } from '../pager';

const AttributesPadding = 15;
const scrollInsetBottom = AttributesPadding + PagerControls.padding * 4;

const AttributeItem = ({ trait_type: type, value }) =>
  type ? (
    <Tag css={margin(5)} key={`${type}${value}`} text={value} title={type} />
  ) : null;

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
      centerContent={!willListOverflow}
      contentContainerStyle={{
        ...position.centeredAsObject,
        flexGrow: 1,
        padding: willListOverflow ? AttributesPadding : 0,
        paddingBottom: willListOverflow ? scrollInsetBottom : AttributesPadding,
      }}
      directionalLockEnabled
      indicatorStyle={colors.isColorLight(background) ? 'white' : 'black'}
      onScroll={onScroll}
      overScrollMode="never"
      scrollEnabled={willListOverflow}
      scrollEventThrottle={32}
      scrollIndicatorInsets={{
        bottom: scrollInsetBottom - PagerControls.padding * 2,
        top: AttributesPadding,
      }}
      showsHorizontalScrollIndicator={false}
      style={{
        paddingBottom: PagerControls.padding,
      }}
    >
      <Centered
        css={padding(0, AttributesPadding * 1.125)}
        onLayout={onListLayout}
        wrap
      >
        {traits.map(AttributeItem)}
      </Centered>
    </ScrollView>
  </FlexItem>
);

UniqueTokenAttributes.propTypes = {
  background: PropTypes.string,
  onListLayout: PropTypes.func,
  onScroll: PropTypes.func,
  traits: PropTypes.arrayOf(
    PropTypes.shape({
      trait_type: PropTypes.string.isRequired,
      value: PropTypes.node.isRequired,
    })
  ),
  willListOverflow: PropTypes.bool,
};

UniqueTokenAttributes.padding = AttributesPadding;

const enhance = compose(
  withState('willListOverflow', 'setWillListOverflow', false),
  withProps(({ traits }) => ({
    // Sort traits alphabetically by "trait_type"
    traits: sortList(traits, 'trait_type', 'asc'),
  })),
  withHandlers({
    onListLayout: ({ dimensions, setWillListOverflow }) => ({
      nativeEvent: { layout },
    }) => {
      setWillListOverflow(layout.height > dimensions.height);
    },
    onScroll: () => event => event.stopPropagation(),
  }),
  onlyUpdateForKeys(['traits', 'willListOverflow'])
);

export default hoistStatics(enhance)(UniqueTokenAttributes);
