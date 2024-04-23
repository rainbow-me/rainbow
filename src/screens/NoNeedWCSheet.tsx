import * as lang from '@/languages';
import React, { useCallback } from 'react';
import { Centered } from '../components/layout';
import { Sheet, SheetActionButton } from '../components/sheet';
import { Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';
import { Colors } from '../styles/colors';
import { Box } from '@/design-system';
import { useRoute } from '@react-navigation/native';

const BodyText = styled(Text).attrs(({ theme: { colors } }: { theme: { colors: Colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  lineHeight: 'loosest',
  size: 'medium',
}))({
  paddingBottom: 23,
  paddingTop: 4,
});

const WalletConnectRedirectSheet = () => {
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  const { params } = useRoute();

  const handleOnPress = useCallback(() => {
    (params as { cb?: () => void })?.cb?.();
    goBack();
  }, [goBack, params]);

  return (
    <Sheet hideHandle>
      <Centered direction="column" paddingTop={12} testID="wc-redirect-sheet">
        <Text letterSpacing="zero" size="h2">
          {`😮`}
        </Text>
        <Centered marginTop={9}>
          <Text color={colors.dark} size="big" weight="bold">
            {lang.t(lang.l.dapp_browser.no_wc_needed.title)}
          </Text>
        </Centered>
        <Box padding={'12px'}>
          <BodyText color={colors.dark}>{lang.t(lang.l.dapp_browser.no_wc_needed.description)}</BodyText>
          <Box>
            <SheetActionButton
              label={lang.t(lang.l.dapp_browser.no_wc_needed.cta)}
              newShadows
              onPress={handleOnPress}
              size="big"
              weight="heavy"
            />
          </Box>
        </Box>
      </Centered>
    </Sheet>
  );
};

export default React.memo(WalletConnectRedirectSheet);
