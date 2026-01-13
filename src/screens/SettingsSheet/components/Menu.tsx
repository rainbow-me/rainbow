import React from 'react';
import { Box } from '@/design-system/components/Box/Box';
import { Separator } from '@/design-system/components/Separator/Separator';
import { Stack } from '@/design-system/components/Stack/Stack';
import { Text } from '@/design-system/components/Text/Text';

type DescriptionContent = string | React.ReactNode;
type DescriptionPosition = 'leading' | 'trailing';

interface MenuProps {
  children: React.ReactNode;
  header?: string;
  description?: DescriptionContent;
  descriptionPosition?: DescriptionPosition;
  testId?: string;
}

const Menu = ({ children, description, descriptionPosition = 'trailing', header, testId }: MenuProps) => {
  return (
    <Stack space="8px">
      {header ? (
        <Box paddingBottom="12px" paddingHorizontal={{ custom: 16 }} testID={testId}>
          <Text color="secondary60 (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
            {header}
          </Text>
        </Box>
      ) : null}
      {description && descriptionPosition === 'leading' ? <Description content={description} position="leading" /> : null}
      <Box>
        <Box background="card (Deprecated)" borderRadius={18} shadow="12px" width="full">
          <Stack separator={<Separator color="divider60 (Deprecated)" />}>{children}</Stack>
        </Box>
        {description && descriptionPosition !== 'leading' ? <Description content={description} position="trailing" /> : null}
      </Box>
    </Stack>
  );
};

const Description = ({ content, position }: { content: DescriptionContent; position: DescriptionPosition }) => (
  <Box
    paddingHorizontal={{ custom: 16 }}
    paddingTop={position === 'trailing' ? { custom: 17 } : undefined}
    paddingBottom={position === 'leading' ? '12px' : undefined}
  >
    {typeof content === 'string' ? (
      <Text color="secondary60 (Deprecated)" size="14px / 19px (Deprecated)" weight="regular">
        {content}
      </Text>
    ) : (
      content
    )}
  </Box>
);

export default Menu;
