import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  onlyUpdateForKeys,
} from 'recompact';
import styled from 'styled-components/primitives';
import { padding } from '../../styles';
import { deviceUtils } from '../../utils';
import { Row } from '../layout';
import UniqueTokenCard from './UniqueTokenCard';

const CardMargin = 15;
const RowPadding = 19;
const CardSize = (deviceUtils.dimensions.width - (RowPadding * 2) - CardMargin) / 2;
export const UniqueTokenRowHeight = (isFirstRow, isLastRow) => CardSize
  + CardMargin * (isLastRow ? 1.25 : 1)
  + (isFirstRow ? CardMargin : 0);

const Container = styled(Row)`
  ${padding(0, RowPadding)}
  width: 100%;
`;

const UniqueTokenRow = ({
  isFirstRow,
  isLastRow,
  items,
  onPress,
}) => console.log(items) ||(
  <Container
    align="center"
    justify="start"
    style={{
      marginBottom: CardMargin * (isLastRow ? 1.25 : 1),
      marginTop: isFirstRow ? CardMargin : 0,
    }}
  >
    {items.map((uniqueToken, itemIndex) => (
      <UniqueTokenCard
        item={uniqueToken}
        key={uniqueToken.id}
        size={CardSize}
        style={{ marginLeft: (itemIndex >= 1) ? CardMargin : 0 }}
        onPress={onPress}
      />
    ))}
  </Container>
);

UniqueTokenRow.propTypes = {
  isFirstRow: PropTypes.bool,
  isLastRow: PropTypes.bool,
  items: PropTypes.array,
  onPress: PropTypes.func,
};

export default compose(
  onlyUpdateForKeys(['items', 'itemsCount', 'isLastRow']),
)(UniqueTokenRow);
