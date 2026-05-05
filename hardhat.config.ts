import { defineConfig } from "hardhat/config";
import dotenv from "dotenv";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";

dotenv.config();

const { API_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;

export default defineConfig({
  plugins: [hardhatEthers, hardhatVerify],
  solidity: {
    version: "0.8.28",
  },
  networks: {
    sepolia: {
      type: "http",
      url: API_URL!,
      accounts: [`0x${PRIVATE_KEY!}`],
    }
  },
  verify: {
    etherscan: {
      apiKey: ETHERSCAN_API_KEY!,
    }
  },
});
