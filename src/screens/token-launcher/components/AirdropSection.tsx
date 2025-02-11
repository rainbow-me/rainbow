import React, { memo, useCallback, useMemo, useState } from 'react';
import { Bleed, Box, Separator, Text, TextIcon, TextShadow } from '@/design-system';
import { CollapsableField } from './CollapsableField';
import { SingleFieldInput } from './SingleFieldInput';
import { INNER_FIELD_BACKGROUND_COLOR, FIELD_INNER_BORDER_RADIUS, FIELD_BORDER_WIDTH, FIELD_BORDER_RADIUS } from '../constants';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import FastImage from 'react-native-fast-image';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { FieldContainer } from './FieldContainer';
import rainbowIconCircle from '@/assets/rainbow-icon-circle.png';
import warpcastIconCircle from '@/assets/warpcast.png';
import { abbreviateNumber } from '@/helpers/utilities';
import { checkIsValidAddressOrDomainFormat } from '@/helpers/validators';
import { AddressAvatar } from '@/screens/change-wallet/components/AddressAvatar';

const AIRDROP_GROUPS = [
  {
    label: 'All Rainbow Users',
    groupId: 'all-rainbow-users',
    source: 'rainbow',
    count: 1002202,
    avatars: [],
  },
  {
    label: 'Top Farcaster Pals',
    groupId: 'top-farcaster-pals',
    source: 'farcaster',
    count: 62,
    avatars: [],
  },
  {
    label: 'All Rainbow Users in App Right NOW',
    groupId: 'all-rainbow-users-in-app-right-now',
    source: 'rainbow',
    avatars: [],
    count: 672,
  },
];

// function SuggestedUsers() {
//   const accentColors = useTokenLauncherStore(state => state.accentColors);

//   return (
//     <Box>
//       <Text color="labelTertiary" size="13pt" weight="heavy">
//         {'SUGGESTED USERS'}
//       </Text>
//     </Box>
//   );
// }

