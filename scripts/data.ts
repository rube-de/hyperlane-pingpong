import { ethers } from "hardhat";

async function main() {
    
  let pingAddr = "0x474b4c56E11F60a6e66E830929403F7fAD7c8C49";
  let pongAddr = "0x798f05e3978bcA0d528665F3e1dA1852b0CC3eba";
    // let hostId = 11155111;
    let hostId = 421614;
    let enclaveId = 23295;


    const signer = await ethers.provider.getSigner();
    // console.log(`get remote router on sapphire...`);
    // const pong = await ethers.getContractAt("Ping", pongAddr, signer);
    // const router = await pong.routers(hostId);
    // console.log(`remote router adr for ${hostId}: ${router}`);
    // await pong.enrollRemoteRouter(hostId, ethers.zeroPadValue(pingAddr, 32));
    console.log(`get remote router on sepolia...`);
    const ping = await ethers.getContractAt("Ping", pingAddr, signer);
    const router = await ping.routers(enclaveId);
    console.log(`remote router adr for ${enclaveId}: ${router}`);
    // await ping.enrollRemoteRouter(enclaveId, ethers.zeroPadValue(pongAddr, 32));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});