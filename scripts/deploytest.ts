import { ethers } from "hardhat";

async function main() {
    
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  const TestRecipient = await ethers.getContractFactory("TestRecipient");
  const testRecipient = await TestRecipient.deploy();
  await testRecipient.waitForDeployment();

  console.log(`TestRecipient deployed at: ${testRecipient.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});