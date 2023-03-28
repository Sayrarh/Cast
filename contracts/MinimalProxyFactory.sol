// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;
import "./ICast.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";


contract MinimalProxyFactory{
    event CloneCreated();

    mapping(uint64 => address) public cloneAddresses;

    address implementation;
    uint64 contractIndex = 1;


    // setting the implementation contract address
    constructor(address _implementation) {
        implementation = _implementation;
    }


    function createClone(
        bytes32 root,
        uint32 _castDuration,
        uint32 _regDuration,
        string memory _title,
        address _admin
    ) external returns(address){
        bytes32 salt = keccak256(abi.encodePacked(block.timestamp, contractIndex));
        address proxy = Clones.cloneDeterministic(implementation, salt);
        ICast(proxy).initialize(root, _castDuration, _regDuration, _title, _admin);


        cloneAddresses[contractIndex] = proxy;

        contractIndex++;

        emit CloneCreated();

        return proxy;
    }

    function returnClonedContractLength() external view returns(uint64) {
        return contractIndex;
    }
}