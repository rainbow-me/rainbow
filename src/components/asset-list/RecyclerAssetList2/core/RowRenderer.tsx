import React from 'react';
import { View } from 'react-native';
import { CoinDivider } from '../../../coin-divider';
import { AssetListHeader } from '../../index';
import WrappedNFT from '../WrappedNFT';
import WrappedPoolRow from '../WrappedPoolRow';
import WrappedPoolsListHeader from '../WrappedPoolsListHeader';
import WrappedSavingsListHeader from '../WrappedSavingsListHeader';
import WrappedSavingsRow from '../WrappedSavingsRow';
import WrappedTokenFamilyHeader from '../WrappedTokenFamilyHeader';
import WrapperBalanceCoinRow from '../WrapperBalanceCoinRow';
import { useAdditionalRecyclerAssetListData } from './Contexts';
import {
  AssetsHeaderExtraData,
  CellType,
  CoinDividerExtraData,
  CoinExtraData,
  NFTExtraData,
  NFTFamilyExtraData,
  PoolsHeaderExtraData,
  SavingExtraData,
  SavingsHeaderExtraData,
  UniswapPoolExtraData,
} from './ViewTypes';
import { Text } from '@rainbow-me/design-system';

let containerCount = 0;

class CellContainer extends React.Component {
  constructor(args: any) {
    super(args);
    this._containerId = containerCount++;
  }
  private _containerId = 0;

  render() {
    return (
      <View {...this.props}>
        {this.props.children}
        <Text>Cell Id: {this._containerId}</Text>
      </View>
    );
  }
}

function CellDataProvider({
  uid,
  children,
}: {
  uid: string;
  children: (data: object) => React.ReactElement;
}) {
  const data = useAdditionalRecyclerAssetListData(uid);
  return children(data);
}

function rowRenderer(type: CellType, { uid }: { uid: string }) {
  return (
    <CellDataProvider uid={uid}>
      {data => {
        switch (type) {
          case CellType.COIN_DIVIDER:
            return (
              <CoinDivider balancesSum={(data as CoinDividerExtraData).value} />
            );
          case CellType.ASSETS_HEADER:
            return (
              <AssetListHeader
                totalValue={(data as AssetsHeaderExtraData).value}
              />
            );
          case CellType.COIN:
            return (
              <WrapperBalanceCoinRow
                uniqueId={(data as CoinExtraData).uniqueId}
              />
            );
          case CellType.SAVINGS_HEADER:
            return (
              <WrappedSavingsListHeader
                value={(data as SavingsHeaderExtraData).value}
              />
            );
          case CellType.SAVINGS:
            return (
              <WrappedSavingsRow address={(data as SavingExtraData).address} />
            );
          case CellType.POOLS_HEADER:
            return (
              <WrappedPoolsListHeader
                value={(data as PoolsHeaderExtraData).value}
              />
            );
          case CellType.UNISWAP_POOL:
            return (
              <WrappedPoolRow
                address={(data as UniswapPoolExtraData).address}
              />
            );
          case CellType.NFTS_HEADER:
            return <AssetListHeader title="Collectibles" />;
          case CellType.FAMILY_HEADER: {
            const { name, image, total } = data as NFTFamilyExtraData;
            return (
              <WrappedTokenFamilyHeader
                image={image}
                name={name}
                total={total}
              />
            );
          }
          case CellType.NFT:
            return <WrappedNFT uniqueId={(data as NFTExtraData).uniqueId} />;
        }
        return (
          // @ts-ignore
          <CellContainer style={styles.container}>
            <Text>Data: {JSON.stringify(data)}</Text>
          </CellContainer>
        );
      }}
    </CellDataProvider>
  );
}

const styles = {
  container: {
    alignItems: 'center',
    backgroundColor: '#00a1f1',
    borderWidth: 2,
    flex: 1,
    justifyContent: 'space-around',
  },
};

export default rowRenderer;
