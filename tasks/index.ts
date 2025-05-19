import { task, subtask } from "hardhat/config";
import { assert } from "console";

task("full-ping")
  .addOptionalParam("message", "The message that should be bridged", "Hello OPL")
  .addOptionalParam("hostNetwork", "Network to deploy the Host contract on", "arbitrumsepolia")
  .addOptionalParam("hostChainId", "Network to send ping from", "421614")
  .addOptionalParam("enclaveNetwork", "Network to deploy the Enclave contract on", "sapphire-testnet")
  .addOptionalParam("enclaveChainId", "Network to send ping to", "23295")
  .addOptionalParam("pingMailbox", "Messagebox contract address", "0x598facE78a4302f11E3de0bee1894Da0b2Cb71F8")
  .addOptionalParam("pongMailbox", "Messagebox contract address", "0x79d3ECb26619B968A68CE9337DfE016aeA471435")
  .setAction(async ({message, hostNetwork, hostChainId, enclaveNetwork, enclaveChainId, pingMailbox, pongMailbox}, hre) => {
    // Ensure contracts are compiled before proceeding
    await hre.run('compile');

    await hre.switchNetwork(hostNetwork);
    const deployerAddr = (await hre.ethers.provider.getSigner()).address
    const ism = await hre.run("deploy-ism", {
      trustedRelayer: deployerAddr,
      mailboxAddr: pingMailbox
    });
    console.log("===========================");
    const { pingAddr, pongAddr } = await hre.run("deploy-pingpong", {
      pingNetwork: hostNetwork,
      pingMailbox,
      pongNetwork: enclaveNetwork,
      pongMailbox,
      ismAddr: ism
    });
    console.log("===========================");
    await hre.run("enroll-routers", {
        pingAddr,
        pongAddr,
        hostNetwork,
        hostChainId,
        enclaveNetwork,
        enclaveChainId
    });
    // sending from host to sapphire
    console.log("===========================");
    await hre.run("send-ping", {
      pingAddr,
      message,
      sourceNetwork: hostNetwork,
      destChainId: enclaveChainId
    });
    console.log("===========================");
    await hre.run("verify-ping", {
      contractAddr: pongAddr,
      message,
      receiveNetwork: enclaveNetwork
    });
    // seting from sapphire back to host
    console.log("===========================");
    await hre.run("send-pong", {
      pongAddr,
      message,
      sourceNetwork: enclaveNetwork,
      destChainId: hostChainId
    });
    console.log("===========================");
    await hre.run("verify-ping", {
      contractAddr: pongAddr,
      message,
      receiveNetwork: hostNetwork
    });
})

subtask('deploy-ism')
  .addParam("trustedRelayer", "The address the relayer is run on")
  .addOptionalParam("mailboxAddr", "The mailbox address of the network you deploy the ISM on", "0x598facE78a4302f11E3de0bee1894Da0b2Cb71F8") // arb sepolia
  .addOptionalParam("hostNetwork", "Network to deploy the ping contract on", "arbitrumsepolia")
  .setAction(async ({trustedRelayer, mailboxAddr, hostNetwork}, hre) => {
    await hre.switchNetwork(hostNetwork);
    console.log(`Deploying ISM on ${hre.network.name}...`);
    console.log(`Trusted Relayer Address: ${trustedRelayer}`);
    const trustedRelayerISM = await hre.ethers.deployContract("TrustedRelayerIsm", [mailboxAddr, trustedRelayer], {});
    await trustedRelayerISM.waitForDeployment();
    console.log(
      `TrustedRelayerISM deployed to ${trustedRelayerISM.target}`
  );
  return trustedRelayerISM.target;
})

task('deploy-pingpong')
  .addOptionalParam("pingNetwork", "Network to deploy the Ping contract on", "arbitrumsepolia")
  .addOptionalParam("pingMailbox", "Messagebox contract address", "0x598facE78a4302f11E3de0bee1894Da0b2Cb71F8")
  .addOptionalParam("pongNetwork", "Network to deploy the Pong contract on", "sapphire-testnet")
  .addOptionalParam("pongMailbox", "Messagebox contract address", "0x79d3ECb26619B968A68CE9337DfE016aeA471435")
  .addOptionalParam("ismAddr", "Custom ISM for the contract", "0x983F1219F9828D24CC263d7Ee17991C25AabAEb3")
  .setAction(async ({pingNetwork, pingMailbox, pongNetwork, pongMailbox, ismAddr}, hre) => {
    console.log("Start deployment of PingPong...");

    console.log("===========================");
    const pingAddr = await hre.run("deployPing", {
        pingNetwork,
        mailbox: pingMailbox,
        ismAddr
    });
    console.log("===========================");
    const pongAddr = await hre.run("deployPong", {
        pongNetwork,
        mailbox: pongMailbox,
    });
    return { pingAddr, pongAddr };
});

