import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import { padding, position } from '../../styles';
import { deviceUtils } from '../../utils';
import { Row } from '../layout';
import UniqueTokenCard from './UniqueTokenCard';

export const CardMargin = 15;
export const RowPadding = 19;
export const CardSize = (deviceUtils.dimensions.width - (RowPadding * 2) - CardMargin) / 2;

const getHeight = (isFirstRow, isLastRow) => CardSize
  + CardMargin * (isLastRow ? 1.25 : 1)
  + (isFirstRow ? CardMargin : 0);

const enhance = onlyUpdateForKeys(['isFirstRow', 'isLastRow', 'uniqueId']);

const UniqueTokenRow = enhance(({
  isFirstRow,
  isLastRow,
  item,
  onPress,
  onPressSend,
}) => (
  <Row
    align="center"
    css={`
      ${padding(0, RowPadding)};
      margin-bottom: ${CardMargin * (isLastRow ? 1.25 : 1)};
      margin-top: ${isFirstRow ? CardMargin : 0};
      width: 100%;
    `}
  >
    {item.map((uniqueToken, itemIndex) => (
      <UniqueTokenCard
        {...position.sizeAsObject(CardSize)}
        item={uniqueToken}
        key={uniqueToken.id}
        onPress={onPress}
        onPressSend={onPressSend}
        style={{ marginLeft: (itemIndex >= 1) ? CardMargin : 0 }}
      />
    ))}
  </Row>
));

UniqueTokenRow.propTypes = {
  isFirstRow: PropTypes.bool,
  isLastRow: PropTypes.bool,
  item: PropTypes.array,
  onPress: PropTypes.func,
  onPressSend: PropTypes.func,
};

UniqueTokenRow.getHeight = getHeight;

export default UniqueTokenRow;
