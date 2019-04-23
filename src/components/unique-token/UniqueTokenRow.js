import { isNil } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForPropTypes } from 'recompact';
import { padding } from '../../styles';
import { deviceUtils } from '../../utils';
import { Row } from '../layout';
import UniqueTokenCard from './UniqueTokenCard';

const CardMargin = 15;
const RowPadding = 19;
const CardSize = (deviceUtils.dimensions.width - (RowPadding * 2) - CardMargin) / 2;

const removeNullItems = e => !isNil(e);

export const UniqueTokenRowHeight = (isFirstRow, isLastRow) => CardSize
  + CardMargin * (isLastRow ? 1.25 : 1)
  + (isFirstRow ? CardMargin : 0);

const UniqueTokenRow = ({
  data,
  isFirstRow,
  isLastRow,
  onPress,
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
    {data.filter(removeNullItems).map((uniqueToken, itemIndex) => (
      <UniqueTokenCard
        item={uniqueToken}
        key={uniqueToken.id}
        size={CardSize}
        style={{ marginLeft: (itemIndex >= 1) ? CardMargin : 0 }}
        onPress={onPress}
      />
    ))}
  </Row>
);

UniqueTokenRow.propTypes = {
  data: PropTypes.array,
  isFirstRow: PropTypes.bool,
  isLastRow: PropTypes.bool,
  onPress: PropTypes.func,
};

export default onlyUpdateForPropTypes(UniqueTokenRow);
