import {ethers} from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const merkle = require("../gen_files/MerkleProof.json");
const userDetails = require("../gen_files/Whitelist.json");


async function main(){
    //Minimal Proxy Factory is deployed to 0x9b86eF8Df1f4A49333520a8CFe6DA6890ec58da4
    //Here is the Cloned Address 0xB1f4Aa2e43C361e47B59D60AbFE63ADC88661470
    const CastAddress = "0xAe0bD3911cA827ACb4F6Ada31F2AEf2d3a01cDFB";
    const rootHash = "0xf3479c7335f169adbf330622ca8a11b3befa654cf27a40ae851a22347e6fe232";

    const [owner, otherAccounts, acc1, acc2, acc3, acc4, acc5, acc6, acc7, acc8, acc9, acc10] = await ethers.getSigners();
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

    const AdminAddr = "0x637CcDeBB20f849C0AA1654DEe62B552a058EA87";
    const UpcomingAdmin = "0xAEB9219D416D28f2EADB0A6C414E2776Fd9CD879";
    const user = "0xfb9Aa24caF3b9fb9F758347AC2496157EA683BE7";
    
    const claimer = Object.keys(userDetails)[1]
    const proof = merkle[claimer].proof;

    const Cast = await ethers.getContractAt("Cast", CastAddress);

    // //try initializing the contract
    // const InitializeContract = await Cast.initialize(rootHash, 300, 150, "President", AdminAddr);
    // const initializeTxnReceipt = await InitializeContract.wait();

    // console.log("Contract Initialization receipt", initializeTxnReceipt);


    // //check if state has been initialized
    // const state = await Cast.initializeState();
    // console.log("Contract Initial State is", state );


    // // //contender registration process
    // // const ContenderRegistration = await Cast.connect(impersonatedSigner).contenderRegistration(proof);
    // // const contenderTxnReceipt = await ContenderRegistration.wait();

    // // console.log("Registration process:", contenderTxnReceipt);


    // // // casting vote 
    // // const VoteCast = await Cast.castVote(1);
    // // const castTxnReceipt = await VoteCast.wait();

    // // console.log("Registration process:", castTxnReceipt);


    // // //End Cast Session
    // // const endCast = await Cast.endCastSession();
    // // const endTxnReceipt = await endCast.wait();

    // // console.log("End Cast Session", endTxnReceipt);


    // //Change admin
    // const AdminChange = await Cast.setUpcomingAdmin(UpcomingAdmin);
    // const adminChangeTxnReceipt = await AdminChange.wait();

    // console.log("Setting up Upcoming Admin Address", adminChangeTxnReceipt);

    // //Upcoming admin to accept administration
    // const AcceptAdmin = await Cast.acceptAdministration();
    // const adminTxnReceipt = await AcceptAdmin.wait();

    // console.log("Accept Administration", adminTxnReceipt);


    // //Check Admin
    // const Admin = await Cast.admin();
    // console.log("Admin is", Admin);


    // //Check Registration duration
    // const regDuration = await Cast.regDuration();
    // console.log("Contender Registration duration is", regDuration);


    //  //Check Registration duration
    //  const castDuration = await Cast.castDuration();
    //  console.log("Voting duration is", castDuration);


    //  //Get contender's cast details
    //  const ContenderDetails = await Cast.contenderDetails(1);
    //  console.log("Contender Information is", ContenderDetails);


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });