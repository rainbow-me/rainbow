require('@nomiclabs/hardhat-waffle');

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      chainId: 1,
      initialBaseFeePerGas: 100000000, // 0.1 gwei
    },
  },
  solidity: '0.8.4',
};
