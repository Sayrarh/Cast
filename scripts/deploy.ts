import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const hre = require("hardhat");
const merkle = require("../gen_files/MerkleProof.json");
const userDetails = require("../gen_files/Whitelist.json")

async function main() {

  const claimer = Object.keys(userDetails)[1]

  const proof = merkle[claimer].proof;
  const merkleroot = userDetails["dropDetails"].merkleroot;

  console.log(claimer, proof);


  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [claimer]
  });

  const AdminAddr = 0x637CcDeBB20f849C0AA1654DEe62B552a058EA87;

  ////////////DEPLOYING THE IMPLEMENTATION CONTRACT/////////////
  const CastContract = await ethers.getContractFactory("Cast");
  const cast = await CastContract.deploy();
  await cast.deployed();
  console.log(`Cast contract is deployed to ${cast.address}`);


  ///////////////DEPLOYING MINIMAL PROXY FACTORY///////////////
  const MinimalProxyFactory = await ethers.getContractFactory("MinimalProxyFactory");
  const minimalProxy = await MinimalProxyFactory.deploy();

  await minimalProxy.deployed();

  console.log(`Minimal Proxy Factory is deployed to ${minimalProxy.address}`)

  //////////DEPLOYING A CLONE OF THE CAST CONTRACT/////////
  //call the createClone function on the Minimal factory contract and input the necessary parameters
  const rootHash = 0xf3479c7335f169adbf330622ca8a11b3befa654cf27a40ae851a22347e6fe232;
 
  const createCastClone = await minimalProxy.createClone(cast.address, rootHash, 100, 40, "President", AdminAddr);
  const castCloneTxn = createCastClone.wait();
  console.log("Clone Contract Transaction Receipt", castCloneTxn);

  //get address of the cloned cast contract
  const clonedAddress = await minimalProxy.cloneAddresses(1);
  console.log("Here is the Cloned Address", clonedAddress);

  //get the cloned cast contract length
  const allCastClones = await minimalProxy.returnClonedContractLength();
  console.log("Number of created cast clone contract is", allCastClones);

  const Proxy = await hre.ethers.getContractAt(
    "Cast",
    createCastClone
  );

  // const signer = await ethers.getSigner(claimer)
  // console.log("signer: ", signer.address)

  // await helpers.setBalance(signer.address, 100n ** 18n);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});