import React, { PropsWithChildren } from 'react';
import { KeyboardArea } from 'react-native-keyboard-area';
import { RainbowButton } from '../buttons';
import { Column } from '../layout';
import styled from '@/styled-thing';
import { colors, padding } from '@/styles';
import { Box, useForegroundColor } from '@/design-system';
import { SheetActionButton } from '../sheet';
import { useDimensions } from '@/hooks';
import { sharedCoolModalTopOffset } from '@/navigation/config';

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

// <Box
//   position="absolute"
//   bottom={{ custom: IS_ANDROID ? 0 : 20 }}
//   alignItems="center"
//   style={{ paddingHorizontal: 24 }}
// >
//   <RainbowButton
//     height={46}
//     disabled={!validPassword}
//     type="backup"
//     label={`􀎽 ${lang.t(lang.l.back_up.cloud.back_up_to_platform, {
//       cloudPlatformName: cloudPlatform,
//     })}`}
//     onPress={showExplainerConfirmation}
//   />
//   {IS_ANDROID ? <KeyboardSizeView /> : null}
// </Box>

export default function BackupSheetKeyboardLayout({
  children,
  footerButtonDisabled,
  footerButtonLabel,
  onSubmit,
}: BackupSheetKeyboardLayoutProps) {
  const { height: deviceHeight } = useDimensions();

  const isSmallPhone = deviceHeight < MIN_HEIGHT;
  const contentHeight =
    deviceHeight - (!isSmallPhone ? sharedCoolModalTopOffset : 0) - 100;

  console.log(contentHeight);

  return (
    <Box height={{ custom: contentHeight }}>
      {children}
      <Footer>
        <RainbowButton
          disabled={footerButtonDisabled}
          label={footerButtonLabel}
          type="backup"
          onPress={onSubmit}
        />
      </Footer>
      {android ? <KeyboardSizeView /> : null}
    </Box>
  );
}