subtask("deployPing")
  .addParam("pingNetwork", "Network to deploy the Ping contract on", "arbitrumsepolia")
  .addOptionalParam("mailbox", "Mailbox contract address", "0x598facE78a4302f11E3de0bee1894Da0b2Cb71F8")
  .addOptionalParam("ismAddr", "Custom ISM for the contract", "0x983F1219F9828D24CC263d7Ee17991C25AabAEb3")
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
  .addOptionalParam("mailbox", "Mailbox contract address", "0x79d3ECb26619B968A68CE9337DfE016aeA471435")
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

task("enroll-routers")
  .addParam("pingAddr", "Address of the Ping contract")
  .addParam("pongAddr", "Address of the Pong contract")
  .addOptionalParam("hostNetwork", "Network to deploy the ping contract on", "arbitrumsepolia")
  .addOptionalParam("hostChainId", "Network ID of the ping contract on", "421614")
  .addOptionalParam("enclaveNetwork", "Network to deploy the pong contract on", "sapphire-testnet")
  .addOptionalParam("enclaveChainId", "Network ID of the pong contract on", "23295")
  .setAction(async ({pingAddr, pongAddr, hostNetwork, hostChainId, enclaveNetwork, enclaveChainId}, hre) => {
    // enroll on host
    await hre.run("enroll", {
      contractAddr: pingAddr,
      remoteAddr: pongAddr,
      enrollNetwork: hostNetwork,
      remoteId: enclaveChainId
    });

    // enroll on enclave
    await hre.run("enroll", {
      contractAddr: pongAddr,
      remoteAddr: pingAddr,
      enrollNetwork: enclaveNetwork,
      remoteId: hostChainId
    });
})

task("enroll")
  .addParam("contractAddr", "Address of the Ping contract")
  .addParam("remoteAddr", "Address of the remote Ping contract")
  .addOptionalParam("enrollNetwork", "Network where to enroll routern", "sapphire-testnet")
  .addOptionalParam("remoteId", "Network ID of remote router contract", "421614")
  .setAction(async ({contractAddr, remoteAddr, enrollNetwork, remoteId}, hre) => {
    await hre.switchNetwork(enrollNetwork);
    console.log(`Enroll Remoute Router on ${hre.network.name}...`);
    const signer = await hre.ethers.provider.getSigner();
    const ping = await hre.ethers.getContractAt("Ping", contractAddr, signer);
    await ping.enrollRemoteRouter(remoteId, hre.ethers.zeroPadValue(remoteAddr, 32));
    const pongRouter = await ping.routers(remoteId);
    console.log(`Remote router address for ${remoteId}: ${pongRouter}`);
})


task("send-ping")
  .addParam("pingAddr", "Address of the Ping contract")
  .addOptionalParam("message", "The message that should be bridged", "Hello from host")
  .addOptionalParam("sourceNetwork", "Network to send the message from", "arbitrumsepolia")
  .addOptionalParam("destChainId", "Network to send ping to", "23295")
  .setAction(async ({pingAddr, message, sourceNetwork, destChainId}, hre) => {
    await hre.switchNetwork(sourceNetwork);
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
  .addParam("pongAddr", "Address of the Pong contract")
  .addOptionalParam("message", "The message that should be bridged", "Hello from sapphire")
  .addOptionalParam("sourceNetwork", "Network from where to send the Pong on", "sapphire-testnet")
  .addOptionalParam("destChainId", "Network to send ping to", "421614")
  .setAction(async ({pongAddr, message, sourceNetwork, destChainId}, hre) => {
    await hre.switchNetwork(sourceNetwork);
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

task('verify-ping')
  .addParam('contractAddr', 'Address to verify message received')
  .addOptionalParam("message", "The message that should be bridged", "Hello OPL")
  .addOptionalParam("receiveNetwork", "Network to deploy the Enclave contract on", "sapphire-testnet")
  .setAction(async ({contractAddr, message, receiveNetwork}, hre) => {
    await hre.switchNetwork(receiveNetwork);
    console.log(`Verifying message on ${hre.network.name}...`);
    let events;
    const spinner = ['-', '\\', '|', '/'];
    let current = 0;

    // Spinner animation
    const interval = setInterval(() => {
        process.stdout.write(`\rListing for event... ${spinner[current]}`);
        current = (current + 1) % spinner.length;
    }, 150);

    const signer = await hre.ethers.provider.getSigner();
    const pong = await hre.ethers.getContractAt("Ping", contractAddr, signer);

    do {
      const block = await hre.ethers.provider.getBlockNumber();

      events = await pong.queryFilter('ReceivedPing', block - 10, 'latest');
      if (events.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 60 * 1000));
      }
    } while (events.length === 0);
    
    // Clear the spinner line
    clearInterval(interval);
    process.stdout.write(`\r`); 
    process.stdout.clearLine(0);

    const parsedEvent = pong.interface.parseLog(events[0]);
    // console.log(parsedEvent);
    const decoded = parsedEvent?.args?.message;
    console.log(`Message received with: ${decoded}`);
    assert(decoded == message);
});

export {};