import { task, subtask } from "hardhat/config";
import { assert } from "console";
import { hooks } from "../typechain-types/@hyperlane-xyz/core/contracts";

task('deploy-pingpong')
  // .addOptionalParam("pingNetwork", "Network to deploy the Ping contract on", "sepolia")
  // .addOptionalParam("pingMailbox", "Messagebox contract address", "0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766")
  .addOptionalParam("pingNetwork", "Network to deploy the Ping contract on", "arbitrumsepolia")
  .addOptionalParam("pingMailbox", "Messagebox contract address", "0x598facE78a4302f11E3de0bee1894Da0b2Cb71F8")
  .addOptionalParam("pongNetwork", "Network to deploy the Pong contract on", "sapphire-testnet")
  .addOptionalParam("pongMailbox", "Messagebox contract address", "0x8cd4D8103B5962dCA62E4c05C28F78D7Ae5147aF")
  .setAction(async ({pingNetwork, pingMailbox, pongNetwork, pongMailbox}, hre) => {
    // Ensure contracts are compiled before proceeding
    await hre.run('compile');
    console.log("Start deployment of PingPong...");

    console.log("===========================");
    const pingAddr = await hre.run("deployPing", {
        pingNetwork,
        mailbox: pingMailbox
    });
    console.log("===========================");
    const pongAddr = await hre.run("deployPong", {
        pongNetwork,
        mailbox: pongMailbox,
    });
    return { pingAddr, pongAddr };
});

subtask("deployPing")
  // .addParam("pingNetwork", "Network to deploy the Ping contract on", "sepolia")
  // .addParam("mailbox", "Mailbox contract address", "0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766")
  // .addParam("hook", "Hook for the contract eg IGP", "0x0000000000000000000000000000000000000000")
  .addParam("pingNetwork", "Network to deploy the Ping contract on", "arbitrumsepolia")
  .addParam("mailbox", "Mailbox contract address", "0x598facE78a4302f11E3de0bee1894Da0b2Cb71F8")
  .addParam("ismAddr", "Custom ISM for the contract", "0x983F1219F9828D24CC263d7Ee17991C25AabAEb3")
  .setAction(async ({pingNetwork, mailbox, ismAddr}, hre) => {
    await hre.switchNetwork(pingNetwork);
    console.log(`Deploying on ${hre.network.name}...`);
    const Ping = await hre.ethers.getContractFactory("Ping");    
    const ping = await Ping.deploy(mailbox);
    const pingAddr = await ping.waitForDeployment();
    console.log(`Ping deployed at: ${pingAddr.target}`);
    // set custom ISM
    console.log(`set custom ISM to: ${ismAddr}`);
    // const signer = await hre.ethers.provider.getSigner();
    // const ping = await hre.ethers.getContractAt("Ping", pingAddr, signer);
    await ping.setInterchainSecurityModule(ismAddr);
    
    return pingAddr.target;
})

subtask("deployPong")
  .addParam("pongNetwork", "Network to deploy the Pong contract on", "sapphire-testnet")
  .addParam("mailbox", "Mailbox contract address", "0x8cd4D8103B5962dCA62E4c05C28F78D7Ae5147aF")
  // .addParam("hook", "Hook for the contract", "0x0000000000000000000000000000000000000000")
  .addParam("ismAddr", "Custom ISM for Hook for the contract", "0x0000000000000000000000000000000000000000")
  .setAction(async ({pongNetwork, mailbox, ismAddr}, hre) => {
    await hre.switchNetwork(pongNetwork);
    console.log(`Deploying on ${hre.network.name}...`);
    const Pong = await hre.ethers.getContractFactory("Ping");
    const pong = await Pong.deploy(mailbox);
    const pongAddr = await pong.waitForDeployment();
    console.log(`Pong deployed at: ${pongAddr.target}`);
    return pongAddr.target;
})

