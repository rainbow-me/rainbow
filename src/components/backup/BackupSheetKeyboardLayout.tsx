import React, { PropsWithChildren } from 'react';
import { KeyboardArea } from 'react-native-keyboard-area';
import { RainbowButton } from '../buttons';
import { Column } from '../layout';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { Box } from '@/design-system';
import { useDimensions } from '@/hooks';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import RainbowButtonTypes from '../buttons/rainbow-button/RainbowButtonTypes';

const Footer = styled(Column)({
  ...padding.object(0, 24, 0),
  flexShrink: 0,
  justifyContent: 'flex-end',
  width: '100%',
  position: 'absolute',
  bottom: 0,
});

const KeyboardSizeView = styled(KeyboardArea)({
  backgroundColor: ({ theme: { colors } }: any) => colors.transparent,
});

type BackupSheetKeyboardLayoutProps = PropsWithChildren<{
  footerButtonDisabled: boolean;
  footerButtonLabel: string;
  onSubmit: () => void;
  type: 'backup' | 'restore';
}>;

type BackupSheetKeyboardLayout = {
  BackupSheetKeyboardLayout: {
    params: {
      nativeButton?: boolean;
    };
  };
};

const MIN_HEIGHT = 740;

export default function BackupSheetKeyboardLayout({
  children,
  footerButtonDisabled,
  footerButtonLabel,
  onSubmit,
}: BackupSheetKeyboardLayoutProps) {
  const { height: deviceHeight } = useDimensions();

  const isSmallPhone = deviceHeight < MIN_HEIGHT;
  const contentHeight = deviceHeight - (!isSmallPhone ? sharedCoolModalTopOffset : 0) - 100;

  return (
    <Box height={{ custom: contentHeight }}>
      {children}
      <Footer>
        <RainbowButton disabled={footerButtonDisabled} label={footerButtonLabel} type={RainbowButtonTypes.backup} onPress={onSubmit} />
      </Footer>
      {android ? <KeyboardSizeView /> : null}
    </Box>
  );
}
