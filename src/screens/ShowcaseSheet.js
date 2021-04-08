import React from 'react';
import { SlackSheet } from '../components/sheet';

// eslint-disable-next-line no-unused-vars
const someRandomAdress = '0x11e4857bb9993a50c685a79afad4e6f65d518dda';

export default function ShowcaseScreen() {
  return <SlackSheet {...(ios && { height: '100%' })} />;
}
