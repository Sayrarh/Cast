import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { it } from "mocha";
import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");


describe("Cast", function () {
    async function deployCastFixture() {

        const randomContender = "0xf917D09402e9aeBEE8e11d27eB1eA4446A349c72";

        await helpers.impersonateAccount(randomContender);
        const impersonatedSigner = await ethers.getSigner(randomContender);


        // Contracts are deployed using the first signer/account by default
        const [admin, user, contender1, contender2, contender3, contender4, contender5, contender6, contender7, contender8, contender9, contender10, voter1, voter2, upcomingadmin] = await ethers.getSigners();

        //Merkle Tree
        let whitelistAddresses = [impersonatedSigner.address, contender1.address, contender2.address, contender3.address, contender4.address, contender5.address, contender6.address, contender7.address, contender8.address, contender9.address, contender10.address]

        const leafNodes = whitelistAddresses.map((contender) => keccak256(contender));
        const merkleTree = new MerkleTree(leafNodes, keccak256, {
            sortPairs: true,
        });

        const rootHash = merkleTree.getHexRoot();


        //Deploy Cast Contract
        const Cast = await ethers.getContractFactory("Cast");
        const cast = await Cast.deploy();

        return { cast, admin, voter1, voter2, user, contender1, contender2, whitelistAddresses, upcomingadmin, rootHash, merkleTree, impersonatedSigner};
    }

    describe("Testing Cast Contract Functions", function () {
        describe("Initialization", function () {
            it("Should check that the initialise state of the contract is false if not yet initilaised", async function () {
                const { cast, admin } = await loadFixture(deployCastFixture);

                expect(await cast.connect(admin).initializeState()).to.equal(false);
            })

            it("Should initialize contract sucessfully", async function () {
                const { cast, admin, rootHash } = await loadFixture(deployCastFixture);

                const contractState = await cast.connect(admin).initialize(rootHash, 300, 150, "President", admin.address);
                await contractState.wait();

                const initializeState = await cast.initializeState();

                expect(initializeState).to.equal(true);

            })

            it("Should revert if contract has already been initialised", async function () {
                const { cast, admin, rootHash } = await loadFixture(deployCastFixture);

                const contractState = await cast.connect(admin).initialize(rootHash, 300, 150, "President", admin.address);
                await contractState.wait();

                await expect(cast.connect(admin).initialize(rootHash, 2000, 3200, "Governor", admin.address)).to.be.revertedWithCustomError(
                    cast,
                    "ContractAlreadyInitialized"
                  );
            })
        })

        describe("Contender Registration", function () {
            it("Should revert if contender is not an holder of MLOOT NFT", async function () {
                const { cast, admin, contender1, rootHash, merkleTree } = await loadFixture(deployCastFixture);

                const regDuration = Math.floor(Date.now() / 1000) + 60 * 5;
                const castDuration = Math.floor(Date.now() / 1000) + 60 * 10;

                const contractState = await cast.connect(admin).initialize(rootHash, castDuration, regDuration, "President", admin.address);
                await contractState.wait();

                const leaf = keccak256(contender1.address);
                const proof = merkleTree.getHexProof(leaf);

                await expect(cast.connect(contender1).contenderRegistration(proof)).to.be.revertedWithCustomError(cast, "NotAnMLOOTHolder");
        
            })

            it("Should revert if contender address is not whitelisted", async function () {
                const { cast, admin, rootHash, merkleTree} = await loadFixture(deployCastFixture);

                const MoreHolder = "0xC8FDfB4169f3F8091df27B1b3a71006E3567aC15";

                await helpers.impersonateAccount(MoreHolder);
                const impersonatedSigner2 = await ethers.getSigner(MoreHolder);
        
        

                const regDuration = Math.floor(Date.now() / 1000) + 60 * 5;
                const castDuration = Math.floor(Date.now() / 1000) + 60 * 10;

                const contractState = await cast.connect(admin).initialize(rootHash, castDuration, regDuration, "President", admin.address);
                await contractState.wait();

                const leaf = keccak256(impersonatedSigner2.address);
                const proof = merkleTree.getHexProof(leaf);

                await expect(cast.connect(impersonatedSigner2).contenderRegistration(proof)).to.be.revertedWithCustomError(cast, "NotWhitelisted");
            })

            it("Should revert if contender registration duration has exceeded", async function () {
                const { cast, admin, rootHash, merkleTree, impersonatedSigner } = await loadFixture(deployCastFixture);

                //const regDuration = Math.floor(Date.now() / 1000) + 60 * 0;
                const castDuration = Math.floor(Date.now() / 1000) + 60 * 10;

                const contractState = await cast.connect(admin).initialize(rootHash, castDuration, 0, "President", admin.address);
                await contractState.wait();

                const leaf = keccak256(impersonatedSigner.address);
                const proof = merkleTree.getHexProof(leaf);

                await expect(cast.connect(impersonatedSigner).contenderRegistration(proof)).to.be.revertedWithCustomError(cast, "ContenderRegistrationClosed");
            })

            it("Should revert if contender has already registered", async function () {
                const { cast, admin, rootHash, merkleTree, impersonatedSigner} = await loadFixture(deployCastFixture);

                const regDuration = Math.floor(Date.now() / 1000) + 60 * 5;
                const castDuration = Math.floor(Date.now() / 1000) + 60 * 10;

                const contractState = await cast.connect(admin).initialize(rootHash, castDuration, regDuration, "President", admin.address);
                await contractState.wait();

                const leaf = keccak256(impersonatedSigner.address);
                const proof = merkleTree.getHexProof(leaf);

                const contenderReg = await cast.connect(impersonatedSigner).contenderRegistration(proof);
                await contenderReg.wait();

                await expect(cast.connect(impersonatedSigner).contenderRegistration(proof)).to.be.revertedWithCustomError(cast, "CanNotRegisterTwice");
            })
        })

        describe("Voting", function() {
            it("Should revert if contender registration is ongoing", async function(){
                const { cast, admin, voter1, rootHash, merkleTree, impersonatedSigner} = await loadFixture(deployCastFixture);
                
                const regDuration = Math.floor(Date.now() / 1000) + 60 * 5;
                const castDuration = Math.floor(Date.now() / 1000) + 60 * 10;

                const contractState = await cast.connect(admin).initialize(rootHash, castDuration, regDuration, "President", admin.address);
                await contractState.wait();

                const leaf = keccak256(impersonatedSigner.address);
                const proof = merkleTree.getHexProof(leaf);

                const contenderReg = await cast.connect(impersonatedSigner).contenderRegistration(proof);
                await contenderReg.wait();

                await expect(cast.connect(voter1).castVote(1)).to.be.revertedWithCustomError(cast, "ContenderRegistrationOngoing");
            })

            it("Should revert if voting has already ended", async function(){
                const { cast, admin, voter1, rootHash, merkleTree, impersonatedSigner} = await loadFixture(deployCastFixture);
                
                //const regDuration = Math.floor(Date.now() / 1000) + 60 * 5;
                //const castDuration = Math.floor(Date.now() / 1000) + 60 * 10;

                const contractState = await cast.connect(admin).initialize(rootHash, 0, 0, "President", admin.address);
                await contractState.wait();

                const leaf = keccak256(impersonatedSigner.address);
                const proof = merkleTree.getHexProof(leaf);

                // const contenderReg = await cast.connect(impersonatedSigner).contenderRegistration(proof);
                // await contenderReg.wait();

                await expect(cast.connect(voter1).castVote(1)).to.be.revertedWithCustomError(cast, "VoteEnded");
            })

            it("Should revert if there's no contender", async function(){
                const { cast, admin, voter2,impersonatedSigner,merkleTree, rootHash} = await loadFixture(deployCastFixture);
                
                const regDuration = Math.floor(Date.now() / 1000) + 60 * 5;
                const castDuration = Math.floor(Date.now() / 1000) + 60 * 10;

                const contractState = await cast.connect(admin).initialize(rootHash, castDuration, 2, "President", admin.address);
                await contractState.wait();

                // //Reg
                const leaf = keccak256(impersonatedSigner.address);
                const proof = merkleTree.getHexProof(leaf);

                const contenderReg = await cast.connect(impersonatedSigner).contenderRegistration(proof);
                await contenderReg.wait();

                await expect(cast.connect(voter2).castVote(12)).to.be.revertedWithCustomError(cast, "InvalidContenderID");
            })

            it("Should revert if Voter has already voted", async function(){
                const { cast, admin, voter1, rootHash, merkleTree, impersonatedSigner} = await loadFixture(deployCastFixture);
                
                const regDuration = Math.floor(Date.now() / 1000) + 60 * 5;
                const castDuration = Math.floor(Date.now() / 1000) + 60 * 10;

                const contractState = await cast.connect(admin).initialize(rootHash, castDuration, 2, "President", admin.address);
                await contractState.wait();

                const leaf = keccak256(impersonatedSigner.address);
                const proof = merkleTree.getHexProof(leaf);

                const contenderReg = await cast.connect(impersonatedSigner).contenderRegistration(proof);
                await contenderReg.wait();

                const VoteCast = await cast.connect(voter1).castVote(1);
                await VoteCast.wait();

                await expect(cast.connect(voter1).castVote(1)).to.be.revertedWithCustomError(cast, "Voted");
            })
        })

        describe("End Cast Session", function() {
            it("Should revert if caller is not admin", async function(){
                const { cast, admin,user, voter1, rootHash, merkleTree, impersonatedSigner} = await loadFixture(deployCastFixture);
                
                // const regDuration = Math.floor(Date.now() / 1000) + 60 * 5;
                // const castDuration = Math.floor(Date.now() / 1000) + 60 * 10;

                const contractState = await cast.connect(admin).initialize(rootHash, 4, 2, "President", admin.address);
                await contractState.wait();

                const leaf = keccak256(impersonatedSigner.address);
                const proof = merkleTree.getHexProof(leaf);

                const contenderReg = await cast.connect(impersonatedSigner).contenderRegistration(proof);
                await contenderReg.wait();

                const VoteCast = await cast.connect(voter1).castVote(1);
                await VoteCast.wait();

                await expect(cast.connect(user).endCastSession()).to.be.revertedWithCustomError(cast, "NotAdmin");
            })

            it("Should revert if cast is still in progress", async function(){
                const { cast, admin, voter1, rootHash, merkleTree, impersonatedSigner} = await loadFixture(deployCastFixture);
                
                //const regDuration = Math.floor(Date.now() / 1000) + 60 * 5;
                const castDuration = Math.floor(Date.now() / 1000) + 60 * 20;

                const contractState = await cast.connect(admin).initialize(rootHash, castDuration, 2, "President", admin.address);
                await contractState.wait();

                const leaf = keccak256(impersonatedSigner.address);
                const proof = merkleTree.getHexProof(leaf);

                const contenderReg = await cast.connect(impersonatedSigner).contenderRegistration(proof);
                await contenderReg.wait();

                const VoteCast = await cast.connect(voter1).castVote(1);
                await VoteCast.wait();

                await expect(cast.connect(admin).endCastSession()).to.be.revertedWithCustomError(cast, "CastStillInProgress");
            })

            it("Should revert if there are no contenders or voters", async function(){
                const { cast, admin, rootHash} = await loadFixture(deployCastFixture);
                
                const regDuration = Math.floor(Date.now() / 1000) + 60 * 5;
                //const castDuration = Math.floor(Date.now() / 1000) + 60 * 0;

                const contractState = await cast.connect(admin).initialize(rootHash, 0, regDuration, "President", admin.address);
                await contractState.wait();

                await expect(cast.connect(admin).endCastSession()).to.be.revertedWithCustomError(cast, "NoContenderOrVoters");
            })

        })

        describe(" Contract Admin Change", function(){
            it("Should revert if the msg.sender is not upcomingAdmin", async function(){
                const {cast, admin, rootHash, upcomingadmin} = await loadFixture(deployCastFixture);

                const regDuration = Math.floor(Date.now() / 1000) + 60 * 5;
                const castDuration = Math.floor(Date.now() / 1000) + 60 * 10;

                const contractState = await cast.connect(admin).initialize(rootHash, castDuration, regDuration, "President", admin.address);
                await contractState.wait();

                const setNewAdmin = await cast.connect(admin).setUpcomingAdmin(upcomingadmin.address);
                await setNewAdmin.wait();

                console.log("Old Admin",admin.address); //0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

                console.log("Upcoming Admin",upcomingadmin.address);

                await expect ((await cast.connect(upcomingadmin).acceptAdministration())).not.to.be.reverted;
                
                console.log("New Admin", admin.address);
                console.log("Upcoming Admin",upcomingadmin.address);

            })
           
        })

    })
})