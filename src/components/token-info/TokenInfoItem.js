import ConditionalWrap from 'conditional-wrap';
import React from 'react';
import { View } from 'react-native';
import { ButtonPressAnimation, ShimmerAnimation } from '../animations';
import { ColumnWithMargins, RowWithMargins } from '../layout';
import TokenInfoBalanceValue from './TokenInfoBalanceValue';
import TokenInfoHeading from './TokenInfoHeading';
import TokenInfoValue from './TokenInfoValue';
import { Column, Columns } from '@/design-system';
import { useDelayedValueWithLayoutAnimation } from '@/hooks';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';

const VerticalDivider = styled.View({
  backgroundColor: ({ theme: { colors } }) => colors.rowDividerExtraLight,
  borderRadius: 1,
  height: 40,
  marginTop: 2,
  width: 2,
});

const WrapperView = styled.View({
  alignSelf: ({ align }) => (align === 'left' ? 'flex-start' : 'flex-end'),
  borderRadius: 12,
  height: 24,
  marginTop: ({ isENS, isNft }) => (isNft && !isENS ? -10 : -14),
  overflow: 'hidden',
  paddingTop: 12,
  width: 50,
});

export default function TokenInfoItem({
  align = 'left',
  asset,
  color,
  children,
  enableHapticFeedback = true,
  isENS,
  isNft,
  onInfoPress,
  onPress,
  showDivider,
  addonComponent,
  showInfoButton,
  size,
  title,
  weight,
  lineHeight,
  loading: rawLoading,
  ...props
}) {
  const { colors } = useTheme();

  const loading = useDelayedValueWithLayoutAnimation(rawLoading);

  const hidden = useDelayedValueWithLayoutAnimation(!loading && !children);

  if (hidden) {
    return null;
  }

  const Container = showDivider ? RowWithMargins : View;

  return (
    <Container margin={showDivider ? 12 : 0}>
      <ColumnWithMargins
        flex={asset ? 1 : 0}
        justify={align === 'left' ? 'start' : 'end'}
        margin={android ? (isNft ? -3 : -6) : isNft ? 6 : 3}
        {...props}
      >
        <ButtonPressAnimation disabled={!showInfoButton} onPress={showInfoButton && onInfoPress} scaleTo={0.88}>
          <TokenInfoHeading align={align} isNft={isNft}>
            {title}
            {showInfoButton ? (
              <TokenInfoHeading color={colors.alpha(colors.whiteLabel, 0.25)} isNft>
                {' '}
                􀅵
              </TokenInfoHeading>
            ) : null}
          </TokenInfoHeading>
        </ButtonPressAnimation>
        {asset ? (
          <TokenInfoBalanceValue align={align} asset={asset} isNft={isNft} />
        ) : (
          <ConditionalWrap
            condition={addonComponent && !loading}
            wrap={children => (
              <Columns alignHorizontal="left" alignVertical="center">
                <Column alignHorizontal="left">{children}</Column>
                {addonComponent}
              </Columns>
            )}
          >
            <ButtonPressAnimation enableHapticFeedback={!!onPress && enableHapticFeedback} onPress={onPress} scaleTo={1}>
              <TokenInfoValue
                activeOpacity={0}
                align={align}
                color={color}
                isNft={isNft}
                lineHeight={lineHeight}
                size={size}
                weight={weight}
              >
                {!loading && children}
              </TokenInfoValue>
            </ButtonPressAnimation>
          </ConditionalWrap>
        )}
        {loading && (
          <WrapperView
            align={align}
            backgroundColor={isNft ? colors.alpha(colors.whiteLabel, 0.04) : colors.alpha(colors.blueGreyDark, 0.04)}
            isENS={isENS}
            isNft={isNft}
          >
            <ShimmerAnimation
              color={isNft ? colors.alpha(colors.whiteLabel, 0.04) : colors.alpha(colors.blueGreyDark, 0.06)}
              enabled
              gradientColor={isNft ? colors.alpha(colors.whiteLabel, 0.04) : colors.alpha(colors.blueGreyDark, 0.06)}
              width={50}
            />
          </WrapperView>
        )}
      </ColumnWithMargins>
      {showDivider && <VerticalDivider />}
    </Container>
  );
}
