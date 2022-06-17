import lang from 'i18n-js';
import React, { useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import networkTypes from '../../helpers/networkTypes';
import { useTheme } from '../../theme/ThemeContext';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import { ButtonPressAnimation } from '../animations';
import { CoinRowHeight } from '../coin-row';
import Text from '../text/Text';
import ActivityListEmptyState from './ActivityListEmptyState';
import ActivityListHeader from './FastActivityListHeader';
import styled from '@rainbow-me/styled-components';

const cx = StyleSheet.create({
  sectionHeader: {
    marginBottom: 17,
    marginTop: 17,
  },
});

const getItemLayout = (data, index) => ({
  index,
  length: CoinRowHeight,
  offset: CoinRowHeight * index,
});

const keyExtractor = ({ hash, timestamp, transactionDisplayDetails }) =>
  hash ||
  (timestamp ? timestamp.ms : transactionDisplayDetails?.timestampInMs || 0);

const renderSectionHeader = ({ section }) => (
  <View style={cx.sectionHeader}>
    <ActivityListHeader {...section} />
  </View>
);

const LoadingSpinner = android ? Spinner : ActivityIndicator;

const FooterWrapper = styled(ButtonPressAnimation)({
  alignItems: 'center',
  height: 40,
  justifyContent: 'center',
  paddingBottom: 10,
  width: '100%',
});

function ListFooterComponent({ label, onPress }) {
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) {
      onPress();
      setIsLoading(false);
    }
  }, [isLoading, setIsLoading, onPress]);
  const onPressWrapper = () => {
    setIsLoading(true);
  };
  return (
    <FooterWrapper onPress={onPressWrapper}>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Text
          align="center"
          color={colors.alpha(colors.blueGreyDark, 0.3)}
          lineHeight="loose"
          size="smedium"
          weight="bold"
        >
          {label}
        </Text>
      )}
    </FooterWrapper>
  );
}

const ActivityList = ({
  hasPendingTransaction,
  header,
  nativeCurrency,
  sections,
  requests,
  transactionsCount,
  isEmpty,
  network,
  nextPage,
  remainingItemsLabel,
}) => {
  const pendingTransactionsCount = useMemo(() => {
    let currentPendingTransactionsCount = 0;
    const pendingTxSection = sections[requests?.length ? 1 : 0];

    if (pendingTxSection && pendingTxSection.title === 'Pending') {
      currentPendingTransactionsCount = pendingTxSection.data.length;
    }
    return currentPendingTransactionsCount;
  }, [sections, requests]);
  return network === networkTypes.mainnet || sections.length ? (
    isEmpty ? (
      <ActivityListEmptyState>{header}</ActivityListEmptyState>
    ) : (
      <SectionList
        ListFooterComponent={() =>
          remainingItemsLabel && (
            <ListFooterComponent
              label={remainingItemsLabel}
              onPress={nextPage}
            />
          )
        }
        ListHeaderComponent={header}
        alwaysBounceVertical={false}
        contentContainerStyle={{ paddingBottom: !transactionsCount ? 0 : 40 }}
        extraData={{
          hasPendingTransaction,
          nativeCurrency,
          pendingTransactionsCount,
        }}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        keyExtractor={keyExtractor}
        removeClippedSubviews
        renderSectionHeader={renderSectionHeader}
        sections={sections}
      />
    )
  ) : (
    <ActivityListEmptyState
      emoji="👻"
      label={lang.t('activity_list.empty_state.testnet_label')}
    >
      {header}
    </ActivityListEmptyState>
  );
};

export default ActivityList;
