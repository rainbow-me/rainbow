import React, { useMemo } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { FallbackIcon } from 'react-coin-icon';
import styled from 'styled-components';
import { initials } from '../../utils';
import { Emoji } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const shadowsFactory = (colors: any) => [[0, 3, 9, colors.shadow, 0.1]];

const TrophyEmoji = styled(Emoji).attrs({
  align: 'center',
  name: 'trophy',
  size: 'medium',
})`
  height: 22;
  margin-right: 4.5;
  text-align-vertical: center;
`;

const TokenFamilyHeaderIcon = ({
  familyImage,
  familyName,
  isCoinRow,
  style,
}: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const circleStyle = useMemo(
    () => borders.buildCircleAsObject(isCoinRow ? 40 : 32),
    [isCoinRow]
  );

  const shadows = useMemo(() => shadowsFactory(colors), [colors]);

  return familyName === 'Showcase' ? (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TrophyEmoji />
  ) : (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ShadowStack
      {...circleStyle}
      backgroundColor={colors.white}
      shadows={shadows}
      style={style}
    >
      {familyImage ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ImgixImage source={{ uri: familyImage }} style={circleStyle} />
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <FallbackIcon {...circleStyle} symbol={initials(familyName)} />
      )}
    </ShadowStack>
  );
};

export default React.memo(TokenFamilyHeaderIcon);
