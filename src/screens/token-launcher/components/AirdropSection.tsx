import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as i18n from '@/languages';
import { Bleed, Box, Separator, Text, TextIcon, TextShadow, useForegroundColor } from '@/design-system';
import { CollapsableField } from './CollapsableField';
import { SingleFieldInput } from './SingleFieldInput';
import {
  INNER_FIELD_BACKGROUND_COLOR,
  FIELD_INNER_BORDER_RADIUS,
  FIELD_BORDER_WIDTH,
  FIELD_BORDER_RADIUS,
  COLLAPSABLE_FIELD_ANIMATION,
  SMALL_INPUT_HEIGHT,
  ERROR_RED,
} from '../constants';
import { AirdropRecipient, useTokenLauncherStore } from '../state/tokenLauncherStore';
import FastImage from 'react-native-fast-image';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { FieldContainer } from './FieldContainer';
import { abbreviateNumber } from '@/helpers/utilities';
import { checkIsValidAddressOrDomainFormat, isENSAddressFormat } from '@/helpers/validators';
import { AddressAvatar } from '@/screens/change-wallet/components/AddressAvatar';
import { fetchENSAvatar } from '@/hooks/useENSAvatar';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { Skeleton } from '@/screens/points/components/Skeleton';
import { FlatList, ScrollView } from 'react-native-gesture-handler';
import { useAirdropSuggestionsStore } from '../state/airdropSuggestionsStore';
import { ImgixImage } from '@/components/images';
import { fetchENSAddress } from '@/hooks/useENSAddress';
import { ensureError, logger, RainbowError } from '@/logger';
import { PersonalizedCohort, PredefinedCohort, SuggestedUser } from '@rainbow-me/token-launcher';
import { addressHashedEmoji, addressHashedColorIndex } from '@/utils/profileUtils';
import { ContactAvatar } from '@/components/contacts';
import { colors } from '@/styles';

function SuggestedUsers({ users }: { users: SuggestedUser[] }) {
  const { accentColors, infoInputScrollRef, infoInputScrollY } = useTokenLauncherContext();
  const addOrEditAirdropAddress = useTokenLauncherStore(state => state.addOrEditAirdropAddress);
  const airdropRecipients = useTokenLauncherStore(state => state.airdropRecipients);
  const rowOneUsers = useMemo(() => users.slice(0, Math.ceil(users.length / 2)), [users]);
  const rowTwoUsers = useMemo(() => users.slice(Math.ceil(users.length / 2)), [users]);

  const renderSuggestedUser = (user: SuggestedUser) => {
    const isExistingRecipient = airdropRecipients.some(recipient => recipient.id === user.address);

    return (
      <ButtonPressAnimation
        key={user.address}
        disabled={isExistingRecipient}
        onPress={() => {
          addOrEditAirdropAddress({
            id: user.address,
            address: user.address,
            imageUrl: user.pfpURL,
            isValid: true,
            isSuggested: true,
            label: user.username,
          });
          // Hacky, but scrollview's size won't grow until the next render
          setTimeout(() => {
            infoInputScrollRef.current?.scrollTo({ y: infoInputScrollY.current + SMALL_INPUT_HEIGHT + 8, animated: true });
          }, 1);
        }}
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
            <ImgixImage source={{ uri: user.pfpURL }} style={{ width: 28, height: 28, borderRadius: 14 }} />
            <Box style={{ position: 'absolute', bottom: -14 / 4, right: -14 / 4 }}>
              <FastImage source={{ uri: user.typeIconURL }} style={{ width: 14, height: 14, borderRadius: 7 }} />
            </Box>
          </Box>
          <Text color={{ custom: accentColors.opacity100 }} size="15pt" weight="heavy">
            {user.username ?? user.address}
          </Text>
        </Box>
      </ButtonPressAnimation>
    );
  };

  return (
    <Box gap={12}>
      <Text color="labelTertiary" size="13pt" weight="heavy">
        {i18n.t(i18n.l.token_launcher.airdrop.suggested_users)}
      </Text>
      <Bleed horizontal={'20px'}>
        <Box gap={8}>
          <FlatList
            data={rowOneUsers}
            renderItem={({ item }) => renderSuggestedUser(item)}
            keyExtractor={item => item.address}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingLeft: 20 }}
            initialNumToRender={5}
          />
          <FlatList
            data={rowTwoUsers}
            renderItem={({ item }) => renderSuggestedUser(item)}
            keyExtractor={item => item.address}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingLeft: 20 }}
            initialNumToRender={5}
          />
        </Box>
      </Bleed>
    </Box>
  );
}

function AirdropGroups({
  predefinedCohorts,
  personalizedCohorts,
}: {
  predefinedCohorts: PredefinedCohort[];
  personalizedCohorts: PersonalizedCohort[];
}) {
  const { accentColors, infoInputScrollRef, infoInputScrollY } = useTokenLauncherContext();

  const addAirdropGroup = useTokenLauncherStore(state => state.addAirdropGroup);
  const airdropRecipients = useTokenLauncherStore(state => state.airdropRecipients);

  const airdropGroups = [...predefinedCohorts, ...personalizedCohorts];

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
            const groupId = 'id' in item ? item.id : item.name;
            const isSelected = airdropRecipients.some(recipient => recipient.type === 'group' && recipient.value === groupId);

            return (
              <ButtonPressAnimation
                key={groupId}
                disabled={isSelected}
                onPress={() => {
                  addAirdropGroup({
                    groupId,
                    label: item.name,
                    count: item.totalUsers,
                    imageUrl: item.icons.iconURL,
                    addresses: 'addresses' in item ? item.addresses.map(address => address.address) : undefined,
                  });
                  // Hacky, but scrollview's size won't grow until the next render
                  setTimeout(() => {
                    infoInputScrollRef.current?.scrollTo({ y: infoInputScrollY.current + SMALL_INPUT_HEIGHT + 8, animated: true });
                  }, 1);
                }}
              >
                <Box
                  width={154.5}
                  borderWidth={FIELD_BORDER_WIDTH}
                  gap={12}
                  borderColor={{ custom: accentColors.opacity3 }}
                  borderRadius={FIELD_BORDER_RADIUS}
                  backgroundColor={accentColors.opacity6}
                  padding={'16px'}
                  justifyContent="center"
                  alignItems="center"
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
                      {item.name}
                    </Text>
                  </TextShadow>
                  <Box
                    height={18}
                    justifyContent="center"
                    alignItems="center"
                    backgroundColor={accentColors.opacity6}
                    borderRadius={7}
                    paddingHorizontal={'4px'}
                    borderWidth={1.667}
                    borderColor={'fillTertiary'}
                    position="absolute"
                    style={{
                      top: 16,
                      left: 16,
                    }}
                  >
                    <Text numberOfLines={1} align="center" color={{ custom: accentColors.opacity100 }} size="11pt" weight="heavy">
                      {abbreviateNumber(item.totalUsers, 1)}
                    </Text>
                  </Box>
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
  const [isFetchingEnsData, setIsFetchingEnsData] = useState(false);

  const resolveEnsAddress = useCallback(async (text: string) => {
    setIsFetchingEnsData(true);
    try {
      const [avatar, resolvedAddress] = await Promise.all([fetchENSAvatar(text), fetchENSAddress(text)]);
      const imageUrl = avatar?.imageUrl ?? null;

      return {
        resolvedAddress,
        imageUrl,
      };
    } catch (e) {
      const error = ensureError(e);
      logger.error(new RainbowError('[TokenLauncher]: Error fetching ENS data', error), {
        input: text,
      });
      return {
        resolvedAddress: null,
        imageUrl: null,
      };
    } finally {
      setIsFetchingEnsData(false);
    }
  }, []);

  const handleInputChange = useCallback(
    async (text: string) => {
      const isValid = checkIsValidAddressOrDomainFormat(text);
      const previousIsValid = isValidAddress;
      const isEnsAddress = isENSAddressFormat(text);

      addOrEditAirdropAddress({ id, address: text, isValid });
      setAddress(text);

      // empty text is valid, but we can't assume the first input change can't also be valid (pasting)
      if (previousIsValid === isValid && !isEnsAddress && text !== '') return;

      setIsValidAddress(isValid);

      if (isEnsAddress) {
        const { resolvedAddress, imageUrl } = await resolveEnsAddress(text);
        setAddressImage(imageUrl);
        if (resolvedAddress) {
          addOrEditAirdropAddress({ id, address: resolvedAddress, label: text, isValid: true, imageUrl });
        } else {
          addOrEditAirdropAddress({ id, address: text, isValid: false });
          setIsValidAddress(false);
        }
      }
    },
    [addOrEditAirdropAddress, isValidAddress, id, resolveEnsAddress]
  );

  const labelIcon = useMemo(() => {
    if (address !== '' && !isValidAddress) {
      return (
        <TextIcon containerSize={20} color={{ custom: ERROR_RED }} size="icon 17px" weight="heavy">
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
    if (isFetchingEnsData) {
      return <Skeleton width={20} height={20} />;
    }
    return addressImage ? (
      <AddressAvatar address={address} url={addressImage} size={20} color={accentColors.opacity100} label={''} />
    ) : (
      <ContactAvatar
        hideShadow
        color={colors.avatarBackgrounds[addressHashedColorIndex(address) ?? 0]}
        size="smaller"
        value={addressHashedEmoji(address)}
      />
    );
  }, [isValidAddress, accentColors, address, addressImage, isFetchingEnsData]);

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
        paddingHorizontal: 12,
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
        height: SMALL_INPUT_HEIGHT,
        paddingHorizontal: 12,
        justifyContent: 'center',
        backgroundColor: INNER_FIELD_BACKGROUND_COLOR,
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
      style={{
        height: SMALL_INPUT_HEIGHT,
        justifyContent: 'center',
        backgroundColor: INNER_FIELD_BACKGROUND_COLOR,
        paddingHorizontal: 16,
        borderRadius: FIELD_INNER_BORDER_RADIUS,
        flex: 1,
      }}
    >
      <Box flexDirection="row" alignItems="center" gap={8}>
        <ImgixImage source={{ uri: recipient.imageUrl ?? '' }} style={{ width: 20, height: 20, borderRadius: 10 }} />
        <Text style={{ flex: 1 }} numberOfLines={1} color="labelSecondary" size="17pt" weight="heavy">
          {recipient.label}
        </Text>
      </Box>
    </FieldContainer>
  );
}

function AirdropRecipients() {
  const airdropRecipients = useTokenLauncherStore(state => state.airdropRecipients);
  const placeholderId = useRef(Math.random().toString());

  const recipientsWithPlaceholder = useMemo(() => {
    // We need to keep placeholder id stable in cases of deletions for the layout animation to behave correctly.
    const placeholderBecameReal = airdropRecipients.some(recipient => recipient.id === placeholderId.current);
    if (placeholderBecameReal) {
      placeholderId.current = Math.random().toString();
    }
    return [
      ...airdropRecipients,
      {
        type: 'address' as const,
        id: placeholderId.current,
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
          <Animated.View
            key={recipient.id}
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            layout={COLLAPSABLE_FIELD_ANIMATION}
            style={{ width: '100%' }}
          >
            <Box flexDirection="row" alignItems="center" gap={16}>
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
  const borderColor = useForegroundColor('buttonStroke');
  const airdropSuggestions = useAirdropSuggestionsStore(state => state.getData());
  const maxRecipientCount = airdropSuggestions?.meta.maxUserAllocations ?? 0;

  const setMaxAirdropRecipientCount = useTokenLauncherStore(state => state.setMaxAirdropRecipientCount);
  const hasExceededMaxAirdropRecipients = useTokenLauncherStore(state => state.hasExceededMaxAirdropRecipients());

  useEffect(() => {
    setMaxAirdropRecipientCount(maxRecipientCount);
  }, [maxRecipientCount, setMaxAirdropRecipientCount]);

  return (
    <CollapsableField
      title={i18n.t(i18n.l.token_launcher.titles.airdrop)}
      style={{ borderColor: hasExceededMaxAirdropRecipients ? ERROR_RED : borderColor }}
    >
      <Box gap={16}>
        {hasExceededMaxAirdropRecipients && (
          <Text color={{ custom: ERROR_RED }} size="15pt" weight="heavy">
            {i18n.t(i18n.l.token_launcher.airdrop.max_recipients_reached, {
              maxRecipientCount: abbreviateNumber(maxRecipientCount, 0, 'short'),
            })}
          </Text>
        )}
        <AirdropRecipients />
        <Animated.View style={{ gap: 16 }} layout={COLLAPSABLE_FIELD_ANIMATION}>
          <Separator color={{ custom: accentColors.opacity3 }} />
          {airdropSuggestions && (
            <AirdropGroups
              predefinedCohorts={airdropSuggestions.data.predefinedCohorts}
              personalizedCohorts={airdropSuggestions.data.personalizedCohorts}
            />
          )}
        </Animated.View>

        {airdropSuggestions && (
          <Animated.View layout={COLLAPSABLE_FIELD_ANIMATION}>
            <SuggestedUsers users={airdropSuggestions.data.suggestedUsers} />
          </Animated.View>
        )}
      </Box>
    </CollapsableField>
  );
}