function AirdropGroups() {
  const addAirdropGroup = useTokenLauncherStore(state => state.addAirdropGroup);
  const accentColors = useTokenLauncherStore(state => state.accentColors);
  const airdropRecipients = useTokenLauncherStore(state => state.airdropRecipients);

  const airdropGroups = useMemo(() => {
    return AIRDROP_GROUPS.filter(
      group => !airdropRecipients.some(recipient => recipient.type === 'group' && recipient.value === group.groupId)
    );
  }, [airdropRecipients]);

  return (
    <Box gap={12}>
      <Text color="labelTertiary" size="13pt" weight="heavy">
        {'AIRDROP LISTS'}
      </Text>
      <Bleed vertical={'3px'} horizontal={'20px'}>
        <Animated.FlatList
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 3,
            gap: 8,
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          itemLayoutAnimation={LinearTransition}
          data={airdropGroups}
          keyExtractor={item => item.groupId}
          renderItem={({ item }) => {
            let groupIcon;

            if (item.source === 'rainbow') {
              groupIcon = rainbowIconCircle;
            } else if (item.source === 'farcaster') {
              groupIcon = warpcastIconCircle;
            }

            return (
              <ButtonPressAnimation onPress={() => addAirdropGroup(item.groupId)}>
                <Box
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
                  key={item.label}
                  style={{
                    overflow: 'visible',
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
                    backgroundColor={accentColors.primary}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <TextIcon containerSize={24} color={{ custom: 'rgba(0,0,0,0.5)' }} size="icon 14px" weight="heavy">
                      {'􀅼'}
                    </TextIcon>
                  </Box>
                  <FastImage source={groupIcon} style={{ width: 42, height: 42, borderRadius: 21 }} />
                  <TextShadow blur={12} shadowOpacity={0.24} color={accentColors.primary}>
                    <Text numberOfLines={2} align="center" color={{ custom: accentColors.primary }} size="15pt" weight="heavy">
                      {item.label}
                    </Text>
                  </TextShadow>
                </Box>
              </ButtonPressAnimation>
            );
          }}
        />
      </Bleed>
    </Box>
  );
}

const AddressInput = memo(function AddressInput({ id }: { id: string }) {
  const accentColors = useTokenLauncherStore(state => state.accentColors);
  const addOrEditAirdropAddress = useTokenLauncherStore(state => state.addOrEditAirdropAddress);

  const [isValidAddress, setIsValidAddress] = useState(false);

  // Maintain local state of the address for use in the label icon
  const [address, setAddress] = useState('');

  const handleInputChange = useCallback(
    (text: string, id: string) => {
      addOrEditAirdropAddress({ id, address: text });
      setAddress(text);
    },
    [addOrEditAirdropAddress]
  );

  const labelIcon = useMemo(() => {
    if (!isValidAddress) {
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
    } else {
      return <AddressAvatar address={address} size={20} color={accentColors.primary} label={''} />;
    }
  }, [isValidAddress, accentColors, address]);

  return (
    <SingleFieldInput
      showPaste
      icon={labelIcon}
      placeholder="Address or ENS"
      textAlign="left"
      inputStyle={{ textAlign: 'left', paddingLeft: 8 }}
      style={{
        flex: 1,
        backgroundColor: INNER_FIELD_BACKGROUND_COLOR,
        paddingVertical: 0,
        paddingHorizontal: 16,
        borderRadius: FIELD_INNER_BORDER_RADIUS,
      }}
      onInputChange={text => {
        handleInputChange(text, id);
        const isValid = checkIsValidAddressOrDomainFormat(text);
        if (isValid !== isValidAddress) {
          setIsValidAddress(isValid);
        }
      }}
    />
  );
});

function AirdropGroupField({ groupId }: { groupId: string }) {
  const groupInfo = AIRDROP_GROUPS.find(group => group.groupId === groupId);

  if (!groupInfo) return null;

  let groupIcon;

  if (groupInfo.source === 'rainbow') {
    groupIcon = rainbowIconCircle;
  } else if (groupInfo.source === 'farcaster') {
    groupIcon = warpcastIconCircle;
  }

  return (
    <FieldContainer
      style={{
        backgroundColor: INNER_FIELD_BACKGROUND_COLOR,
        paddingHorizontal: 16,
        borderRadius: FIELD_INNER_BORDER_RADIUS,
        flex: 1,
      }}
    >
      <Box flexDirection="row" alignItems="center" gap={8}>
        <FastImage source={groupIcon} style={{ width: 20, height: 20, borderRadius: 10 }} />
        <Text style={{ flex: 1 }} numberOfLines={1} color="labelSecondary" size="17pt" weight="heavy">
          {groupInfo.label}
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
            {abbreviateNumber(groupInfo.count, 1)}
          </Text>
        </Box>
      </Box>
    </FieldContainer>
  );
}

function AirdropRecipients() {
  const airdropRecipients = useTokenLauncherStore(state => state.airdropRecipients);

  const recipientsWithPlaceholder = useMemo(() => {
    return [...airdropRecipients, { type: 'address' as const, id: Math.random().toString(), value: '' }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airdropRecipients.length]);

  const deleteAirdropRecipient = useTokenLauncherStore(state => state.deleteAirdropRecipient);

  return (
    <Box gap={8}>
      {recipientsWithPlaceholder.map((recipient, index) => {
        return (
          <Box flexDirection="row" alignItems="center" gap={16} key={recipient.id}>
            {recipient.type === 'address' && <AddressInput id={recipient.id} />}
            {recipient.type === 'group' && <AirdropGroupField groupId={recipient.value} />}
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
        );
      })}
    </Box>
  );
}

export function AirdropSection() {
  const accentColors = useTokenLauncherStore(state => state.accentColors);

  return (
    <CollapsableField title="Airdrop">
      <Box gap={16}>
        <AirdropRecipients />
        <Separator color={{ custom: accentColors.opacity3 }} />
        <AirdropGroups />
        {/* <SuggestedUsers /> */}
      </Box>
    </CollapsableField>
  );
}
