import React from 'react';
import { SlackSheet } from '../components/sheet';

export default function ENSAdditionalRecordsSheet() {
  console.log('hi');
  return (
    <SlackSheet
      additionalTopPadding
      contentHeight={300}
      height="100%"
      scrollEnabled={false}
    ></SlackSheet>
  );
}
