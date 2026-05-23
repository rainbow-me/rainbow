import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text, TextIcon } from '@/design-system';

export function CarouselHeader({ onPress, showCaret = !!onPress, title }: { showCaret?: boolean; title: string; onPress?: () => void }) {
  return (
    <Box paddingLeft={{ custom: 24 }}>
      <ButtonPressAnimation onPress={onPress} scaleTo={0.9} style={{ alignSelf: 'flex-start' }} disabled={!onPress}>
        <Box flexDirection="row" alignItems="center" gap={4}>
          <Text size="22pt" weight="heavy" color="label">
            {title}
          </Text>
          {showCaret && onPress && (
            <TextIcon size="icon 15px" weight="heavy" color="labelQuaternary">
              {'􀯻'}
            </TextIcon>
          )}
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
}
