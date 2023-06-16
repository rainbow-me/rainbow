import React, { useCallback } from 'react';
import { Box, BoxProps } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { useNavigation } from '@/navigation';
import { usePositions } from '@/resources/defi/PositionsQuery';
import { PositionCard } from '@/components/positions/PositionsCard';

export default function WrappedPosition({
  uniqueId,
  placement,
}: {
  uniqueId: string;
  placement: 'left' | 'right';
}) {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { data, isLoading: queryIsLoading, isLoadingError } = usePositions({
    address: accountAddress,
    currency: nativeCurrency,
  });

  const position = data?.find(position => position.type === uniqueId);

  const { navigate } = useNavigation();

  const handleItemPress = useCallback(
    position => console.log('navigating for ', position.type),
    []
  );

  const placementProps: BoxProps =
    placement === 'left'
      ? {
          alignItems: 'flex-start',
          paddingLeft: '19px (Deprecated)',
          paddingRight: '10px',
        }
      : {
          alignItems: 'flex-end',
          paddingRight: '19px (Deprecated)',
          paddingLeft: '10px',
        };

  if (!position) return null;
  return (
    <Box
      flexGrow={1}
      justifyContent="center"
      testID={`wrapped-position-${position.type}`}
      {...placementProps}
    >
      <PositionCard position={position} onPress={handleItemPress} />
    </Box>
  );
}
