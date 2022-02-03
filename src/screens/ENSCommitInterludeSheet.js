import { useNavigation } from '@react-navigation/core';
import React from 'react';
import { Pressable } from 'react-native';
import { Box, Text } from '@rainbow-me/design-system';
import Routes from '@rainbow-me/routes';

export default function ENSCommitInterludeSheet() {
  const { navigate } = useNavigation();

  return (
    <Box background="body" flexGrow={1} paddingVertical="30px">
      <Box alignItems="center" flexGrow={1} justifyContent="center">
        <Pressable
          onPress={() => {
            navigate(Routes.ENS_ASSIGN_RECORDS_SHEET);
          }}
        >
          <Text>wait 60 sec here</Text>
        </Pressable>
      </Box>
    </Box>
  );
}
