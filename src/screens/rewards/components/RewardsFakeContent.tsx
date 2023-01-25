import React from 'react';
import Skeleton from '@/components/skeleton/Skeleton';
import { Box, BoxProps, useForegroundColor } from '@/design-system';
import { useDimensions } from '@/hooks';

const BORDER_RADIUS = 18;

// Values based off Figma layout
const SHEET_TITLE_HEIGHT = 21;
const SHEET_TITLE_BOTTOM_MARGIN = 24;
const TOTAL_EARNINGS_HEIGHT = 142;
const TOTAL_EARNINGS_BOTTOM_MARGIN = 12;
const PENDING_EARNINGS_HEIGHT = 77;
const PENDING_EARNINGS_BOTTOM_MARGIN = 36;
const MY_STATS_TITLE_HEIGHT = 14;
const MY_STATS_TITLE_BOTTOM_MARGIN = 16;
const MY_STATS_HEIGHT = 98;
const MY_STATS_BOTTOM_MARGIN = 36;
const LEADERBOARD_TITLE_HEIGHT = 14;
const LEADERBOARD_TITLE_BOTTOM_MARGIN = 16;
const LEADERBOARD_HEIGHT = 455;

const FakeElement: React.FC<BoxProps> = props => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <Box {...props} background="accent" borderRadius={BORDER_RADIUS} />
);

export const RewardsFakeContent: React.FC = () => {
  const shimmerColor = useForegroundColor('fillSecondary');
  const { height } = useDimensions();

  return (
    <Box width="full" height={height}>
      <Skeleton shimmerColor={shimmerColor} skeletonColor={shimmerColor}>
        <>
          <FakeElement
            width="4/5"
            height={SHEET_TITLE_HEIGHT}
            marginBottom={SHEET_TITLE_BOTTOM_MARGIN}
          />
          <FakeElement
            width="full"
            height={TOTAL_EARNINGS_HEIGHT}
            marginBottom={TOTAL_EARNINGS_BOTTOM_MARGIN}
          />
          <FakeElement
            width="full"
            height={PENDING_EARNINGS_HEIGHT}
            marginBottom={PENDING_EARNINGS_BOTTOM_MARGIN}
          />
          <FakeElement
            width="1/5"
            height={MY_STATS_TITLE_HEIGHT}
            marginBottom={MY_STATS_TITLE_BOTTOM_MARGIN}
          />
          <FakeElement
            width="full"
            height={MY_STATS_HEIGHT}
            marginBottom={MY_STATS_BOTTOM_MARGIN}
          />
          <FakeElement
            width="2/5"
            height={LEADERBOARD_TITLE_HEIGHT}
            marginBottom={LEADERBOARD_TITLE_BOTTOM_MARGIN}
          />
          <FakeElement width="full" height={LEADERBOARD_HEIGHT} />
        </>
      </Skeleton>
    </Box>
  );
};
