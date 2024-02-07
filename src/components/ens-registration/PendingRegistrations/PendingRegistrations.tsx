import lang from 'i18n-js';
import React, { useCallback, useEffect } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { Alert } from '../../../components/alerts';
import ButtonPressAnimation from '../../../components/animations/ButtonPressAnimation';
import ImageAvatar from '../../../components/contacts/ImageAvatar';
import { abbreviateEnsForDisplay } from '@/utils/abbreviations';
import { Box, Column, Columns, Inset, Separator, Stack, Text } from '@/design-system';
import { RegistrationParameters } from '@/entities';
import { useENSPendingRegistrations } from '@/hooks';
import { colors } from '@/styles';

const PendingRegistration = ({
  registration,
  removeRegistration,
  avatarUrl,
}: {
  avatarUrl?: string;
  registration: RegistrationParameters;
  removeRegistration: (name: string) => void;
}) => {
  const { finishRegistration } = useENSPendingRegistrations();

  const onRemove = useCallback(
    async (name: string) => {
      removeRegistration(name);
    },
    [removeRegistration]
  );

  return (
    <Box>
      <Columns alignVertical="center">
        {avatarUrl && (
          <Column width="content">
            <Box paddingRight="10px">
              <ImageAvatar image={avatarUrl} size="small" />
            </Box>
          </Column>
        )}
        <Column>
          <Box>
            <Text color="primary (Deprecated)" numberOfLines={1} size="16px / 22px (Deprecated)" weight="heavy">
              {abbreviateEnsForDisplay(registration.name, 15)}
            </Text>
          </Box>
        </Column>
        <Column width="content">
          <Box paddingRight="15px (Deprecated)">
            <ButtonPressAnimation onPress={() => finishRegistration(registration.name)} scaleTo={0.9}>
              <Box
                alignItems="center"
                as={LinearGradient}
                borderRadius={16}
                colors={colors.gradients.transparentToAppleBlue}
                end={{ x: 0.6, y: 0 }}
                height="30px"
                justifyContent="center"
                start={{ x: 0, y: 0.6 }}
              >
                <Inset horizontal="10px">
                  <Text color="action (Deprecated)" size="16px / 22px (Deprecated)" weight="heavy">
                    {lang.t('profiles.pending_registrations.finish')}
                  </Text>
                </Inset>
              </Box>
            </ButtonPressAnimation>
          </Box>
        </Column>
        <Column width="content">
          <ButtonPressAnimation onPress={() => onRemove(registration.name)} scaleTo={0.9}>
            <Text color="secondary50 (Deprecated)" size="18px / 27px (Deprecated)" weight="bold">
              􀈒
            </Text>
          </ButtonPressAnimation>
        </Column>
      </Columns>
    </Box>
  );
};

const PendingRegistrations = () => {
  const { pendingRegistrations, removeRegistrationByName, registrationImages, removeExpiredRegistrations } = useENSPendingRegistrations();

  useEffect(removeExpiredRegistrations, [removeExpiredRegistrations]);

  const removeRegistration = useCallback(
    (name: string) => {
      Alert({
        buttons: [
          {
            style: 'cancel',
            text: lang.t('profiles.pending_registrations.alert_cancel'),
          },
          {
            onPress: () => {
              removeRegistrationByName(name);
            },
            text: lang.t('profiles.pending_registrations.alert_confirm'),
          },
        ],
        message: lang.t('profiles.pending_registrations.alert_message'),
        title: lang.t('profiles.pending_registrations.alert_title'),
      });
    },
    [removeRegistrationByName]
  );

  return pendingRegistrations?.length > 0 ? (
    <Box paddingHorizontal="19px (Deprecated)">
      <Inset vertical="24px">
        <Separator color="divider60 (Deprecated)" />
      </Inset>
      <Stack space="19px (Deprecated)">
        <Text color="secondary50 (Deprecated)" size="14px / 19px (Deprecated)" weight="bold">
          {lang.t('profiles.pending_registrations.in_progress')}
        </Text>
        {pendingRegistrations.map(registration => (
          <PendingRegistration
            avatarUrl={registrationImages?.[registration.name]}
            key={registration.name}
            registration={registration}
            removeRegistration={removeRegistration}
          />
        ))}
      </Stack>
    </Box>
  ) : null;
};

export default PendingRegistrations;
