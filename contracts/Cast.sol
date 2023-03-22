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
    uint32 public castDuration;
    uint8 castID = 1;
    bool public initializeState;
 
    address admin;
    uint32 public regDuration; //duration time open for contenders to sign up
    string public title;
    mapping(address => bool) hasVoted;
    mapping(address => bool) hasRegistered;

    address upcomingAdmin;

    bytes32 rootHash;

   
    address[] private voters;
    address[] contenders;

    struct ContenderData {
        address contenderAddr;
        uint32 castCount;
    }

    mapping(uint8 => ContenderData) _contenderInfo;


    //////////////////////////ERRORS//////////////////////////
    
    error NotWhitelisted();
    error Voted();
    error Registration(string);
    error Registered(string);
    error NotUpcomingAdmin();
    error StateNotInitialised();
    error ContractAlreadyInitialized();
    error NotAdmin();
    error VoteEnded();
    error ContenderRegistrationClosed();
    error NotAnMLOOTHolder();
    error InvalidContenderID();
    error CastStillInProgress();
    error NoContenderOrVoters();
    error ContractNotInitialized();


    /// @notice this function would be setting the merkle root and all that is needed for validation
    function initialize(
        bytes32 root,
        uint32 _castDuration,
        uint32 _regDuration,
        string memory _title,
        address _admin
    ) external {
        if(initializeState == true){
            revert ContractAlreadyInitialized();
        }

        rootHash = root;
        admin = _admin;
        title = _title;
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

    function contenderRegistration(bytes32[] memory proof) external returns (uint8) {
        if(initializeState){
            revert StateNotInitialised(); 
        }
        
        if(block.timestamp > regDuration){
            revert ContenderRegistrationClosed();
        }

        if( MLOOT(MLOOTAddr).balanceOf(msg.sender) == 0){
            revert NotAnMLOOTHolder();
        }
        
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));

        bool prove = isWhitelisted(proof, leaf);
        //check if msg.sender is whitelisted
        if (!prove) {
            revert NotWhitelisted();
        }

        ContenderData storage CD = _contenderInfo[castID];
        if (hasRegistered[msg.sender] == true) {
            revert Registered("Can't register twice");
        }

        CD.contenderAddr = msg.sender;
        contenders.push(msg.sender);
        uint8 currentCastID = castID;
        hasRegistered[msg.sender] = true;
        castID = castID + 1;

        emit RegistrationEvent(msg.sender);
        return currentCastID;
    }

    /// @notice this function is used to cast vote for contenders
    function castVote(uint8 _contenderID) external {
        if(block.timestamp < regDuration){
            revert Registration("Contended Registration Ongoing");
        }

        if(block.timestamp > castDuration){
            revert VoteEnded();
        }

        if(_contenderID <= 0 && _contenderID > castID){
            revert InvalidContenderID();
        }

        if (hasVoted[msg.sender] == true) {
            revert Voted();
        }

        ContenderData storage CD = _contenderInfo[_contenderID];

        CD.castCount = CD.castCount + 1;

        hasVoted[msg.sender] = true;
        voters.push(msg.sender);

        emit CastEvent(msg.sender);
    }


    /// @notice this function is used to reveal the winner
    // only admin can reveal winner after cast duration has elapsed
    function endCastSession() external returns(ContenderData memory) {
        onlyAdmin();

        if(initializeState) {
            revert ContractNotInitialized();
        }

        if(block.timestamp < castDuration){
            revert CastStillInProgress();
        }
        
        if(contenders.length == 0 && voters.length == 0){
            revert NoContenderOrVoters();
        }
        
        // Find the contender with the highest number of votes
        uint8 winnerID;
        uint32 maxVotes;

        for (uint8 i = 1; i < castID; i++) {
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
        initializeState = false;
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
        return  ContenderData(winnerAddr, maxVotes);

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

    /// @dev function to return each contenders' cast details
    function contenderCastCount(uint8 ID) external view returns (ContenderData memory) {
        return _contenderInfo[ID];
    }

    /// @dev function to return platform total vote count
    function totalVoteCount() external view returns (uint32) {
        return uint32(voters.length);
    }

    /// @dev function to return all contenders
    function allContenders() external view returns (address[] memory) {
        return contenders;
    }

    /// @dev function to return all voters
    function allVoters() external view returns (address[] memory) {
        return voters;
    }

    /// @dev This is a private function used to allow only an admin call a function
    function onlyAdmin() private view {
        if(msg.sender != admin){
            revert NotAdmin();
        }
    }

}
