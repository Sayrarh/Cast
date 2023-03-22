import {ethers} from "hardhat";
const merkle = require("../gen_files/MerkleProof.json");
const userDetails = require("../gen_files/Whitelist.json")


async function main(){
    //Minimal Proxy Factory is deployed to 0xA1645A8D039D39AC1Ae9569b2D8B80C3e13D66f2
    const CastAddress = "0xaa7812Ce3576164E0E59379F652bE3a06DBebBAf";
    const rootHash = "0xf3479c7335f169adbf330622ca8a11b3befa654cf27a40ae851a22347e6fe232";

    const AdminAddr = "0x637CcDeBB20f849C0AA1654DEe62B552a058EA87";
    const UpcomingAdmin = "0x637CcDeBB20f849C0AA1654DEe62B552a058EA87";
    
    const claimer = Object.keys(userDetails)[1]
    const proof = merkle[claimer].proof;

    const Cast = await ethers.getContractAt("Cast", CastAddress);

    //try initializing the contract
    const InitializeContract = await Cast.initialize(rootHash, 300, 150, "President", AdminAddr);
    const initializeTxnReceipt = await InitializeContract.wait();

    console.log("Contract Initialization receipt", initializeTxnReceipt);

    //check if state has been initialized
    const state = await Cast.initializeState();
    console.log("Contract Initial State is", state );

    //contender registration process
    const ContenderRegistration = await Cast.contenderRegistration(proof);
    const contenderTxnReceipt = await ContenderRegistration.wait();

    console.log("Registration process:", contenderTxnReceipt);


    //casting vote 
    // const VoteCast = await Cast.castVote(1);
    // const castTxnReceipt = await VoteCast.wait();

    // console.log("Registration process:", castTxnReceipt);


    //End Cast Session
    const endCast = await Cast.endCastSession();
    const endTxnReceipt = await endCast.wait();

    console.log("End Cast Session", endTxnReceipt);


    //Change admin
    const AdminChange = await Cast.setUpcomingAdmin(UpcomingAdmin);
    const adminChangeTxnReceipt = await AdminChange.wait();

    console.log("Setting up Upcoming Admin Address", adminChangeTxnReceipt);

    //Upcoming admin to accept administration
    const AcceptAdmin = await Cast.acceptAdministration();
    const adminTxnReceipt = await AcceptAdmin.wait();

    console.log("Accept Administration", adminTxnReceipt);


    //Check Admin
    const Admin = await Cast.admin();
    console.log("Admin is", Admin);


    //Check Registration duration
    const regDuration = await Cast.regDuration();
    console.log("Contender Registration duration is", regDuration);


     //Check Registration duration
     const castDuration = await Cast.castDuration();
     console.log("Voting duration is", castDuration);


     //Get contender's cast details
     const ContenderDetails = await Cast.contenderDetails(1);
     console.log("Contender Information is", ContenderDetails);


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });