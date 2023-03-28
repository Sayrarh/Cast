import {ethers} from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const merkle = require("../gen_files/MerkleProof.json");
const userDetails = require("../gen_files/Whitelist.json");


async function main(){
  //Cast contract is deployed to 0xDcB8808Cd50FA71E0A4dDFbadc1A207e10422A0E
  //Minimal Proxy Factory is deployed to 0x720BEA2312428EE6E8b66547A7509aE866C9a83B
  //Cloned Address 0xe38AA22505dBA76450F4fD055C296A23a2Fdc0Da

    const CastAddress = "0x89372b32b8AF3F1272e2efb3088616318D2834cA";
    const rootHash = "0x9473131384768d56d700f0556811b9dae298090151cc14eeac5211a7811b1f2c";

    const [admin, UpcomingAdmin, acc1, acc2, acc3, acc4, acc5, acc6, acc7, acc8, acc9, acc10] = await ethers.getSigners();
    
    //Generating the addresses
    console.log(acc1.address);
    console.log(acc2.address);
    console.log(acc3.address);
    console.log(acc4.address);
    console.log(acc5.address);
    console.log(acc6.address);
    console.log(acc7.address);
    console.log(acc8.address);
    console.log(acc9.address);
    console.log(acc10.address);

    //Holder of More Loot NFT
    const contender1 = "0xf917D09402e9aeBEE8e11d27eB1eA4446A349c72";

    await helpers.impersonateAccount(contender1);
    const impersonatedSigner = await ethers.getSigner(contender1);


    
    const claimer = Object.keys(userDetails)[10]
    const proof = merkle[claimer].proof;

    const Cast = await ethers.getContractAt("Cast", CastAddress);

    const regDuration = Math.floor(Date.now() / 1000) + 60 * 1;
    const castDuration = Math.floor(Date.now() / 1000) + 60 * 2;


    //try initializing the contract
    const InitializeContract = await Cast.connect(admin).initialize(rootHash, castDuration, regDuration, "President", admin.address);
    const initializeTxnReceipt = await InitializeContract.wait();

    console.log("Contract Initialization receipt", initializeTxnReceipt);


    //check if state has been initialized
    const state = await Cast.initializeState();
    console.log("Contract Initial State is", state );


    //contender registration process
    const ContenderRegistration = await Cast.connect(impersonatedSigner).contenderRegistration(proof);
    const contenderTxnReceipt = await ContenderRegistration.wait();

    console.log("Registration process:", contenderTxnReceipt);


    // casting vote 
    const VoteCast = await Cast.connect(acc1).castVote(1);
    const castTxnReceipt = await VoteCast.wait();

    console.log("Registration process:", castTxnReceipt);


    //End Cast Session
    const endCast = await Cast.connect(admin).endCastSession();
    const endTxnReceipt = await endCast.wait();

    console.log("End Cast Session", endTxnReceipt);


    //Change admin
    const AdminChange = await Cast.connect(admin).setUpcomingAdmin(UpcomingAdmin.address);
    const adminChangeTxnReceipt = await AdminChange.wait();

    console.log("Setting up Upcoming Admin Address", adminChangeTxnReceipt);

    //Upcoming admin to accept administration
    const AcceptAdmin = await Cast.connect(UpcomingAdmin).acceptAdministration();
    const adminTxnReceipt = await AcceptAdmin.wait();

    console.log("Accept Administration", adminTxnReceipt);


    //Check Admin
    const Admin = await Cast.admin();
    console.log("Admin is", Admin);


    //Check Registration duration
    const contendRegDuration = await Cast.regDuration();
    console.log("Contender Registration duration is", contendRegDuration);


     //Check cast duration
     const votecastDuration = await Cast.castDuration();
     console.log("Voting duration is", votecastDuration);


     //Get contender's cast details
     const ContenderDetails = await Cast.contenderDetails(1);
     console.log("Contender Information is", ContenderDetails);


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });