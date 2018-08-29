import PropTypes from 'prop-types';
import React from 'react';
import { compact } from 'lodash';
import styled from 'styled-components/primitives';
import { padding } from '../../styles';
import { deviceUtils } from '../../utils';
import { Row } from '../layout';
import UniqueTokenCard from './UniqueTokenCard';

const CardMargin = 15;
const RowPadding = 19;

const Container = styled(Row)`
  ${padding(0, RowPadding)}
  width: 100%;
`;

const UniqueTokenRow = ({ index, item, section: { data } }) => {
  const isFirstRow = index === 0;
  const isLastRow = index === (data.length - 1);

  return (
    <Container
      align="center"
      justify="start"
      style={{
        marginBottom: CardMargin * (isLastRow ? 1.25 : 1),
        marginTop: isFirstRow ? CardMargin : 0,
      }}
    >
      {compact(item).map((uniqueToken, tokenIndex) => (
        <UniqueTokenCard
          item={uniqueToken}
          key={uniqueToken.id}
          size={((deviceUtils.dimensions.width - (RowPadding * 2) - CardMargin) / 2)}
          style={{
            marginLeft: (tokenIndex >= 1) ? CardMargin : 0,
          }}
        />
      ))}
    </Container>
  );
};

UniqueTokenRow.propTypes = {
  index: PropTypes.number,
  item: PropTypes.array,
  section: PropTypes.shape({ data: PropTypes.array }),
};

export default UniqueTokenRow;
