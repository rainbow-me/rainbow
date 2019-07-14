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
export const RowHeight = CardSize + CardMargin;

const enhance = onlyUpdateForKeys(['uniqueId']);

const UniqueTokenRow = enhance(({
  item,
  onPress,
  onPressSend,
}) => (
  <Row
    align="center"
    css={`
      ${padding(0, RowPadding)};
      margin-bottom: ${CardMargin};
      margin-top: 0;
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
  item: PropTypes.array,
  onPress: PropTypes.func,
  onPressSend: PropTypes.func,
};

export default UniqueTokenRow;