task("enroll-router")
  .addParam("pingAddr", "Address of the Ping contract")
  .addParam("pongAddr", "Address of the Pong contract")
  // .addOptionalParam("hostNetwork", "Network to deploy the ping contract on", "sepolia")
  // .addOptionalParam("hostId", "Network ID of the ping contract on", "11155111")
  .addOptionalParam("hostNetwork", "Network to deploy the ping contract on", "arbitrumsepolia")
  .addOptionalParam("hostId", "Network ID of the ping contract on", "421614")
  .addOptionalParam("enclaveNetwork", "Network to deploy the pong contract on", "sapphire-testnet")
  .addOptionalParam("enclaveId", "Network ID of the pong contract on", "23295")
  .setAction(async ({pingAddr, pongAddr, hostNetwork, hostId, enclaveNetwork, enclaveId}, hre) => {
    await hre.switchNetwork(hostNetwork);
    console.log(`Enroll on ${hre.network.name}...`);
    const signer = await hre.ethers.provider.getSigner();
    const ping = await hre.ethers.getContractAt("Ping", pingAddr, signer);
    await ping.enrollRemoteRouter(enclaveId, hre.ethers.zeroPadValue(pongAddr, 32));
    const pongRouter = await ping.routers(enclaveId);
    console.log(`remote router adr for ${enclaveId}: ${pongRouter}`);

    await hre.switchNetwork(enclaveNetwork);
    console.log(`Enroll on ${hre.network.name}...`);
    const pong = await hre.ethers.getContractAt("Ping", pongAddr, signer);
    await pong.enrollRemoteRouter(hostId, hre.ethers.zeroPadValue(pingAddr, 32));
    const pingRouter = await pong.routers(hostId);
    console.log(`remote router adr for ${hostId}: ${pingRouter}`);
  })


task("send-ping")
  .addParam("pingAddr", "Address of the Ping contract")
  .addParam("pongAddr", "Address of the Pong contract")
  .addOptionalParam("message", "The message that should be bridged", "Hello from source")
  // .addOptionalParam("hostNetwork", "Network to deploy the Host contract on","sepolia")a
  .addOptionalParam("hostNetwork", "Network to deploy the Host contract on", "arbitrumsepolia")
  .addOptionalParam("destChainId", "Network to send ping to", "23295")
  .setAction(async ({pingAddr, pongAddr, message, hostNetwork, destChainId}, hre) => {
    await hre.switchNetwork(hostNetwork);
    console.log(`Sending message on ${hre.network.name}...`);
    const signer = await hre.ethers.provider.getSigner();
    const ping = await hre.ethers.getContractAt("Ping", pingAddr, signer);

    // get mailbox for pingpong
    const mailboxAddr = await ping.mailbox();
    console.log(`Mailbox address: ${mailboxAddr}`);
    //calc fee
    console.log("Calculating fee...");
    let fee = await ping.quoteDispatch(
        destChainId,
        hre.ethers.toUtf8Bytes(message));
    // fee = fee * 2n;
    // fee = hre.ethers.parseEther('0.00001');
    console.log(`Fee: ${hre.ethers.formatEther(fee)} ETH`);

    console.log("Sending message...");
    try {
      const result = await ping.sendPing(destChainId, message, {value: fee});
      await result.wait();
    } catch (error) {
        console.error(error);
    }
    console.log("Message sent");
})

task("send-pong")
  .addParam("pingAddr", "Address of the Ping contract")
  .addParam("pongAddr", "Address of the Pong contract")
  .addOptionalParam("message", "The message that should be bridged", "Hello from sapphire")
  .addOptionalParam("pongNetwork", "Network from where to send the Pong on", "sapphire-testnet")
  .addOptionalParam("destChainId", "Network to send ping to", "421614")
  .setAction(async ({pingAddr, pongAddr, message, pongNetwork, destChainId}, hre) => {
    await hre.switchNetwork(pongNetwork);
    console.log(`Sending message on ${hre.network.name}...`);
    const signer = await hre.ethers.provider.getSigner();
    const pong = await hre.ethers.getContractAt("Ping", pongAddr, signer);

    const mailbox = await pong.mailbox();
    console.log(`Mailbox address: ${mailbox}`);

    //calc fee
    console.log("Calculating fee...");
    let fee = hre.ethers.parseEther("0");
    try {
      fee = await pong.quoteDispatch(
          destChainId,
          hre.ethers.toUtf8Bytes(message));
      
    } catch (error) {
      console.log(error)
    }
    // fee = hre.ethers.parseEther('0.00001');
    console.log(`Fee: ${hre.ethers.formatEther(fee)} TEST`);

    console.log("Sending message...");
    try {
        const result = await pong.sendPing(destChainId, message);
        await result.wait();
    } catch (error) {
        console.error(error);
    }
    console.log("Message sent");
})