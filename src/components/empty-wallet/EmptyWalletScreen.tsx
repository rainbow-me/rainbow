import {
  Box,
  Column,
  Columns,
  DebugLayout,
  Inset,
  Row,
  Rows,
} from '@/design-system';
import React from 'react';
import LearnCard from '../cards/LearnCard';

const EmptyWalletScreen = () => {
  return (
    <Inset horizontal="20px">
      <Rows>
        <Row height="content">
          <Box width="full" height={{ custom: 200 }} />
        </Row>
        <Row height="content">
          <Columns space="20px">
            <Column>
              <LearnCard />
            </Column>
            <Column>
              <LearnCard />
            </Column>
          </Columns>
        </Row>
      </Rows>
    </Inset>
  );
};

export default EmptyWalletScreen;
