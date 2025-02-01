import { ethers } from "hardhat";

async function main() {
    
    let mailbox = "0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766"; // sepolia

    const pingpong = await ethers.deployContract("PingPong", [mailbox], {
    });

    await pingpong.waitForDeployment();

    console.log(
        `Ping Pong deployed to ${pingpong.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});