import React from 'react';
import styled from 'styled-components';
import Link from '../../Link';

const ETHERSCAN_URL = 'https://etherscan.io/token/';
const TWITTER_URL = 'https://twitter.com/';
const TELEGRAM_URL = 'https://t.me/';
const FACEBOOK_URL = 'https://www.facebook.com/';

const Carousel = styled.ScrollView.attrs({
  contentContainerStyle: {
    paddingBottom: 11,
    paddingHorizontal: 7,
    paddingTop: 6,
  },
  horizontal: true,
  showsHorizontalScrollIndicator: false,
})``;

const CommunityLink = styled(Link)`
  padding-top: 10;
`;

const CommunityLinkWrapper = styled.View`
  background-color: ${({ color, theme: { colors } }) =>
    colors.alpha(color, 0.1)};
  padding-horizontal: 16;
  border-radius: 25;
  margin-horizontal: 10;
`;

export default function SocialLinks({ color, links, address }) {
  return (
    <Carousel height={59}>
      <CommunityLinkWrapper color={color}>
        <CommunityLink
          color={color}
          display="Etherscan"
          emoji="􀉣"
          transformOrigin="center"
          url={`${ETHERSCAN_URL}${address}`}
        />
      </CommunityLinkWrapper>
      {!!links?.twitter_screen_name && (
        <CommunityLinkWrapper color={color}>
          <CommunityLink
            color={color}
            display="Twitter"
            emojiName="twitter"
            transformOrigin="center"
            url={`${TWITTER_URL}${links?.twitter_screen_name}`}
          />
        </CommunityLinkWrapper>
      )}
      {!!links?.homepage?.[0] && (
        <CommunityLinkWrapper color={color}>
          <CommunityLink
            color={color}
            display="Homepage"
            transformOrigin="center"
            url={links?.homepage?.[0]}
          />
        </CommunityLinkWrapper>
      )}
      {!!links?.telegram_channel_identifier && (
        <CommunityLinkWrapper color={color}>
          <CommunityLink
            color={color}
            display="Telegram"
            emojiName="telegram"
            transformOrigin="center"
            url={`${TELEGRAM_URL}${links?.telegram_channel_identifier}`}
          />
        </CommunityLinkWrapper>
      )}
      {!!links?.subreddit_url && (
        <CommunityLinkWrapper color={color}>
          <CommunityLink
            color={color}
            display="Reddit"
            emojiName="reddit"
            transformOrigin="center"
            url={links?.subreddit_url}
          />
        </CommunityLinkWrapper>
      )}
      {!!links?.facebook_username && (
        <CommunityLinkWrapper color={color}>
          <CommunityLink
            color={color}
            display="Facebook"
            emojiName="facebook"
            transformOrigin="center"
            url={`${FACEBOOK_URL}${links?.facebook_username}`}
          />
        </CommunityLinkWrapper>
      )}
    </Carousel>
  );
}
