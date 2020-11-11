import React from 'react';
import styled from 'styled-components/primitives';
import { Flex } from '../layout';
import { Text } from '../text';
import { colors } from '@rainbow-me/styles';

const SearchHeaderWrapper = styled(Flex).attrs({
  align: 'center',
  height: 32,
  margin: 8,
  padding: 6,
})`
  border-radius: 12;
  background-color: ${colors.lightestGrey};
`;

export default function SearchHeader() {
  return (
    <SearchHeaderWrapper
      height={32}
      margin={8}
      radius={12}
      style={{ backgroundColor: colors.lightestGrey }}
    >
      <Text size="medium" weight="bold">
        Here will be search
      </Text>
    </SearchHeaderWrapper>
  );
}
