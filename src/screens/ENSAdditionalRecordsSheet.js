import React from 'react';
import { SlackSheet } from '../components/sheet';
import { Text } from '@rainbow-me/design-system';

export const ENSAdditionalRecordsSheetHeight = 600;

export default function ENSAdditionalRecordsSheet() {
  console.log('hi');
  return (
    <SlackSheet
      additionalTopPadding
      contentHeight={100}
      height="100%"
      scrollEnabled={false}
    >
      <Text>hi</Text>
    </SlackSheet>
  );
}
