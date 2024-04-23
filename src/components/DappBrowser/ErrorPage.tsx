import * as lang from '@/languages';
import React from 'react';
import { Centered } from '../layout';
import { Text } from '../text';
import styled from '@/styled-thing';
import { Colors } from '../../styles/colors';
import { Box } from '@/design-system';
import { useTheme } from '@/theme';
import { View } from 'moti';

const BodyText = styled(Text).attrs(({ theme: { colors } }: { theme: { colors: Colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  lineHeight: 'loosest',
  size: 'medium',
}))({
  paddingBottom: 23,
  paddingTop: 4,
});

export const ErrorPage = () => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        position: 'absolute',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: 20,
        backgroundColor: colors.white,
      }}
    >
      <Box alignItems="center" padding="20px">
        <Text letterSpacing="zero" size="h2">
          {`🫠`}
        </Text>
        <Centered marginTop={9}>
          <Text color={colors.dark} size="big" weight="bold">
            {lang.t(lang.l.dapp_browser.error.title)}
          </Text>
        </Centered>
        <Box padding={'12px'}>
          <BodyText color={colors.dark}>{lang.t(lang.l.dapp_browser.error.default_msg)}</BodyText>
        </Box>
      </Box>
    </View>
  );
};
