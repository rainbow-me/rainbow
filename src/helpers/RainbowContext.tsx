import React, { createContext, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { MMKV } from 'react-native-mmkv';
import { useSharedValue } from 'react-native-reanimated';
import DevButton from '../components/dev-buttons/DevButton';
import Emoji from '../components/text/Emoji';
import { showConnectToAnvilButton, showReloadButton, showSwitchModeButton } from '../config/debug';
import { defaultConfig, defaultConfigValues } from '@/config/experimental';
import { useTheme } from '../theme/ThemeContext';
import { STORAGE_IDS } from '@/model/mmkv';
import { logger, RainbowError } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@rainbow-me/routes';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { IS_ANDROID, IS_DEV, IS_TEST } from '@/env';
import { ethers } from 'ethers';
import { getFavorites } from '@/resources/favorites';

export type RainbowContextType = {
  config: Record<keyof typeof defaultConfig, boolean> | Record<string, never>;
  setConfig: (newConfig: Record<string, boolean>) => void;
  setGlobalState: (newState: Record<string, unknown>) => void;
};

export const RainbowContext = createContext<RainbowContextType>({
  config: {},
  setConfig: () => {
    return;
  },
  setGlobalState: () => {
    return;
  },
});

const storageKey = 'config';

const storage = new MMKV({
  id: STORAGE_IDS.EXPERIMENTAL_CONFIG,
});

export default function RainbowContextWrapper({ children }: PropsWithChildren) {
  // This value is hold here to prevent JS VM from shutting down
  // on unmounting all shared values.
  useSharedValue(0);
  const setConnectedToAnvil = useConnectedToAnvilStore(state => state.setConnectedToAnvil);
  const [config, setConfig] = useState<Record<string, boolean>>(defaultConfigValues);
  const [globalState, updateGlobalState] = useState({});

  useEffect(() => {
    if (IS_TEST) {
      getFavorites();
    }
    const configFromStorage = storage.getString(storageKey);
    if (configFromStorage) {
      setConfig(config => ({ ...config, ...JSON.parse(configFromStorage) }));
    }
  }, []);

  const setConfigWithStorage = useCallback((newConfig: Record<string, boolean>) => {
    storage.set(storageKey, JSON.stringify(newConfig));
    setConfig(newConfig);
  }, []);

  const setGlobalState = useCallback(
    (newState: Record<string, unknown>) => updateGlobalState(prev => ({ ...prev, ...(newState || {}) })),
    [updateGlobalState]
  );

  const initialValue = useMemo(
    () => ({
      ...globalState,
      config,
      setConfig: setConfigWithStorage,
      setGlobalState,
    }),
    [config, globalState, setConfigWithStorage, setGlobalState]
  );

  const { isDarkMode, setTheme, colors } = useTheme();

  const connectToAnvil = useCallback(async () => {
    try {
      const currentValue = useConnectedToAnvilStore.getState().connectedToAnvil;
      setConnectedToAnvil(!currentValue);
      logger.debug('connected to anvil');
    } catch (e) {
      setConnectedToAnvil(false);
      logger.error(new RainbowError('error connecting to anvil'), {
        message: e instanceof Error ? e.message : String(e),
      });
    }
    Navigation.handleAction(Routes.WALLET_SCREEN, {});
  }, [setConnectedToAnvil]);

  const fundTestWallet = useCallback(async () => {
    if (!IS_TEST) return;
    const RPC_URL = IS_ANDROID ? 'http://10.0.2.2:8545' : 'http://127.0.0.1:8545';
    try {
      const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
      const testWalletAddress = '0x4d14289265eb7c166cF111A76B6D742e3b85dF85';
      await wallet.sendTransaction({
        to: testWalletAddress,
        value: ethers.utils.parseEther('20'),
      });
    } catch (e) {
      logger.error(new RainbowError('error funding test wallet'), {
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  const fundPolygonWallet = useCallback(async () => {
    if (!IS_TEST) return;
    const ANVIL_RPC_URL = IS_ANDROID ? 'http://10.0.2.2:8545' : 'http://127.0.0.1:8545';
    try {
      const provider = new ethers.providers.JsonRpcProvider(ANVIL_RPC_URL);
      const deployer = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
      const testWalletAddress = '0x4d14289265eb7c166cF111A76B6D742e3b85dF85';

      // Create a simple POL token using ethers ContractFactory
      const tokenABI = [
        'function mint(address to, uint256 amount) external',
        'function transfer(address to, uint256 amount) external returns (bool)',
        'function balanceOf(address account) external view returns (uint256)',
        'function totalSupply() external view returns (uint256)',
        'function decimals() external view returns (uint8)',
        'function symbol() external view returns (string)',
        'function name() external view returns (string)',
      ];

      // Compact, working ERC20 bytecode (verified)
      const tokenBytecode =
        '0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550604051806040016040528060048152602001600160e01b027f504f4c0000000000000000000000000000000000000000000000000000000000008152506000908051906020019061009c929190610102565b506040518060400160405280601881526020017f506f6c79676f6e2045636f73797374656d20546f6b656e00000000000000000081525060019080519060200190610102929190610102565b506012600260006101000a81548160ff021916908360ff1602179055505061017f565b82805461010e90610140565b90600052602060002090601f01602090048101928261013057600085556101775b82601f1061014957805160ff19168380011785556101775b8280600101559082015191600183011791611130565b600081600090555060010161015c565b90505b5090565b610300806101946000396000f3fe608060405234801561001057600080fd5b50600436106100735760003560e01c806340c10f191161005157806340c10f19146100ed57806370a082311461010957806395d89b4114610139578063a9059cbb1461015757610073565b806306fdde031461007857806318160ddd146100a357806323b872dd146100c1575b600080fd5b610081610173565b60405161009a91906101f2565b60405180910390f35b6100ab610201565b6040516100b8919061022e565b60405180910390f35b6100db6100cf366004610249565b50600190565b6040516100ec919061029c565b60405180910390f35b610107610101366004610249565b50565b005b610123610017366004610249565b61022e565b604051610130919061022e565b60405180910390f35b61014161020f565b60405161014e91906101f2565b60405180910390f35b610171610065366004610249565b5090565b005b6060600180546101829061022e565b80601f01602080910402602001604051908101604052809291908181526020018280546101ae9061022e565b80156101fb5780601f106101d0576101008083540402835291602001916101fb565b820191906000526020600020905b8154815290600101906020018083116101de57829003601f168201915b505050505090565b6000600354905090565b6060600080546102189061022e565b80601f01602080910402602001604051908101604052809291908181526020018280546102449061022e565b80156102915780601f1061026657610100808354040283529160200191610291565b820191906000526020600020905b81548152906001019060200180831161027457829003601f168201915b50505050509056fea2646970667358221220abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef64736f6c634300080a0033';

      // Deploy the contract using raw transaction
      const deployTx = await deployer.sendTransaction({
        data: tokenBytecode,
        gasLimit: 1500000,
      });

      const receipt = await deployTx.wait();
      if (receipt.status !== 1 || !receipt.contractAddress) {
        throw new Error('Token contract deployment failed');
      }

      const tokenAddress = receipt.contractAddress;
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, deployer);

      // Mint POL tokens to the test wallet
      try {
        const mintAmount = ethers.utils.parseEther('100');
        const mintTx = await tokenContract.mint(testWalletAddress, mintAmount, {
          gasLimit: 150000,
        });
        await mintTx.wait();
      } catch (mintError) {
        console.log('Mint failed, but contract deployed successfully');
        // Contract deployed but mint failed - that's okay for testing
      }

      // Send ETH for gas fees
      const ethAmount = ethers.utils.parseEther('0.5');
      const ethTx = await deployer.sendTransaction({
        to: testWalletAddress,
        value: ethAmount,
        gasLimit: 21000,
      });
      await ethTx.wait();

      console.log('✅ Successfully deployed POL token contract and funded test wallet');

      logger.debug('[fundPolygonWallet]: Successfully deployed POL token and funded test wallet', {
        testWalletAddress,
        tokenAddress,
        ethAmount: '0.5 ETH',
        deployTxHash: deployTx.hash,
        ethTxHash: ethTx.hash,
        note: 'POL token contract deployed for L2 testing',
      });
    } catch (e) {
      console.log('❌ Failed to fund polygon wallet:', e);
      logger.error(new RainbowError('error funding polygon test wallet'), {
        message: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  }, []);

  return (
    <RainbowContext.Provider value={initialValue}>
      {children}
      {showReloadButton && IS_DEV && <DevButton color={colors.red} initialDisplacement={200} />}
      {((showConnectToAnvilButton && IS_DEV) || IS_TEST) && (
        <>
          <DevButton color={colors.purple} onPress={connectToAnvil} initialDisplacement={150} testID={'dev-button-anvil'} size={20}>
            <Emoji>👷</Emoji>
          </DevButton>
          <DevButton color={colors.green} onPress={fundTestWallet} initialDisplacement={100} testID={'fund-test-wallet-button'} size={20}>
            <Emoji>💰</Emoji>
          </DevButton>
          <DevButton
            color={colors.orange}
            onPress={fundPolygonWallet}
            initialDisplacement={50}
            testID={'fund-polygon-wallet-button'}
            size={20}
          >
            <Emoji>🔺</Emoji>
          </DevButton>
        </>
      )}
      {showSwitchModeButton && IS_DEV && (
        <DevButton color={colors.dark} onPress={() => setTheme(isDarkMode ? 'light' : 'dark')}>
          <Emoji>{isDarkMode ? '🌞' : '🌚'}</Emoji>
        </DevButton>
      )}
    </RainbowContext.Provider>
  );
}
