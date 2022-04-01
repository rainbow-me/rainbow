import lang from 'i18n-js';
import React from 'react';
import { Switch } from 'react-native-gesture-handler';
import { Box, Column, Columns, Inset, Text } from '@rainbow-me/design-system';
import { colors } from '@rainbow-me/styles';

const RegisterContent = ({
  accentColor,
  sendReverseRecord,
  setSendReverseRecord,
}: {
  accentColor: any;
  sendReverseRecord: boolean;
  setSendReverseRecord: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <Inset horizontal="30px">
      <Columns>
        <Column width="2/3">
          <Text color="secondary80" size="16px" weight="bold">
            {lang.t('profiles.confirm.set_ens_name')} 􀅵
          </Text>
        </Column>
        <Column width="1/3">
          <Box alignItems="flex-end">
            <Switch
              onValueChange={() =>
                setSendReverseRecord(sendReverseRecord => !sendReverseRecord)
              }
              testID="ens-reverse-record-switch"
              trackColor={{ false: colors.white, true: accentColor }}
              value={sendReverseRecord}
            />
          </Box>
        </Column>
      </Columns>
    </Inset>
  );
};

export default RegisterContent;
