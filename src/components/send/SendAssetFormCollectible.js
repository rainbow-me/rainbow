import React from 'react';
import { Platform } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import styled from '@/framework/ui/styled-thing';
import useDimensions from '@/hooks/useDimensions';
import { padding, position } from '@/styles';

import { UniqueTokenExpandedStateContent } from '../expanded-state/unique-token';
import { Column } from '../layout';

const ButtonWrapper = styled(Column).attrs({
  margin: 0,
})({
  ...padding.object(0, 19, 15),
  marginBottom: 21,
  width: '100%',
  ...(Platform.OS === 'ios' ? { zIndex: 3 } : { elevation: 3 }),
});

const Footer = styled(Column).attrs({ justify: 'end' })({
  position: 'relative',
  width: '100%',
});

const StickyFooter = styled(KeyboardStickyView)({
  width: '100%',
  ...(Platform.OS === 'ios' ? { zIndex: 3 } : { elevation: 3 }),
});

const NFTWrapper = styled(Column).attrs({
  align: 'center',
  flex: 1,
  justify: 'center',
})({
  width: '100%',
});

const FooterGradient = styled(LinearGradient).attrs(({ isTallPhone, theme: { colors } }) => ({
  colors: colors.gradients.sendBackground,
  end: { x: 0.5, y: isTallPhone ? 0.2 : 0.4 },
  pointerEvents: 'none',
  start: { x: 0.5, y: 0 },
}))({
  ...position.coverAsObject,
  overflow: 'hidden',
});

export default function SendAssetFormCollectible({ asset, buttonRenderer, txSpeedRenderer, ...props }) {
  const { isTallPhone } = useDimensions();

  return (
    <Column align="end" flex={1} width="100%">
      <NFTWrapper>
        <UniqueTokenExpandedStateContent {...props} asset={asset} borderRadius={20} disablePreview horizontalPadding={24} />
      </NFTWrapper>
      <StickyFooter>
        <Footer>
          {Platform.OS !== 'android' && <FooterGradient isTallPhone={isTallPhone} />}
          <ButtonWrapper>
            {buttonRenderer}
            {txSpeedRenderer}
          </ButtonWrapper>
        </Footer>
      </StickyFooter>
    </Column>
  );
}
