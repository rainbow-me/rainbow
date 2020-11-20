import { map } from 'lodash';
import React from 'react';
import styled from 'styled-components/primitives';
import { CoinIcon } from '../coin-icon';
import { Row } from '../layout';

const componentWidth = 70;

const Container = styled(Row).attrs({
  grow: 0,
  shrink: 1,
})`
  align-items: ${({ shouldCenter }) =>
    shouldCenter ? 'center' : 'flex-start'};
  width: ${componentWidth};
  flex-direction: column;
  left: 0;
`;

const Wrapper = styled.View`
  width: ${({ width }) => width};
`;

const LineWrapper = styled.View`
  flex-direction: row;
`;

const sizesTable = [
  { breakIndex: false, iconSize: 40, width: 30 },
  { breakIndex: false, iconSize: 40, width: 30 },
  { breakIndex: false, iconSize: 30, width: 20 },
  { breakIndex: false, iconSize: 25, width: 15 },
  { breakIndex: 1, iconSize: 20, width: 15 },
  { breakIndex: 2, iconSize: 20, width: 15 },
  { breakIndex: 3, iconSize: 20, width: 15 },
  { breakIndex: 4, iconSize: 20, width: 15 },
];

export default function CoinIconGroup({ containerStyles, tokens }) {
  const size = tokens.length - 1;
  const slicedArray = [
    tokens.slice(0, sizesTable[size].breakIndex),
    tokens.slice(sizesTable[size].breakIndex, tokens.length),
  ];

  return (
    <Container css={containerStyles} shouldCenter={sizesTable[size].breakIndex}>
      {map(slicedArray, (setOfTokens, lineIndex) => (
        <LineWrapper key={`coinLine_${lineIndex}`}>
          {map(setOfTokens, (token, index) => (
            <Wrapper
              key={`coin_${index}_${lineIndex}`}
              width={sizesTable[size].width}
              zIndex={-index}
            >
              <CoinIcon
                address={token.address}
                size={sizesTable[size].iconSize}
                symbol={token.symbol}
              />
            </Wrapper>
          ))}
        </LineWrapper>
      ))}
    </Container>
  );
}
