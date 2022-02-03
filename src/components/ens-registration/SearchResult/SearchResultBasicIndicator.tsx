import React from 'react';
import { Inline, Text } from '@rainbow-me/design-system';

type Props = {
  type: 'age' | 'fees';
  registrationDate?: string;
  feesCost?: number;
};

const SearchResultBasicIndicator = ({
  type,
  registrationDate,
  feesCost,
}: Props) => {
  switch (type) {
    case 'age':
      return (
        <Text color="secondary50" size="16px" weight="bold">
          This name was last registered on {registrationDate}
        </Text>
      );
    case 'fees':
      return (
        <Inline>
          <Text color="secondary50" size="16px" weight="bold">
            Estimated total cost of
            <Text color="secondary80" size="16px" weight="heavy">
              {` $${feesCost} `}
            </Text>
            with current network fees
          </Text>
        </Inline>
      );
  }
};

export default SearchResultBasicIndicator;
