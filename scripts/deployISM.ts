import { ethers } from "hardhat";

async function main() {
    
    // let mailbox = "0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766"; // sepolia
    let mailbox = "0x598facE78a4302f11E3de0bee1894Da0b2Cb71F8"; // arb sepolia
    let trustedRelayer = "0xD17a67Ba1AAEDB6AA9B9A0c7ffb1020c951630F0"

    const trustedRelayerISM = await ethers.deployContract("TrustedRelayerIsm", [mailbox, trustedRelayer], {});

    await trustedRelayerISM.waitForDeployment();

    console.log(
        `TrustedRelayerISM deployed to ${trustedRelayerISM.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});