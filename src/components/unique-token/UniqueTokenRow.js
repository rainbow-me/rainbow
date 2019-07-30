import PropTypes from 'prop-types';
import React from 'react';
import { shouldUpdate } from 'recompact';
import { padding, position } from '../../styles';
import { deviceUtils, isNewValueForPath } from '../../utils';
import { Row } from '../layout';
import UniqueTokenCard from './UniqueTokenCard';

const CardMargin = 15;
const RowPadding = 19;
const CardSize = (deviceUtils.dimensions.width - (RowPadding * 2) - CardMargin) / 2;

const enhance = shouldUpdate((...props) => isNewValueForPath(...props, 'item.uniqueId'));

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
        key={uniqueToken.uniqueId}
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

UniqueTokenRow.height = CardSize + CardMargin;
UniqueTokenRow.cardSize = CardSize;
UniqueTokenRow.cardMargin = CardMargin;
UniqueTokenRow.rowPadding = RowPadding;

export default UniqueTokenRow;
