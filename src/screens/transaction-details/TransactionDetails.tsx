import * as React from 'react';
import { SlackSheet } from '@/components/sheet';
import { TransactionDetailsContent } from './components/TransactionDetailsContent';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { Centered } from '@/components/layout';
import { useDimensions } from '@/hooks';
import { useRoute } from '@react-navigation/native';
import { RainbowTransaction } from '@/entities';
import { ethereumUtils } from '@/utils';
import { useTheme } from '@/theme';

// TODO: this is only temporary as I was figuring out how to do the slacksheet thing
export const TRANSACTION_DETAILS_SHEET_HEIGHT = 400;

const Container = styled(Centered).attrs({
  direction: 'column',
})(({ deviceHeight, height }: { deviceHeight: number; height: number }) => ({
  ...(height && { height: height + deviceHeight }),
  ...position.coverAsObject,
}));

type Params = {
  transaction: RainbowTransaction;
};

export const TransactionDetails: React.FC = () => {
  const route = useRoute();
  const { colors } = useTheme();
  const { transaction } = route.params as Params;
  const { height } = useDimensions();

  const hash = ethereumUtils.getHash(transaction);
  const fee = transaction.fee;

  return (
    <Container
      height={TRANSACTION_DETAILS_SHEET_HEIGHT}
      deviceHeight={height}
      backgroundColor={colors.surfacePrimary}
    >
      {/* @ts-expect-error JS component */}
      <SlackSheet
        backgroundColor={colors.surfacePrimary}
        contentHeight={TRANSACTION_DETAILS_SHEET_HEIGHT}
      >
        <TransactionDetailsContent txHash={hash} fee={fee} />
      </SlackSheet>
    </Container>
  );
};
