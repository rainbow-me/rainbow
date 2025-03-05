import React, { memo, useCallback, useMemo, useState } from 'react';
import * as i18n from '@/languages';
import { Bleed, Box, Separator, Text, TextIcon, TextShadow } from '@/design-system';
import { CollapsableField } from './CollapsableField';
import { SingleFieldInput } from './SingleFieldInput';
import {
  INNER_FIELD_BACKGROUND_COLOR,
  FIELD_INNER_BORDER_RADIUS,
  FIELD_BORDER_WIDTH,
  FIELD_BORDER_RADIUS,
  COLLAPSABLE_FIELD_ANIMATION,
  SMALL_INPUT_HEIGHT,
} from '../constants';
import { AirdropRecipient, useTokenLauncherStore } from '../state/tokenLauncherStore';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { FieldContainer } from './FieldContainer';
import { abbreviateNumber } from '@/helpers/utilities';
import { checkIsValidAddressOrDomainFormat } from '@/helpers/validators';
import { AddressAvatar } from '@/screens/change-wallet/components/AddressAvatar';
import { fetchENSAvatar } from '@/hooks/useENSAvatar';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { Skeleton } from '@/screens/points/components/Skeleton';
import { ScrollView } from 'react-native';

const airdropSuggestions = {
  predefinedCohorts: [
    {
      id: '0_rainbow-users',
      Name: 'All Rainbow Users',
      icons: {
        iconURL: 'https://rainbowme-res.cloudinary.com/image/upload/v1694722625/dapps/rainbow-icon-large.png',
      },
      totalUsers: 1400000,
    },
    {
      id: '1_top-rainbow-points',
      Name: 'Top 1000 Rainbow Points',
      icons: {
        iconURL: 'https://rainbowme-res.cloudinary.com/image/upload/v1694722625/dapps/rainbow-icon-large.png',
      },
      totalUsers: 1000,
    },
    {
      id: '2_top-farcaster',
      Name: 'Top 1000 Farcaster Users',
      icons: {
        iconURL: 'https://rainbowme-res.cloudinary.com/image/upload/v1697055518/dapps/ingested_www.farcaster.xyz.png',
        pfp1URL:
          'https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/341d47e1-f746-4f5c-8fbe-d9e56fa66100/anim=false,fit=contain,f=auto,w=336',
        pfp2URL: 'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=336/https%3A%2F%2Fi.imgur.com%2F4t3zVHj.jpg',
      },
      totalUsers: 1000,
    },
  ],
  personalizedCohorts: [
    {
      id: '0_farcaster-followers',
      Name: 'Farcaster Followers',
      icons: {
        iconURL: 'https://rainbowme-res.cloudinary.com/image/upload/v1697055518/dapps/ingested_www.farcaster.xyz.png',
        pfp1URL:
          'https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/3f0c4a24-9cf9-41f2-52ba-22862ae80a00/anim=false,fit=contain,f=auto,w=336',
      },
      totalUsers: 1,
      addresses: [
        {
          username: 'sulkian',
          address: '0x5dfcf95b7d689c11197d1576ccd505f1f3188319',
          pfpURL:
            'https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/3f0c4a24-9cf9-41f2-52ba-22862ae80a00/anim=false,fit=contain,f=auto,w=336',
          type: 'Farcaster',
          typePfpURL: 'https://rainbowme-res.cloudinary.com/image/upload/v1697055518/dapps/ingested_www.farcaster.xyz.png',
        },
      ],
    },
  ],
  suggested: [
    {
      username: 'sulkian',
      address: '0x5dfcf95b7d689c11197d1576ccd505f1f3188319',
      pfpURL:
        'https://rainbowme-res.cloudinary.com/image/upload/v1680723839/ens-marquee/eafa8f2a4702a08838eb/0x96a77560146501eAEB5e6D5B7d8DD1eD23DEfa23.png',
      type: 'Farcaster',
      typePfpURL: 'https://rainbowme-res.cloudinary.com/image/upload/v1697055518/dapps/ingested_www.farcaster.xyz.png',
    },
    {
      username: 'ihateethereum.eth',
      address: '0x4888c0030b743c17C89A8AF875155cf75dCfd1E1',
      pfpURL:
        'https://rainbowme-res.cloudinary.com/image/upload/v1680723839/ens-marquee/eafa8f2a4702a08838eb/0x3C6aEFF92b4B35C2e1b196B57d0f8FFB56884A17.jpg',
      type: 'ENS',
      typePfpURL: 'https://rainbowme-res.cloudinary.com/image/upload/v1688069140/dapps/ingested_ens.domains.png',
    },
    // TODO: ask about this, do not think we should be displaying raw addresses no one will know what / who they are
    // {
    //   address: '0xA059BA83C047c8EE6f94726CA5f644b7122Cac61',
    //   pfpURL: 'https://rainbowme-res.cloudinary.com/image/upload/v1739452782/token-launcher/backend/nopfp.png',
    //   type: 'Rainbow',
    //   typePfpURL: 'https://rainbowme-res.cloudinary.com/image/upload/v1694722625/dapps/rainbow-icon-large.png',
    // },
  ],
} as const;

