// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";
import "@hyperlane-xyz/core/contracts/interfaces/IMessageRecipient.sol";

contract PingPong is IMessageRecipient {
    address public mailbox;  // Hyperlane Mailbox contract address

    event MessageSent(uint32 destinationDomain, address recipient, string message);
    event MessageReceived(string message);

    constructor(address _mailbox) {
        mailbox = _mailbox;
    }

    function sendPing(uint32 _destinationDomain, address _recipient, string calldata _message) external payable {
        bytes memory payload = abi.encode(_message);
        
        // Convert recipient address to bytes32 format
        bytes32 recipient = bytes32(uint256(uint160(_recipient)));
        
        // Estimate gas fee for the interchain message
        uint256 quotedGasFee = IMailbox(mailbox).quoteDispatch(_destinationDomain, recipient, payload);

        require(msg.value >= quotedGasFee, "Insufficient gas fee provided");

        // Dispatch message using caller-provided funds
        IMailbox(mailbox).dispatch{value: msg.value}(
            _destinationDomain,
            recipient,
            payload
        );

        emit MessageSent(_destinationDomain, _recipient, _message);
    }

    function handle(
        uint32 /* _originDomain */,
        bytes32 _sender,
        bytes calldata _message
    ) external payable override {
        require(msg.sender == mailbox, "Unauthorized message sender");

        string memory receivedMessage = abi.decode(_message, (string));

        emit MessageReceived(receivedMessage);
    }

    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }
}
