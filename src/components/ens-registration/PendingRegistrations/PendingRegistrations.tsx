import React, { useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { Alert } from '../../../components/alerts';
import ButtonPressAnimation from '../../../components/animations/ButtonPressAnimation';
import ImageAvatar from '../../../components/contacts/ImageAvatar';
import {
  AccentColorProvider,
  Box,
  Column,
  Columns,
  Divider,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { RegistrationParameters } from '@rainbow-me/entities';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import {
  useENSPendingRegistrations,
  useENSRegistration,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

const PendingRegistration = ({
  registration,
  removeRegistration,
  avatarUrl,
}: {
  avatarUrl?: string;
  registration: RegistrationParameters;
  removeRegistration: (name: string) => void;
}) => {
  const { navigate } = useNavigation();
  const { startRegistration } = useENSRegistration();

  const onFinish = useCallback(
    async (name: string) => {
      startRegistration(name, REGISTRATION_MODES.CREATE);
      setTimeout(() => {
        navigate(Routes.ENS_CONFIRM_REGISTER_SHEET, {});
      }, 100);
    },
    [navigate, startRegistration]
  );

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
            <Text color="primary" numberOfLines={1} size="16px" weight="heavy">
              {registration.name}
            </Text>
          </Box>
        </Column>
        <Column width="content">
          <Box paddingRight="15px">
            <ButtonPressAnimation
              onPress={() => onFinish(registration.name)}
              scaleTo={0.9}
            >
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
                  <AccentColorProvider color={colors.appleBlue}>
                    <Text color="accent" size="16px" weight="heavy">
                      Finish
                    </Text>
                  </AccentColorProvider>
                </Inset>
              </Box>
            </ButtonPressAnimation>
          </Box>
        </Column>
        <Column width="content">
          <ButtonPressAnimation
            onPress={() => onRemove(registration.name)}
            scaleTo={0.9}
          >
            <Text color="secondary50" size="18px" weight="bold">
              􀈒
            </Text>
          </ButtonPressAnimation>
        </Column>
      </Columns>
    </Box>
  );
};

const PendingRegistrations = () => {
  const {
    pendingRegistrations,
    removeRegistrationByName,
    registrationImages,
  } = useENSPendingRegistrations();

  const removeRegistration = useCallback(
    (name: string) => {
      Alert({
        buttons: [
          { style: 'cancel', text: 'Cancel' },
          {
            onPress: () => {
              removeRegistrationByName(name);
            },
            text: 'Proceed Anyway',
          },
        ],
        message: `You are about to stop the registration process.\n  You'd need to start it again which means you'll need to send an additional transaction.`,
        title: 'Are you sure?',
      });
    },
    [removeRegistrationByName]
  );

  return pendingRegistrations?.length ? (
    <>
      <Inset vertical="24px">
        <Divider />
      </Inset>
      <Box paddingHorizontal="19px">
        <Stack space="19px">
          <Text color="secondary50" containsEmoji size="14px" weight="bold">
            {' 􀺉 In progress '}
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
    </>
  ) : null;
};

export default PendingRegistrations;