type SuggestedUser = {
  username?: string;
  address: string;
  pfpURL: string;
  type: 'Farcaster' | 'ENS' | 'Rainbow';
  typePfpURL: string;
};

function SuggestedUsers({ suggestions }: { suggestions: SuggestedUser[] }) {
  const { accentColors } = useTokenLauncherContext();
  const addOrEditAirdropAddress = useTokenLauncherStore(state => state.addOrEditAirdropAddress);
  const airdropRecipients = useTokenLauncherStore(state => state.airdropRecipients);

  return (
    <Box gap={12}>
      <Text color="labelTertiary" size="13pt" weight="heavy">
        {i18n.t(i18n.l.token_launcher.airdrop.suggested_users)}
      </Text>
      <Bleed horizontal={'20px'}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingLeft: 20 }}>
          {suggestions.map(suggestion => {
            const isExistingRecipient = airdropRecipients.some(recipient => recipient.id === suggestion.address);

            return (
              <ButtonPressAnimation
                key={suggestion.address}
                disabled={isExistingRecipient}
                onPress={() =>
                  addOrEditAirdropAddress({
                    id: suggestion.address,
                    address: suggestion.address,
                    imageUrl: suggestion.pfpURL,
                    isValid: true,
                    isSuggested: true,
                    label: suggestion.username,
                  })
                }
              >
                <Box
                  backgroundColor={accentColors.opacity6}
                  borderWidth={FIELD_BORDER_WIDTH}
                  borderColor={{ custom: accentColors.opacity3 }}
                  paddingHorizontal={'16px'}
                  paddingVertical={'12px'}
                  flexDirection="row"
                  alignItems="center"
                  gap={12}
                  borderRadius={FIELD_BORDER_RADIUS}
                  style={{ opacity: isExistingRecipient ? 0.5 : 1 }}
                >
                  <Box>
                    <FastImage source={{ uri: suggestion.pfpURL }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                    <Box style={{ position: 'absolute', bottom: -14 / 4, right: -14 / 4 }}>
                      <FastImage source={{ uri: suggestion.typePfpURL }} style={{ width: 14, height: 14, borderRadius: 7 }} />
                    </Box>
                  </Box>
                  <Text color={{ custom: accentColors.opacity100 }} size="15pt" weight="heavy">
                    {suggestion.username ?? suggestion.address}
                  </Text>
                </Box>
              </ButtonPressAnimation>
            );
          })}
        </ScrollView>
      </Bleed>
    </Box>
  );
}

