// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface MLOOT {
    function balanceOf(address owner) external view returns (uint256 balance);
}

contract Cast {
    //////////////////////EVENTS/////////////////////////////
    event RegistrationEvent(address indexed contender);
    event CastEvent(address indexed user);

    ////////////////////STATE VARIABLES///////////////////////
    address MLOOTAddr = 0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF;
    uint32 castDuration;
    uint16 castID = 1;
    bool initializeState;

    address admin;
    uint32 regDuration; //duration time open for contenders to sign up
    mapping(address => bool) hasVoted;
    mapping(address => bool) hasRegistered;

    address upcomingAdmin;

    bytes32 rootHash = 0xf3479c7335f169adbf330622ca8a11b3befa654cf27a40ae851a22347e6fe232;

   
    address[] private voters;
    address[] contenders;

    struct ContenderData {
        address contenderAddr;
        uint16 castCount;
    }

    mapping(uint16 => ContenderData) _contenderInfo;

    //////////////////////////ERRORS//////////////////////////
    error NotWhitelisted();
    error Voted();
    error Registered(string);
    error NotUpcomingAdmin();

    constructor() {
        admin = msg.sender;
    }

    /// @notice this function would be setting the merkle root and all that is needed for validation
    function setCast(
        bytes32 root,
        uint32 _castDuration,
        uint32 _regDuration
    ) external {
        onlyAdmin();
        require(!initializeState, "Cast ongoing");
        rootHash = root;
        castDuration = uint32(block.timestamp + (_castDuration * (1 days)));
        regDuration = uint32(block.timestamp + (_regDuration * (1 days)));
        initializeState = true;
    }

    /// @notice function to check if a user is whitelisted
    function isWhitelisted(
        bytes32[] memory proof,
        bytes32 leaf
    ) internal view returns (bool) {
        return MerkleProof.verify(proof, rootHash, leaf);
    }

    /// @notice This is the function responsible for registering contenders
    // contender must possess MLOOT NFT to be eligible

    function registration(bytes32[] memory proof) external returns (uint16) {
        require(initializeState == true, "State not initialized");
        //check if msg.sender is whitelisted
      
        require(block.timestamp <= regDuration, "Registration Closed");
        require(
            MLOOT(MLOOTAddr).balanceOf(msg.sender) > 0,
            "Insufficient balance"
        );
        
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));

        bool prove = isWhitelisted(proof, leaf);
        if (!prove) {
            revert NotWhitelisted();
        }

        ContenderData storage CD = _contenderInfo[castID];
        if (hasRegistered[msg.sender] == true) {
            revert Registered("Can't register twice");
        }

        CD.contenderAddr = msg.sender;
        contenders.push(msg.sender);
        uint16 currentCastID = castID;
        hasRegistered[msg.sender] = true;
        castID = castID + 1;

        emit RegistrationEvent(msg.sender);
        return currentCastID;
    }

    /// @notice this function is used to cast vote for contenders
    function castVote(uint16 _contenderID) external {
        require(block.timestamp > regDuration, "Cont. Reg ongoing");
        require(block.timestamp <= castDuration, "Cast ended");
        require(
            _contenderID > 0 && _contenderID <= castID,
            "Invalid contender ID"
        );

        ContenderData storage CD = _contenderInfo[_contenderID];

        if (hasVoted[msg.sender] == true) {
            revert Voted();
        }
        CD.castCount = CD.castCount + 1;

        hasVoted[msg.sender] = true;
        voters.push(msg.sender);

        emit CastEvent(msg.sender);
    }


    /// @notice this function is used to reveal the winner
    // only admin can reveal winner after cast duration has elapsed
    function revealCastWinner() external returns(address) {
        onlyAdmin();
        require(block.timestamp >= castDuration, "Not time");
        require(
            contenders.length > 0 && voters.length > 0,
            "No contenders or voters"
        );

        // Find the contender with the highest number of votes
        uint16 winnerID;
        uint16 maxVotes;

        for (uint16 i = 1; i < castID; i++) {
            ContenderData storage CD = _contenderInfo[i];
            if (CD.castCount > maxVotes) {
                winnerID = i;
                maxVotes = CD.castCount;
            }
        }

        // Make sure there is at least one vote cast
        require(maxVotes > 0, "No votes cast");
        address winnerAddr = _contenderInfo[winnerID].contenderAddr;

        // // Reset all state variables
        // initializeState = false;
        // regDuration = 0;
        // castDuration = 0;
        // rootHash = 0;
        // castID = 1;
        // contenders = new address[](0);
        // voters = new address[](0);
        
        // for (uint i = 0; i < voters.length; i++) {
        //     hasVoted[voters[i]] = false;
        // }

        emit CastEvent(winnerAddr);
        return winnerAddr;
    }

    ///@dev This function is used to assign upcoming admin role
    // to avoid accidentally transferring ownership to the wrong address
    function setUpcomingAdmin(address newUpcomingAdmin) external {
        onlyAdmin();
        upcomingAdmin = newUpcomingAdmin;
    }

    /// @dev UpcomingAdmin uses this function to accept the admin role
    function acceptAdministration() external {
        if (msg.sender != upcomingAdmin) {
            revert NotUpcomingAdmin();
        }
        admin = upcomingAdmin;

        upcomingAdmin = address(0); //update
    }

    //return total vote for each contender
    function contenderCastCount(uint16 ID) external view returns (uint16) {
        ContenderData storage CD = _contenderInfo[ID];
        return CD.castCount;
    }

    // @dev function returns cast count of a particular contender
    function getContenderCastCount(uint16 _id) external view returns (uint16) {
        ContenderData storage cd = _contenderInfo[_id];
        return cd.castCount;
    }

    //return total vote count
    function totalCastCount() external view returns (uint16) {
        return uint16(voters.length);
    }

    /// @dev function return all contenders
    function allContenders() external view returns (address[] memory) {
        return contenders;
    }

    /// @dev function to return all voters
    function allVoters() external view returns (address[] memory) {
        return voters;
    }

    /// @dev This is a private function used to allow only an admin call a function
    function onlyAdmin() private view {
        require(msg.sender == admin, "Not admin");
    }

}
