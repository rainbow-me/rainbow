import React from 'react';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import { position } from '../../styles';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';

const CrossHairAspectRatio = 259 / 375;

const Container = styled(Centered)`
  ${({ size }) => position.size(size)};
  margin-bottom: 1;
  z-index: 1;
`;

export default function QRCodeScannerCrosshair({
  showText,
  text = 'Find a code to scan',
}) {
  const { width: deviceWidth } = useDimensions();
  return (
    <Container size={deviceWidth * CrossHairAspectRatio}>
      <Icon css={position.cover} name="crosshair" />
      {showText && (
        <Text color="white" lineHeight="none" size="large" weight="bold">
          {text}
        </Text>
      )}
    </Container>
  );
}
