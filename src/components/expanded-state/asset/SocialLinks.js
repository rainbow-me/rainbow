import { startCase } from 'lodash';
import React from 'react';
import Link from '../../Link';
import EdgeFade from '../../discover-sheet/EdgeFade';
import styled from '@rainbow-me/styled-components';
import { ethereumUtils } from '@rainbow-me/utils';

const TWITTER_URL = 'https://twitter.com/';
const TELEGRAM_URL = 'https://t.me/';
const FACEBOOK_URL = 'https://www.facebook.com/';

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

export default function SocialLinks({
  address,
  color,
  isNativeAsset,
  links,
  marginTop,
  type,
}) {
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
            url={`https://${etherscanURL}/token/${address}`}
          />
        )}
        {!!links?.twitter_screen_name && (
          <CommunityLink
            color={color}
            display="Twitter"
            emojiName="twitter"
            transformOrigin="center"
            url={`${TWITTER_URL}${links?.twitter_screen_name}`}
          />
        )}
        {!!links?.homepage?.[0] && (
          <CommunityLink
            color={color}
            display="Homepage"
            transformOrigin="center"
            url={links?.homepage?.[0]}
          />
        )}
        {!!links?.telegram_channel_identifier && (
          <CommunityLink
            color={color}
            display="Telegram"
            emojiName="telegram"
            transformOrigin="center"
            url={`${TELEGRAM_URL}${links?.telegram_channel_identifier}`}
          />
        )}
        {!!links?.subreddit_url && (
          <CommunityLink
            color={color}
            display="Reddit"
            emojiName="reddit"
            transformOrigin="center"
            url={links?.subreddit_url}
          />
        )}
        {!!links?.facebook_username && (
          <CommunityLink
            color={color}
            display="Facebook"
            emojiName="facebook"
            transformOrigin="center"
            url={`${FACEBOOK_URL}${links?.facebook_username}`}
          />
        )}
      </Carousel>
      <EdgeFade />
    </>
  );
}
