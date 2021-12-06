import { useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import { BackButton } from '../header';
import { Centered } from '../layout';
import { TruncatedText } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks/useMagicAuto... Remove this comment to see the full error message
import { delayNext } from '@rainbow-me/hooks/useMagicAutofocus';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders, padding } from '@rainbow-me/styles';

const BackButtonWrapper = styled(Centered)`
  bottom: 0;
  left: 0;
  position: absolute;
  top: 3;
`;

export const CurrencySelectModalHeaderHeight = 59;
const HeaderContainer = styled(Centered)`
  ${borders.buildRadius('top', 12)};
  background-color: ${({ theme: { colors } }) => colors.white};
  height: ${CurrencySelectModalHeaderHeight};
  width: 100%;
`;

const Title = styled(TruncatedText).attrs({
  align: 'center',
  lineHeight: 'loose',
  size: 'large',
  weight: 'heavy',
})`
  ${padding(1, 0, 0)};
  height: 21;
`;

export default function CurrencySelectModalHeader({ testID }: any) {
  const { navigate, dangerouslyGetState } = useNavigation();
  const {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'setPointerEvents' does not exist on type... Remove this comment to see the full error message
    params: { setPointerEvents, title },
  } = useRoute();

  const handlePressBack = useCallback(() => {
    dangerouslyGetState().index = 1;
    setPointerEvents(false);
    delayNext();
    navigate(Routes.MAIN_EXCHANGE_SCREEN);
  }, [dangerouslyGetState, navigate, setPointerEvents]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <HeaderContainer>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BackButtonWrapper>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <BackButton
          direction="left"
          height={CurrencySelectModalHeaderHeight}
          onPress={handlePressBack}
          testID={testID}
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          textChevron={android}
          throttle
        />
      </BackButtonWrapper>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Title>{title}</Title>
    </HeaderContainer>
  );
}
