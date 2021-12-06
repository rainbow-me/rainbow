import { startCase } from 'lodash';
import React from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../Link' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Link from '../../Link';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../discover-sheet/EdgeFade' was resolve... Remove this comment to see the full error message
import EdgeFade from '../../discover-sheet/EdgeFade';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';

const TWITTER_URL = 'https://twitter.com/';
const TELEGRAM_URL = 'https://t.me/';
const FACEBOOK_URL = 'https://www.facebook.com/';

// @ts-expect-error ts-migrate(2339) FIXME: Property 'ScrollView' does not exist on type 'Styl... Remove this comment to see the full error message
const Carousel = styled.ScrollView.attrs({
  contentContainerStyle: {
    paddingHorizontal: 13,
  },
  horizontal: true,
  showsHorizontalScrollIndicator: false,
})``;

const CommunityLink = styled(Link).attrs({
  scaleTo: 0.925,
  weight: 'heavy',
})`
  background-color: ${({ color, theme: { colors } }) =>
    colors.alpha(color, 0.1)};
  border-radius: 20;
  height: 40;
  margin-horizontal: 6;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  padding-bottom: ${ios ? 11.5 : 5};
  padding-horizontal: 15;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  padding-top: ${ios ? 9.5 : 5};
`;

export default function SocialLinks({
  address,
  color,
  isNativeAsset,
  links,
  marginTop,
  type,
}: any) {
  const etherscanURL = ethereumUtils.getEtherscanHostForNetwork(type);
  const blockExplorerName = ethereumUtils.getBlockExplorer(type);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Carousel height={59} marginBottom={1} marginTop={marginTop || 0}>
        {!isNativeAsset && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CommunityLink
            color={color}
            display={` ${startCase(blockExplorerName)}`}
            emoji="􀉣"
            transformOrigin="center"
            url={`https://${etherscanURL}/token/${address}`}
          />
        )}
        {!!links?.twitter_screen_name && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CommunityLink
            color={color}
            display="Twitter"
            emojiName="twitter"
            transformOrigin="center"
            url={`${TWITTER_URL}${links?.twitter_screen_name}`}
          />
        )}
        {!!links?.homepage?.[0] && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CommunityLink
            color={color}
            display="Homepage"
            transformOrigin="center"
            url={links?.homepage?.[0]}
          />
        )}
        {!!links?.telegram_channel_identifier && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CommunityLink
            color={color}
            display="Telegram"
            emojiName="telegram"
            transformOrigin="center"
            url={`${TELEGRAM_URL}${links?.telegram_channel_identifier}`}
          />
        )}
        {!!links?.subreddit_url && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CommunityLink
            color={color}
            display="Reddit"
            emojiName="reddit"
            transformOrigin="center"
            url={links?.subreddit_url}
          />
        )}
        {!!links?.facebook_username && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CommunityLink
            color={color}
            display="Facebook"
            emojiName="facebook"
            transformOrigin="center"
            url={`${FACEBOOK_URL}${links?.facebook_username}`}
          />
        )}
      </Carousel>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <EdgeFade />
    </>
  );
}
