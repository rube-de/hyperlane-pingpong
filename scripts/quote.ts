import { ethers } from "hardhat";

async function main() {
    
  let pingAddr = "0x474b4c56E11F60a6e66E830929403F7fAD7c8C49";
  let pongAddr = "0x798f05e3978bcA0d528665F3e1dA1852b0CC3eba";
  // let hostId = 11155111;
  let hostId = 421614;
  let enclaveId = 23295;
  let message = "hello";


  const signer = await ethers.provider.getSigner();
  console.log(`quote on on sapphire...`);
  const pong = await ethers.getContractAt("Ping", pongAddr, signer);
  let fee = await pong.quoteDispatch(
    hostId,
    ethers.toUtf8Bytes(message));
  console.log(`quoted fee:${fee}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});