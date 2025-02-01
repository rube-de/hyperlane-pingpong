import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-switch-network";
// import "dotenv/config"
import "./tasks"

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    'sepolia': {
      url: 'https://ethereum-sepolia-rpc.publicnode.com',
      // url: 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
      // url: `https://rpc.ankr.com/eth/eth_sepolia`,
      chainId: 11155111,
      accounts,
    },
    'arbitrumsepolia': {
      url: 'https://arbitrum-sepolia-rpc.publicnode.com',
      chainId: 421614,
      accounts,
    },
    'sapphire-testnet': {
      // This is Testnet! If you want Mainnet, add a new network config item.
      url: "https://testnet.sapphire.oasis.io",
      accounts,
      chainId: 23295, // 0x5aff
    },
  }
};

export default config;
