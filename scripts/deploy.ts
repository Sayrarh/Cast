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

  //////////////////DEPLOYING CAST CONTRACT///////////////////
  const CastContract = await ethers.getContractFactory("Cast");
  const cast = await CastContract.deploy();
  await cast.deployed();
  console.log(`Cast contract is deployed to ${cast.address}`);


  ////////////////DEPLOYING MINIMAL PROXY FACTORY///////////////
  const MinimalProxy = await ethers.getContractFactory("MinimalProxyFactory");
  const minimalProxy = await MinimalProxy.deploy();

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