function AirdropGroups() {
  const { accentColors } = useTokenLauncherContext();

  const addAirdropGroup = useTokenLauncherStore(state => state.addAirdropGroup);
  const airdropRecipients = useTokenLauncherStore(state => state.airdropRecipients);

  // TODO: will come from backend / sdk
  const airdropGroups = [...airdropSuggestions.predefinedCohorts, ...airdropSuggestions.personalizedCohorts];

  return (
    <Box gap={12}>
      <Text color="labelTertiary" size="13pt" weight="heavy">
        {i18n.t(i18n.l.token_launcher.airdrop.airdrop_lists)}
      </Text>
      <Bleed vertical={'3px'} horizontal={'20px'}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 3,
            gap: 8,
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {airdropGroups.map(item => {
            const isSelected = airdropRecipients.some(recipient => recipient.type === 'group' && recipient.value === item.id);

            return (
              <ButtonPressAnimation
                key={item.id}
                disabled={isSelected}
                onPress={() =>
                  addAirdropGroup({ groupId: item.id, label: item.Name, count: item.totalUsers, imageUrl: item.icons.iconURL })
                }
              >
                <Box
                  height={133}
                  width={154.5}
                  borderWidth={FIELD_BORDER_WIDTH}
                  gap={12}
                  borderColor={{ custom: accentColors.opacity3 }}
                  borderRadius={FIELD_BORDER_RADIUS}
                  backgroundColor={accentColors.opacity6}
                  paddingHorizontal={'16px'}
                  paddingVertical={'16px'}
                  justifyContent="center"
                  alignItems="center"
                  key={item.id}
                  style={{
                    overflow: 'visible',
                    opacity: isSelected ? 0.5 : 1,
                  }}
                >
                  <Box
                    style={{
                      position: 'absolute',
                      top: -3,
                      right: -3.5,
                    }}
                    width={24}
                    height={24}
                    borderRadius={12}
                    borderColor={{ custom: accentColors.opacity6 }}
                    backgroundColor={accentColors.opacity100}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <TextIcon containerSize={24} color={{ custom: 'rgba(0,0,0,0.5)' }} size="icon 14px" weight="heavy">
                      {isSelected ? '􀆅' : '􀅼'}
                    </TextIcon>
                  </Box>
                  <FastImage source={{ uri: item.icons.iconURL }} style={{ width: 42, height: 42, borderRadius: 21 }} />
                  <TextShadow blur={12} shadowOpacity={0.24} color={accentColors.opacity100}>
                    <Text numberOfLines={2} align="center" color={{ custom: accentColors.opacity100 }} size="15pt" weight="heavy">
                      {item.Name}
                    </Text>
                  </TextShadow>
                </Box>
              </ButtonPressAnimation>
            );
          })}
        </ScrollView>
      </Bleed>
    </Box>
  );
}

const AddressInput = memo(function AddressInput({ id }: { id: string }) {
  const { accentColors } = useTokenLauncherContext();
  const addOrEditAirdropAddress = useTokenLauncherStore(state => state.addOrEditAirdropAddress);

  // Maintain local state to avoid needing to subscribe to the whole list of recipients
  const [isValidAddress, setIsValidAddress] = useState(true);
  const [addressImage, setAddressImage] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [isFetchingEnsAvatar, setIsFetchingEnsAvatar] = useState(false);

  const handleInputChange = useCallback(
    async (text: string) => {
      const isValid = checkIsValidAddressOrDomainFormat(text);

      addOrEditAirdropAddress({ id, address: text, isValid });
      setAddress(text);

      if (isValid !== isValidAddress) {
        setIsValidAddress(isValid);

        if (isValid) {
          setIsFetchingEnsAvatar(true);
          const avatar = await fetchENSAvatar(text);
          const imageUrl = avatar?.imageUrl ?? null;

          setAddressImage(imageUrl);
          setIsFetchingEnsAvatar(false);
          addOrEditAirdropAddress({ id, address: text, isValid, imageUrl });
        }
      }
    },
    [addOrEditAirdropAddress, isValidAddress, id]
  );

  const labelIcon = useMemo(() => {
    if (address !== '' && !isValidAddress) {
      return (
        <TextIcon containerSize={20} color={'red'} size="icon 17px" weight="heavy">
          {'􀁟'}
        </TextIcon>
      );
    }
    if (address === '' || !isValidAddress) {
      return (
        <Box
          width={20}
          height={20}
          borderRadius={10}
          borderWidth={2}
          borderColor={{ custom: accentColors.opacity6 }}
          backgroundColor={accentColors.opacity12}
          justifyContent="center"
          alignItems="center"
        >
          <TextIcon containerSize={20} color="label" size="icon 11px" weight="heavy">
            {'􀅼'}
          </TextIcon>
        </Box>
      );
    }
    if (isFetchingEnsAvatar) {
      return <Skeleton width={20} height={20} />;
    }
    return <AddressAvatar address={address} url={addressImage} size={20} color={accentColors.opacity100} label={''} />;
  }, [isValidAddress, accentColors, address, addressImage, isFetchingEnsAvatar]);

  return (
    <SingleFieldInput
      showPaste
      icon={labelIcon}
      placeholder={i18n.t(i18n.l.token_launcher.airdrop.address_or_ens)}
      textAlign="left"
      inputStyle={{ textAlign: 'left', paddingLeft: 8 }}
      validationWorklet={(text: string) => {
        const isValid = checkIsValidAddressOrDomainFormat(text);
        if (!isValid && text !== '') {
          return { error: true };
        }
      }}
      style={{
        flex: 1,
        backgroundColor: INNER_FIELD_BACKGROUND_COLOR,
        paddingHorizontal: 16,
        borderRadius: FIELD_INNER_BORDER_RADIUS,
        height: SMALL_INPUT_HEIGHT,
      }}
      onInputChange={handleInputChange}
      spellCheck={false}
    />
  );
});

