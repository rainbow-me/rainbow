import * as React from 'react';
import { SlackSheet } from '@/components/sheet';
import { TransactionDetailsContent } from '@/screens/TransactionDetails/TransactionDetailsContent';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { Centered } from '@/components/layout';
import { useDimensions } from '@/hooks';
import { useRoute } from '@react-navigation/native';
import { RainbowTransaction } from '@/entities';

// TODO: this is only temporary as I was figuring out how to do the slacksheet thing
const TEMP_HEIGHT = 400;

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
  const { transaction } = route.params as Params;

  const { height } = useDimensions();
  return (
    <Container height={TEMP_HEIGHT} deviceHeight={height}>
      {/* @ts-expect-error JS component */}
      <SlackSheet contentHeight={TEMP_HEIGHT}>
        <TransactionDetailsContent transaction={transaction} />
      </SlackSheet>
    </Container>
  );
};
