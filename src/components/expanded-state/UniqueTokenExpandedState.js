import React, { Fragment, useCallback, useMemo } from 'react';
import { EXPERIMENTAL_AUDIO_PLAYER } from 'react-native-dotenv';
import Link from '../Link';
import { Column, ColumnWithDividers } from '../layout';
import {
  SendActionButton,
  SheetActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
} from '../sheet';
import { Text } from '../text';
import { ShowcaseToast, ToastPositionContainer } from '../toasts';
import { UniqueTokenAttributes } from '../unique-token';
import ExpandedStateSection from './ExpandedStateSection';
import {
  UniqueTokenExpandedStateContent,
  UniqueTokenExpandedStateHeader,
} from './unique-token';
import {
  useAudio,
  useDimensions,
  useShowcaseTokens,
  useUniqueToken,
} from '@rainbow-me/hooks';
import { logger, magicMemo } from '@rainbow-me/utils';

/* SF Pro Rounded (Bold) @ https://mathew-kurian.github.io/CharacterMap */
const UNICODE_SYMBOL_PAUSE = String.fromCharCode(56256, 56984);
const UNICODE_SYMBOL_PLAY = String.fromCharCode(56256, 56982);

const UniqueTokenExpandedState = ({ asset }) => {
  const {
    asset_contract: {
      description: familyDescription,
      external_link: familyLink,
      name: familyName,
    },
    description,
    isSendable,
    traits,
    uniqueId,
  } = asset;

  const {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  } = useShowcaseTokens();

  const isShowcaseAsset = useMemo(() => showcaseTokens.includes(uniqueId), [
    showcaseTokens,
    uniqueId,
  ]);

  const handlePressShowcase = useCallback(() => {
    if (isShowcaseAsset) {
      removeShowcaseToken(uniqueId);
    } else {
      addShowcaseToken(uniqueId);
    }
  }, [addShowcaseToken, isShowcaseAsset, removeShowcaseToken, uniqueId]);

  const { height: screenHeight } = useDimensions();
  const { colors, isDarkMode } = useTheme();

  const { supportsAudio } = useUniqueToken(asset);
  const {
    playAsset,
    currentlyPlayingAsset,
    isPlayingAssetPaused,
    fadeTo,
    currentSound,
    stopPlayingAsset,
  } = useAudio();

  const assetIsPlayingAudio =
    !!currentlyPlayingAsset &&
    currentlyPlayingAsset.uniqueId === asset.uniqueId;

  // TODO: if playing etc
  const handlePressAudio = useCallback(async () => {
    try {
      if (assetIsPlayingAudio) {
        return isPlayingAssetPaused
          ? currentSound.play()
          : currentSound.pause();
      }
      return playAsset(asset);
    } catch (e) {
      logger.error(e);
    }
  }, [
    asset,
    currentSound,
    playAsset,
    assetIsPlayingAudio,
    isPlayingAssetPaused,
  ]);

  useEffect(() => {
    EXPERIMENTAL_AUDIO_PLAYER !== 'true' && playAsset(asset);
  }, [playAsset, asset, stopPlayingAsset]);

  useEffect(() => {
    return () => {
      !!currentSound && fadeTo(currentSound, 0).then(stopPlayingAsset);
    };
  }, [currentSound, stopPlayingAsset, fadeTo]);

  return (
    <Fragment>
      <SlackSheet
        bottomInset={42}
        {...(ios
          ? { height: '100%' }
          : { additionalTopPadding: true, contentHeight: screenHeight - 80 })}
        scrollEnabled
      >
        <UniqueTokenExpandedStateHeader asset={asset} />
        <UniqueTokenExpandedStateContent asset={asset} />
        {EXPERIMENTAL_AUDIO_PLAYER === 'true' && !!supportsAudio && (
          <SheetActionButtonRow ignorePaddingBottom>
            <SheetActionButton
              color={colors.orangeLight}
              label={
                assetIsPlayingAudio && !isPlayingAssetPaused
                  ? `${UNICODE_SYMBOL_PAUSE} Pause`
                  : `${UNICODE_SYMBOL_PLAY} Play`
              }
              onPress={handlePressAudio}
              weight="bold"
            />
          </SheetActionButtonRow>
        )}
        <SheetActionButtonRow>
          <SheetActionButton
            color={isDarkMode ? colors.darkModeDark : colors.dark}
            label={isShowcaseAsset ? '􀁏 Showcase' : '􀁍 Showcase'}
            onPress={handlePressShowcase}
            weight="bold"
          />
          {isSendable && <SendActionButton />}
        </SheetActionButtonRow>
        <SheetDivider />
        <ColumnWithDividers dividerRenderer={SheetDivider}>
          {!!description && (
            <ExpandedStateSection title="Bio">
              {description}
            </ExpandedStateSection>
          )}
          {!!traits.length && (
            <ExpandedStateSection paddingBottom={14} title="Attributes">
              <UniqueTokenAttributes {...asset} />
            </ExpandedStateSection>
          )}
          {!!familyDescription && (
            <ExpandedStateSection title={`About ${familyName}`}>
              <Column>
                <Text
                  color={colors.alpha(colors.blueGreyDark, 0.5)}
                  lineHeight="paragraphSmall"
                  size="lmedium"
                >
                  {familyDescription}
                </Text>
                {familyLink && <Link url={familyLink} />}
              </Column>
            </ExpandedStateSection>
          )}
        </ColumnWithDividers>
      </SlackSheet>
      <ToastPositionContainer>
        <ShowcaseToast isShowcaseAsset={isShowcaseAsset} />
      </ToastPositionContainer>
    </Fragment>
  );
};

export default magicMemo(UniqueTokenExpandedState, 'asset');
