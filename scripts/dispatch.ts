import { ethers } from "hardhat";

async function main() {
    
  let pingAddr = "0x18093D22421579b032a1aDb00921DA4453D8C873";
  let pongAddr = "0xc9Bb46C8f655E8781046f67963dE77e9C038Fc11";
  let mailboxAddr = "0x8cd4D8103B5962dCA62E4c05C28F78D7Ae5147aF";
  let hookAddr = ethers.ZeroAddress;
  // let hookAddr = "0x983F1219F9828D24CC263d7Ee17991C25AabAEb3"
  // let hostId = 11155111;
  let hostId = 421614;
  let enclaveId = 23295;
  let message = "hello";


  const signer = await ethers.provider.getSigner();
  console.log(`dispatch on on sapphire...`);
  const mailbox = await ethers.getContractAt("Mailbox", mailboxAddr, signer);
  let dispatch = await mailbox["dispatch(uint32,bytes32,bytes,bytes,address)"](
    hostId,
    ethers.zeroPadValue(pingAddr, 32),
    ethers.toUtf8Bytes(message),
    ethers.toUtf8Bytes(""),
    hookAddr,
    // {value: ethers.parseEther("0.001")}
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