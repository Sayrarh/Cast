// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.4;

interface ICast{
    function initialize(
        bytes32 root,
        uint32 _castDuration,
        uint32 _regDuration,
        string memory _title,
        address _admin
    ) external ;
}