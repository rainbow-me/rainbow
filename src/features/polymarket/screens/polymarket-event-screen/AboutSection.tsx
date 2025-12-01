import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { Box, Text, TextIcon, TextShadow } from '@/design-system';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { formatDate } from '@/utils/formatDate';
import { memo } from 'react';
import { View } from 'react-native';

export const AboutSection = memo(function AboutSection() {
  const event = usePolymarketEventStore(state => state.getData());

  if (!event) return null;

  return (
    <Box>
      <Box flexDirection="row" alignItems="center" gap={10}>
        <Box style={{ opacity: 0.4 }}>
          <TextIcon size="icon 17px" weight="bold" color="label">
            {'􀅴'}
          </TextIcon>
        </Box>
        <Text size="20pt" weight="heavy" color="label">
          {'About'}
        </Text>
      </Box>
      <Box gap={12}>
        <InfoRow title="Market Type" value={'winner take all'} icon="􀏴" highlighted={true} />
        <InfoRow title="End Date" value={formatDate(event.endDate, 'days')} icon="􀏴" highlighted={false} />
      </Box>
    </Box>
  );
});

function InfoRow({ title, value, icon, highlighted }: { title: string; value: string; icon: string; highlighted: boolean }) {
  return (
    <Box backgroundColor={highlighted ? opacityWorklet('#FFFFFF', 0.08) : 'transparent'}>
      <Box width="full">
        <View style={{ width: '100%', flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <TextIcon color="labelSecondary" containerSize={20} size="icon 15px" weight="medium">
            {icon}
          </TextIcon>
          <Text style={{ flex: 1 }} numberOfLines={1} ellipsizeMode="tail" color="labelSecondary" weight="medium" size="17pt">
            {title}
          </Text>
          <TextShadow blur={12} shadowOpacity={0.24}>
            <Text align="right" color="label" weight="semibold" size="17pt">
              {value}
            </Text>
          </TextShadow>
        </View>
      </Box>
    </Box>
  );
}
