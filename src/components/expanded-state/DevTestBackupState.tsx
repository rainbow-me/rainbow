import CopyTooltip from '@/components/copy-tooltip';
import { Box, Text } from '@/design-system';
import { createBackup, restoreBackup } from '@/model/backup';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

export const DevTestBackupState = () => {
  const [exported, setExported] = useState('test123');

  useEffect(() => {
    createBackup({
      onError(err) {
        console.log(`Error creating backup: ${err}`);
      },
    }).then(backup => {
      setExported(JSON.stringify(backup));
    });
  }, []);

  return (
    <>
      <Box
        background="card (Deprecated)"
        borderRadius={25}
        height={{ custom: 50 }}
        paddingHorizontal="24px"
        paddingVertical="19px (Deprecated)"
        shadow="21px light (Deprecated)"
      >
        <CopyTooltip textToCopy={exported} tooltipText="Copy">
          <Text color="base" size="15pt">
            Copy Backup!
          </Text>
        </CopyTooltip>
      </Box>

      <View style={{ height: 20 }} />

      <Pressable
        onPress={async () => {
          const backup = await Clipboard.getString();
          restoreBackup(backup);
        }}
      >
        <Box
          background="card (Deprecated)"
          borderRadius={25}
          height={{ custom: 50 }}
          paddingHorizontal="24px"
          paddingVertical="19px (Deprecated)"
          shadow="21px light (Deprecated)"
        >
          <Text color="base" size="15pt">
            Paste Backup!
          </Text>
        </Box>
      </Pressable>
    </>
  );
};
