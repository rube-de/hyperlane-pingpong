import { ethers } from "hardhat";

async function main() {
    
  let pingAddr = "0x474b4c56E11F60a6e66E830929403F7fAD7c8C49";
  let pongAddr = "0x798f05e3978bcA0d528665F3e1dA1852b0CC3eba";
  let mailboxAddr = "0x598facE78a4302f11E3de0bee1894Da0b2Cb71F8";
  let hookAddr = ethers.ZeroAddress;
  // let hostId = 11155111;
  let hostId = 421614;
  let enclaveId = 23295;
  let message = "hello";


  const signer = await ethers.provider.getSigner();
  console.log(`dispatch on on arb...`);
  const mailbox = await ethers.getContractAt("Mailbox", mailboxAddr, signer);
  let dispatch = await mailbox["dispatch(uint32,bytes32,bytes,bytes,address)"](
    enclaveId,
    ethers.zeroPadValue(pongAddr, 32),
    ethers.toUtf8Bytes(message),
    ethers.toUtf8Bytes(""),
    hookAddr, 
  {value: ethers.parseEther("0.00001")}
  )
  // let fee = await mailbox["quoteDispatch(uint32,bytes32,bytes)"](
  //   hostId,
  //   ethers.encodeBytes32String(message),
  //   ethers.getBytes(hookAddr)
  // );
  console.log(`dispatched`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});