import { ethers } from "hardhat";

async function main() {
    
  let pingAddr = "0x18093D22421579b032a1aDb00921DA4453D8C873";
  let pongAddr = "0xc9Bb46C8f655E8781046f67963dE77e9C038Fc11";
  let mailboxAddr = "0x598facE78a4302f11E3de0bee1894Da0b2Cb71F8";
  let hookAddr = ethers.ZeroAddress;
  let ismAddr = "";
  // let hostId = 11155111;
  let hostId = 421614;
  let enclaveId = 23295;
  let message = "hello";


  const signer = await ethers.provider.getSigner();
  console.log(`set ISM on on arb...`);

  const ping = await ethers.getContractAt("Ping", pingAddr, signer);
  const ownerdr = await ping.owner();
  console.log(`owner: ${ownerdr}`);
  const ism = await ping.interchainSecurityModule();
  console.log(`ism set to: ${ism}`);

  // let fee = await mailbox["quoteDispatch(uint32,bytes32,bytes)"](
  //   hostId,
  //   ethers.encodeBytes32String(message),
  //   ethers.getBytes(hookAddr)
  // );
  console.log(`ism set`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});