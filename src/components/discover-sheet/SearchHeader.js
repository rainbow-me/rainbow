import React from 'react';
import styled from 'styled-components';
import { Flex } from '../layout';
import { Text } from '../text';

const SearchHeaderWrapper = styled(Flex).attrs({
  align: 'center',
  height: 32,
  margin: 8,
  padding: 6,
})`
  border-radius: 12;
  background-color: ${({ theme: { colors } }) => colors.lightestGrey};
`;

export default function SearchHeader() {
  const { colors } = useTheme();
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
