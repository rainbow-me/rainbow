import MaskedView from '@react-native-masked-view/masked-view';
import { useRoute } from '@react-navigation/core';
import lang from 'i18n-js';
import React, { useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import ActivityIndicator from '../components/ActivityIndicator';
import Button from '../components/buttons/Button';
import IntroMarquee from '../components/ens-registration/IntroMarquee/IntroMarquee';
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
  Inset,
  Row,
  Rows,
  Stack,
  Text,
  useColorMode,
} from '@rainbow-me/design-system';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import { useAccountENSDomains, useENSRegistration } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

export default function ENSIntroSheet() {
  const { colors } = useTheme();

  const { colorMode } = useColorMode();

  const { params } = useRoute<any>();

  const topPadding = android ? 29 : 19;

  const { data: domains, isLoading, isSuccess } = useAccountENSDomains();

  const { navigate } = useNavigation();
  const handleNavigateToSearch = useCallback(() => {
    navigate(Routes.ENS_SEARCH_SHEET);
  }, [navigate]);

  const { startRegistration } = useENSRegistration();

  const handleSelectExistingName = useCallback(() => {
    const navigateToAssignRecords = (ensName: string) => {
      params?.onSelectExistingName?.();
      startRegistration(ensName, REGISTRATION_MODES.EDIT);
      setTimeout(() => {
        navigate(Routes.ENS_ASSIGN_RECORDS_SHEET);
      }, 0);
    };

    if (domains?.length === 1) {
      navigateToAssignRecords(domains[0].name);
    } else {
      navigate(Routes.SELECT_ENS_SHEET, {
        onSelectENS: (ensName: string) => {
          navigateToAssignRecords(ensName);
        },
      });
    }
  }, [domains, navigate, params, startRegistration]);

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
                    <Heading size="34px">
                      {lang.t('profiles.intro.create_your')}
                    </Heading>
                    <Heading color="action" size="34px">
                      {lang.t('profiles.intro.ens_profile')}
                    </Heading>
                  </Stack>
                  <Bleed left="10px">
                    <IntroMarquee />
                  </Bleed>
                  <Divider />
                  <Inset horizontal="34px">
                    <Stack space="42px">
                      <InfoRow
                        description={lang.t(
                          'profiles.intro.wallet_address_info.description'
                        )}
                        icon="􀈠"
                        title={lang.t(
                          'profiles.intro.wallet_address_info.title'
                        )}
                      />
                      <InfoRow
                        description={lang.t(
                          'profiles.intro.portable_identity_info.description'
                        )}
                        icon="􀪽"
                        title={lang.t(
                          'profiles.intro.portable_identity_info.title'
                        )}
                      />
                      <InfoRow
                        description={lang.t(
                          'profiles.intro.stored_on_blockchain_info.description'
                        )}
                        icon="􀐙"
                        title={lang.t(
                          'profiles.intro.stored_on_blockchain_info.title'
                        )}
                      />
                    </Stack>
                  </Inset>
                </Stack>
              </Row>
              <Row height="content">
                <Inset space="24px">
                  {isLoading && (
                    <Box alignItems="center" paddingBottom="15px">
                      {/* @ts-expect-error JavaScript component */}
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
                          􀠎 {lang.t('profiles.intro.find_your_name')}
                        </Button>
                      ) : (
                        <Stack space="15px">
                          {domains?.length === 1 ? (
                            <Button
                              backgroundColor={colors.appleBlue}
                              onPress={handleSelectExistingName}
                              textProps={{ weight: 'heavy' }}
                            >
                              {lang.t('profiles.intro.use_name', {
                                name: domains[0].name,
                              })}
                            </Button>
                          ) : (
                            <Button
                              backgroundColor={colors.appleBlue}
                              onPress={handleSelectExistingName}
                              textProps={{ weight: 'heavy' }}
                            >
                              {lang.t('profiles.intro.use_existing_name')}
                            </Button>
                          )}
                          <Button
                            backgroundColor={colors.transparent}
                            borderColor={colors.transparent}
                            color={colors.appleBlue}
                            onPress={handleNavigateToSearch}
                            textProps={{ size: 'lmedium', weight: 'heavy' }}
                          >
                            {lang.t('profiles.intro.search_new_name')}
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

function InfoRow({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  const { colors } = useTheme();

  return (
    <Columns space="10px">
      <Column width="1/5">
        <MaskedView
          maskElement={
            <Box
              {...(android && {
                paddingTop: '6px',
              })}
            >
              <Heading align="center" color="action" size="30px">
                {icon}
              </Heading>
            </Box>
          }
        >
          <Box
            as={LinearGradient}
            colors={colors.gradients.appleBlueTintToAppleBlue}
            end={{ x: 0.5, y: 1 }}
            height={{ custom: android ? 50 : 40 }}
            marginTop="-10px"
            start={{ x: 0, y: 0 }}
            width="full"
          />
        </MaskedView>
      </Column>
      <Bleed top="4px">
        <Stack space="12px">
          <Text weight="bold">{title}</Text>
          <Text color="secondary60" size="14px" weight="medium">
            {description}
          </Text>
        </Stack>
      </Bleed>
    </Columns>
  );
}
