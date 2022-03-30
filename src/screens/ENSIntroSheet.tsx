import React, { useCallback } from 'react';
import ActivityIndicator from '../components/ActivityIndicator';
import Button from '../components/buttons/Button';
import { useNavigation } from '../navigation/Navigation';
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
  useColorMode,
} from '@rainbow-me/design-system';
import { useAccountENSDomains } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

export default function ENSIntroSheet() {
  const { colors } = useTheme();
  const { colorMode } = useColorMode();

  const topPadding = android ? 29 : 19;

  const { data: domains, isLoading, isSuccess } = useAccountENSDomains();

  const { navigate } = useNavigation();
  const handleNavigateToSearch = useCallback(() => {
    navigate(Routes.ENS_SEARCH_SHEET);
  }, [navigate]);

  const handleSelectExistingName = useCallback(() => {
    navigate(Routes.SELECT_ENS_SHEET);
  }, [navigate]);

  return (
    <Box
      background="body"
      flexGrow={1}
      paddingTop={{ custom: topPadding }}
      testID="ens-search-sheet"
    >
      <ColorModeProvider
        value={colorMode === 'light' ? 'lightTinted' : 'darkTinted'}
      >
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
                            <Text weight="bold">
                              A portable digital identity
                            </Text>
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
                              owned by you.
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
                  {isLoading && (
                    <Box alignItems="center" paddingBottom="15px">
                      <ActivityIndicator />
                    </Box>
                  )}
                  {isSuccess && (
                    <>
                      {domains?.length === 0 ? (
                        <Button
                          backgroundColor={colors.appleBlue}
                          onPress={handleNavigateToSearch}
                          textProps={{ weight: 'heavy' }}
                        >
                          􀠎 Find your name
                        </Button>
                      ) : (
                        <Stack space="15px">
                          {domains?.length === 1 ? (
                            <Button
                              backgroundColor={colors.appleBlue}
                              onPress={handleSelectExistingName}
                              textProps={{ weight: 'heavy' }}
                            >
                              Use {domains[0].name}
                            </Button>
                          ) : (
                            <Button
                              backgroundColor={colors.appleBlue}
                              onPress={handleSelectExistingName}
                              textProps={{ weight: 'heavy' }}
                            >
                              Use an existing ENS name
                            </Button>
                          )}
                          <Button
                            backgroundColor={colors.transparent}
                            color={colors.appleBlue}
                            onPress={handleNavigateToSearch}
                            textProps={{ size: 'lmedium', weight: 'heavy' }}
                          >
                            Search for a new ENS name
                          </Button>
                        </Stack>
                      )}
                    </>
                  )}
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
