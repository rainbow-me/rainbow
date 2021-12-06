import { useRoute } from '@react-navigation/native';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Centered } from '../components/layout';
import { Sheet } from '../components/sheet';
import { Text } from '../components/text';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../navigation/Navigation' was resolved to ... Remove this comment to see the full error message
import { useNavigation } from '../navigation/Navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAppState } from '@rainbow-me/hooks';

const BodyText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  lineHeight: 'loosest',
  size: 'big',
}))`
  padding-bottom: 23;
  padding-top: 4;
`;

const emojisMap = {
  'connect': '🥳',
  'reject': '👻',
  'sign': '🥳',
  'sign-canceled': '👻',
  'transaction': '🥳',
  'transaction-canceled': '👻',
};

const titlesMap = {
  'connect': "You're connected!",
  'reject': 'Connection canceled',
  'sign': 'Message signed!',
  'sign-canceled': 'Transaction canceled!',
  'transaction': 'Transaction sent!',
  'transaction-canceled': 'Transaction canceled!',
};

const WalletConnectRedirectSheet = () => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  const { appState } = useAppState();
  const { params } = useRoute();

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type 'object'.
  const type = params?.type;

  useEffect(() => {
    if (appState === 'background') {
      goBack();
    }
  }, [goBack, appState]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Sheet hideHandle>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered direction="column" paddingTop={12} testID="wc-redirect-sheet">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text letterSpacing="zero" size="h2">
          // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an
          'any' type because expre... Remove this comment to see the full error
          message
          {emojisMap[type]}
        </Text>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered marginTop={9}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color={colors.dark} size="big" weight="bold">
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has
            an 'any' type because expre... Remove this comment to see the full
            error message
            {titlesMap[type]}
          </Text>
        </Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <BodyText color={colors.dark}>Go back to your browser</BodyText>
      </Centered>
    </Sheet>
  );
};

export default React.memo(WalletConnectRedirectSheet);
