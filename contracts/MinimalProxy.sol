// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./ICast.sol";

contract MinimalProxy{
    event CloneCreated();

    mapping(uint64 => address) cloneAddresses;
    uint64 public contractIndex = 1;

    function deployClone(
        address _implementationContract,
        bytes32 root,
        uint32 _castDuration,
        uint32 _regDuration,
        string memory _title,
        address _admin
    ) external returns (address) {
        // convert the address to 20 bytes
        bytes20 implementationContractInBytes = bytes20(
            _implementationContract
        );
        
        //address to assign cloned proxy
        address proxy;

        // as stated earlier, the minimal proxy has this bytecode
        // <3d602d80600a3d3981f3363d3d373d3d3d363d73><address of implementation contract><5af43d82803e903d91602b57fd5bf3>

        // <3d602d80600a3d3981f3> == creation code which copy runtime code into memory and deploy it

        // <363d3d373d3d3d363d73> <address of implementation contract> <5af43d82803e903d91602b57fd5bf3> == runtime code that makes a delegatecall to the implentation contract

        assembly {
            /*
            reads the 32 bytes of memory starting at pointer stored in 0x40
            In solidity, the 0x40 slot in memory is special: it contains the "free memory pointer"
            which points to the end of the currently allocated memory.
            */
            let clone := mload(0x40)
            // store 32 bytes to memory starting at "clone"
            mstore(
                clone,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )

            /*
              |              20 bytes                |
            0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
                                                      ^
                                                      pointer
            */
            // store 32 bytes to memory starting at "clone" + 20 bytes
            // 0x14 = 20
            mstore(add(clone, 0x14), implementationContractInBytes)

            /*
              |               20 bytes               |                 20 bytes              |
            0x3d602d80600a3d3981f3363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe
                                                                                              ^
                                                                                              pointer
            */
            // store 32 bytes to memory starting at "clone" + 40 bytes
            // 0x28 = 40
            mstore(
                add(clone, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )

            /*
            |                 20 bytes                  |          20 bytes          |           15 bytes          |
            0x3d602d80600a3d3981f3363d3d373d3d3d363d73b<implementationContractInBytes>5af43d82803e903d91602b57fd5bf3 == 45 bytes in total
            */

            // create a new contract
            // send 0 Ether
            // code starts at pointer stored in "clone"
            // code size == 0x37 (55 bytes)
            proxy := create(0, clone, 0x37)
        }
        ICast(proxy).initialize(root, _castDuration, _regDuration, _title, _admin);

        cloneAddresses[contractIndex] = proxy;

        contractIndex++;

        emit CloneCreated();
        return proxy;
    }

    function getCloneAddress(uint32 _index) external view returns(address cloneAddress__) {
        cloneAddress__ = cloneAddresses[_index];
    }

    function getCurrentIndex() external view returns(uint64) {
        return contractIndex;
    }

    // Check if an address is a clone of a particular contract address
    function isClone(address _implementationContract, address query) external view returns (bool result) {
        bytes20 implementationContractInBytes = bytes20(_implementationContract);
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x363d3d373d3d3d363d7300000000000000000000000000000000000000000000)
            mstore(add(clone, 0xa), implementationContractInBytes)
            mstore(add(clone, 0x1e), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)

            let other := add(clone, 0x40)
            extcodecopy(query, other, 0, 0x2d)
            result := and(
            eq(mload(clone), mload(other)),
            eq(mload(add(clone, 0xd)), mload(add(other, 0xd)))
        )
    }
  }
}