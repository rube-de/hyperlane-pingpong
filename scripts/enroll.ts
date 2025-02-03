import { ethers } from "hardhat";

async function main() {
    
  let pingAddr = "0x18093D22421579b032a1aDb00921DA4453D8C873";
  let pongAddr = "0xc9Bb46C8f655E8781046f67963dE77e9C038Fc11";
    // let pingAddr = "0x060BCB34A68805021901f05830234e6327E49BC7";
    let hostId = "421614";
    // let hostId = "11155111";
    let enclaveId = "23295";


    const signer = await ethers.provider.getSigner();
    console.log(`Enroll on sapphire...`);
    const pong = await ethers.getContractAt("Ping", pongAddr, signer);
    await pong.enrollRemoteRouter(hostId, ethers.zeroPadValue(pingAddr, 32));
    const pingRouter = await pong.routers(hostId);
    console.log(`remote router adr for ${hostId}: ${pingRouter}`);
    // console.log(`Enroll on sepolia...`);
    // const ping = await ethers.getContractAt("Ping", pingAddr, signer);
    // await ping.enrollRemoteRouter(enclaveId, ethers.zeroPadValue(pongAddr, 32));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});