import lang from 'i18n-js';
import { startCase } from 'lodash';
import React from 'react';
import Link from '../../Link';
import EdgeFade from '../../EdgeFade';
import styled from '@/styled-thing';
import { ethereumUtils } from '@/utils';

const Carousel = styled.ScrollView.attrs({
  contentContainerStyle: {
    paddingHorizontal: 13,
  },
  horizontal: true,
  showsHorizontalScrollIndicator: false,
})({});

const CommunityLink = styled(Link).attrs({
  scaleTo: 0.925,
  weight: 'heavy',
})({
  backgroundColor: ({ color, theme: { colors } }) => colors.alpha(color, 0.1),
  borderRadius: 20,
  height: 40,
  marginHorizontal: 6,
  paddingBottom: ios ? 11.5 : 5,
  paddingHorizontal: 15,
  paddingTop: ios ? 9.5 : 5,
});

export default function SocialLinks({ address, color, isNativeAsset, links, marginTop, type }) {
  const etherscanURL = ethereumUtils.getEtherscanHostForNetwork(type);
  const blockExplorerName = ethereumUtils.getBlockExplorer(type);
  return (
    <>
      <Carousel height={59} marginBottom={1} marginTop={marginTop || 0}>
        {!isNativeAsset && (
          <CommunityLink
            color={color}
            display={` ${startCase(blockExplorerName)}`}
            emoji="􀉣"
            transformOrigin="center"
            url={`${etherscanURL}/token/${address}`}
          />
        )}
        {!!links?.twitter?.url && (
          <CommunityLink
            color={color}
            display={lang.t('expanded_state.asset.social.twitter')}
            emojiName="twitter"
            transformOrigin="center"
            url={links.twitter.url}
          />
        )}
        {!!links?.homepage?.url && (
          <CommunityLink
            color={color}
            display={lang.t('expanded_state.asset.social.homepage')}
            transformOrigin="center"
            url={links.homepage.url}
          />
        )}
        {!!links?.telegram?.url && (
          <CommunityLink
            color={color}
            display={lang.t('expanded_state.asset.social.telegram')}
            emojiName="telegram"
            transformOrigin="center"
            url={links.telegram.url}
          />
        )}
        {!!links?.reddit?.url && (
          <CommunityLink
            color={color}
            display={lang.t('expanded_state.asset.social.reddit')}
            emojiName="reddit"
            transformOrigin="center"
            url={links?.subreddit_url}
          />
        )}
        {!!links?.facebook?.url && (
          <CommunityLink
            color={color}
            display={lang.t('expanded_state.asset.social.facebook')}
            emojiName="facebook"
            transformOrigin="center"
            url={links.facebook.url}
          />
        )}
      </Carousel>
      <EdgeFade />
    </>
  );
}
