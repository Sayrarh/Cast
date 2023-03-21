// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;
import "./ICast.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";


contract MinimalProxyFactory{
    mapping(uint256 => address) public cloneAddresses;

    address implementation;
    uint256 contract_index;

    // setting implementation contract address
    constructor(address _implementation) {
        implementation = _implementation;
    }

    event Created();

    function create(
        bytes32 root,
        uint32 _castDuration,
        uint32 _regDuration,
        string memory _title,
        address _admin
    ) public {
        bytes32 salt = keccak256(abi.encodePacked(block.timestamp, _title));
        address pair = Clones.cloneDeterministic(implementation, salt);
        ICast(pair).initialize(root, _castDuration, _regDuration, _title, _admin);
        emit Created();
    }

    function returnContractList() public view returns(uint256 ) {
        return contract_index;
    }
}