import React from 'react';
import Button from '../components/buttons/Button';
import { useTheme } from '@rainbow-me/context';
import {
  Bleed,
  Box,
  ColorModeProvider,
  Column,
  Columns,
  Divider,
  Heading,
  Inline,
  Inset,
  Row,
  Rows,
  Stack,
  Text,
} from '@rainbow-me/design-system';

export default function ENSIntroSheet() {
  const topPadding = android ? 29 : 19;
  const { colors } = useTheme();

  return (
    <Box
      background="body"
      flexGrow={1}
      paddingTop={{ custom: topPadding }}
      testID="ens-search-sheet"
    >
      <ColorModeProvider value="lightTinted">
        <Inset top="34px">
          <Box height="full">
            <Rows>
              <Row>
                <Stack space="42px">
                  <Stack alignHorizontal="center" space="15px">
                    <Heading size="34px">Create Your</Heading>
                    <Heading color="action" size="34px">
                      ENS Profile
                    </Heading>
                  </Stack>
                  <Bleed left="10px">
                    <Inline space="30px" wrap={false}>
                      <ENSAvatarPlaceholder name="creature.eth" />
                      <ENSAvatarPlaceholder name="flipcityreg.eth" />
                      <ENSAvatarPlaceholder name="elsa.eth" />
                      <ENSAvatarPlaceholder name="friends.eth" />
                    </Inline>
                  </Bleed>
                  <Divider />
                  <Inset horizontal="34px">
                    <Stack space="42px">
                      <Columns space="10px">
                        <Column width="1/5">
                          <Heading align="center" color="action" size="30px">
                            􀈠
                          </Heading>
                        </Column>
                        <Bleed top="4px">
                          <Stack space="12px">
                            <Text weight="bold">A better wallet address</Text>
                            <Text
                              color="secondary60"
                              size="14px"
                              weight="medium"
                            >
                              Send to ENS names instead of hard-to-remember
                              wallet addresses.
                            </Text>
                          </Stack>
                        </Bleed>
                      </Columns>
                      <Columns space="10px">
                        <Column width="1/5">
                          <Heading align="center" color="action" size="30px">
                            􀪽
                          </Heading>
                        </Column>
                        <Bleed top="4px">
                          <Stack space="12px">
                            <Text weight="bold">A portable username</Text>
                            <Text
                              color="secondary60"
                              size="14px"
                              weight="medium"
                            >
                              Carry your ENS name and profile between websites.
                              No more signups.
                            </Text>
                          </Stack>
                        </Bleed>
                      </Columns>
                      <Columns space="10px">
                        <Column width="1/5">
                          <Heading align="center" color="action" size="30px">
                            􀐙
                          </Heading>
                        </Column>
                        <Bleed top="4px">
                          <Stack space="12px">
                            <Text weight="bold">Stored on the blockchain</Text>
                            <Text
                              color="secondary60"
                              size="14px"
                              weight="medium"
                            >
                              Your name and profile are stored on Ethereum and
                              owned entirely by you.
                            </Text>
                          </Stack>
                        </Bleed>
                      </Columns>
                    </Stack>
                  </Inset>
                </Stack>
              </Row>
              <Row height="content">
                <Inset space="24px">
                  <Button
                    backgroundColor={colors.appleBlue}
                    textProps={{ weight: 'heavy' }}
                  >
                    􀠎 Find your name
                  </Button>
                </Inset>
              </Row>
            </Rows>
          </Box>
        </Inset>
      </ColorModeProvider>
    </Box>
  );
}

function ENSAvatarPlaceholder({ name }) {
  return (
    <Stack alignHorizontal="center" space="15px">
      <Box
        background="action"
        borderRadius={80}
        height={{ custom: 80 }}
        shadow="21px light"
        width={{ custom: 80 }}
      />
      <Text align="center" color="secondary70" size="14px" weight="medium">
        {name}
      </Text>
    </Stack>
  );
}
