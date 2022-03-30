import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import ImageAvatar from '../../../components/contacts/ImageAvatar';
import {
  AccentColorProvider,
  Box,
  Column,
  Columns,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { RegistrationParameters } from '@rainbow-me/entities';
import { useENSPendingRegistrations } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';

const PendingRegistration = ({
  registration,
}: {
  registration: RegistrationParameters;
}) => {
  return (
    <Box>
      <Columns alignVertical="center">
        {registration.changedRecords?.avatar && (
          <Column width="content">
            <Box paddingRight="10px">
              <ImageAvatar
                image={registration.changedRecords?.avatar}
                size="small"
              />
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
          </Box>
        </Column>
        <Column width="content">
          <Text color="secondary50" size="18px" weight="bold">
            􀈒
          </Text>
        </Column>
      </Columns>
    </Box>
  );
};

const PendingRegistrations = () => {
  const { pendingRegistrations } = useENSPendingRegistrations();

  return (
    <Box paddingHorizontal="19px">
      <Stack space="19px">
        <Text color="secondary50" size="14px" weight="bold">
          􀺉 In progress
        </Text>
        {pendingRegistrations.map(registration => (
          <PendingRegistration
            key={registration.name}
            registration={registration}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default PendingRegistrations;