function AirdropGroupField({ recipient }: { recipient: AirdropRecipient }) {
  return (
    <FieldContainer
      style={{
        backgroundColor: INNER_FIELD_BACKGROUND_COLOR,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: FIELD_INNER_BORDER_RADIUS,
        flex: 1,
      }}
    >
      <Box flexDirection="row" alignItems="center" gap={8}>
        <FastImage source={{ uri: recipient.imageUrl ?? '' }} style={{ width: 20, height: 20, borderRadius: 10 }} />
        <Text style={{ flex: 1 }} numberOfLines={1} color="labelSecondary" size="17pt" weight="heavy">
          {recipient.label}
        </Text>
        <Box
          justifyContent="center"
          alignItems="center"
          borderRadius={8}
          height={24}
          paddingHorizontal={'8px'}
          backgroundColor={'rgba(0, 0, 0, 0.10)'}
        >
          <Text color="labelSecondary" size="13pt" weight="heavy">
            {abbreviateNumber(recipient.count, 1)}
          </Text>
        </Box>
      </Box>
    </FieldContainer>
  );
}

function SuggestedUserField({ recipient }: { recipient: AirdropRecipient }) {
  return (
    <FieldContainer
      style={{ backgroundColor: INNER_FIELD_BACKGROUND_COLOR, paddingHorizontal: 16, borderRadius: FIELD_INNER_BORDER_RADIUS, flex: 1 }}
    >
      <Box flexDirection="row" alignItems="center" gap={8}>
        <FastImage source={{ uri: recipient.imageUrl ?? '' }} style={{ width: 20, height: 20, borderRadius: 10 }} />
        <Text style={{ flex: 1 }} numberOfLines={1} color="labelSecondary" size="17pt" weight="heavy">
          {recipient.label}
        </Text>
      </Box>
    </FieldContainer>
  );
}

function AirdropRecipients() {
  const airdropRecipients = useTokenLauncherStore(state => state.airdropRecipients);

  const recipientsWithPlaceholder = useMemo(() => {
    return [
      ...airdropRecipients,
      {
        type: 'address' as const,
        id: Math.random().toString(),
        label: '',
        count: 1,
        value: '',
        isSuggested: false,
        isValid: true,
        imageUrl: null,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airdropRecipients.length]);

  const deleteAirdropRecipient = useTokenLauncherStore(state => state.deleteAirdropRecipient);

  return (
    <Box gap={8}>
      {recipientsWithPlaceholder.map((recipient, index) => {
        return (
          <Animated.View key={recipient.id} layout={COLLAPSABLE_FIELD_ANIMATION} style={{ width: '100%' }}>
            <Box flexDirection="row" alignItems="center" gap={16} key={recipient.id}>
              {recipient.type === 'address' && recipient.isSuggested && <SuggestedUserField recipient={recipient} />}
              {recipient.type === 'address' && !recipient.isSuggested && <AddressInput id={recipient.id} />}
              {recipient.type === 'group' && <AirdropGroupField recipient={recipient} />}
              <ButtonPressAnimation
                disabled={index === recipientsWithPlaceholder.length - 1}
                style={{ opacity: index === recipientsWithPlaceholder.length - 1 ? 0 : 1 }}
                onPress={() => deleteAirdropRecipient(recipient.id)}
              >
                <TextShadow blur={12} shadowOpacity={0.24}>
                  <Text color="labelSecondary" size="17pt" weight="heavy">
                    {'􀈒'}
                  </Text>
                </TextShadow>
              </ButtonPressAnimation>
            </Box>
          </Animated.View>
        );
      })}
    </Box>
  );
}

export function AirdropSection() {
  const { accentColors } = useTokenLauncherContext();

  return (
    <CollapsableField title="Airdrop">
      <Box gap={16}>
        <AirdropRecipients />
        <Animated.View style={{ gap: 16 }} layout={COLLAPSABLE_FIELD_ANIMATION}>
          <Separator color={{ custom: accentColors.opacity3 }} />
          <AirdropGroups />
        </Animated.View>

        {/* @ts-expect-error TODO: remove, will get fixed when we have backend integration */}
        <SuggestedUsers suggestions={airdropSuggestions.suggested} />
      </Box>
    </CollapsableField>
  );
}
