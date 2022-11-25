const { deployDiamond } = require('../scripts/diamondFullDeployment.js')
const { expect, assert } = require("chai")

beforeEach(async () => {
    [deployer, addr1] = await ethers.getSigners()
    diamondAddress = await deployDiamond()
    
    CenterFacet = await ethers.getContractAt('CenterFacet', diamondAddress)
    await CenterFacet.setAuthorisedSigner(deployer.address)

    getSignature = async (tokenId, addr) => {
        let payload = ethers.utils.hexConcat(
            [
                addr,
                ethers.utils.hexZeroPad(ethers.utils.hexlify(tokenId), 32)
            ]
        )
        return await deployer.signMessage(ethers.utils.arrayify(payload))
    }
})

describe("CenterFacet", () => {
    describe("Minting Tokens", () => {
        it("Mint function accepts valid signatures", async () => {
            let tokenId = 69
            await CenterFacet.mint(tokenId, await getSignature(tokenId, deployer.address))
    
            tokenId = 420
            await CenterFacet.connect(addr1).mint(tokenId, await getSignature(tokenId, addr1.address))
        })
    
        it("Mint function rejects invalid signatures", async () => {
            let tokenId = 69
    
            // incorrect tokenId
            let invalidSig = await getSignature(tokenId - 1, deployer.address)
            await expect(CenterFacet.mint(tokenId, invalidSig))
            .to.be.revertedWith("CenterFacet: invalid signature")
    
            // incorrect address
            invalidSig = await getSignature(tokenId, addr1.address)
            await expect(CenterFacet.mint(tokenId, invalidSig))
            .to.be.revertedWith("CenterFacet: invalid signature")
        })
    
        it("Minted tokens have correct IDs", async () => {
            let tokenId = 69
            await CenterFacet.mint(tokenId, await getSignature(tokenId, deployer.address))
    
            expect(await CenterFacet.exists(tokenId)).to.equal(true)
        })
    })

    describe("Token Transfers", () => {
        it("Prohibited by default", async () => {
            await CenterFacet.connect(addr1).mint(0, await getSignature(0, addr1.address))
            await expect(
                CenterFacet.connect(addr1)["safeTransferFrom(address,address,uint256)"](
                    addr1.address,
                    deployer.address,
                    0
                )
            )
        })
        it("Permitted if caller is allowed", async () => {
            await CenterFacet.connect(addr1).mint(0, await getSignature(0, addr1.address))
            await CenterFacet["toggleTransferPermission(address)"](addr1.address)
            expect(
                await CenterFacet.connect(addr1)["safeTransferFrom(address,address,uint256)"](
                    addr1.address,
                    deployer.address,
                    0
                )
            ).not.to.be.reverted
        })
        it("Permitted if tokenId is allowed", async () => {
            await CenterFacet.connect(addr1).mint(0, await getSignature(0, addr1.address))
            await CenterFacet["toggleTransferPermission(uint256)"](0)
            expect(
                await CenterFacet.connect(addr1)["safeTransferFrom(address,address,uint256)"](
                    addr1.address,
                    deployer.address,
                    0
                )
            ).not.to.be.reverted
        })
        it("Permitted if caller is admin", async () => {
            await CenterFacet.reserve(0);
            expect(
                await CenterFacet["safeTransferFrom(address,address,uint256)"](
                    deployer.address,
                    addr1.address,
                    0
                )
            ).not.to.be.reverted
        })
    })

    describe("Burning Tokens", () => {
        it("Allowed or not according to `burnsPermitted` state variable", async () => {
            await CenterFacet.connect(addr1).mint(0, await getSignature(0, addr1.address))
            expect(await CenterFacet.burnsPermitted()).to.equal(false)

            await expect(CenterFacet.connect(addr1).burn(0))
            .to.be.revertedWith("CenterFacet: token burning prohibited")

            await CenterFacet.toggleBurnPermission()
            expect(await CenterFacet.burnsPermitted()).to.equal(true)
            expect(await CenterFacet.connect(addr1).burn(0)).not.to.be.reverted
        })
        it("Admins may always burn tokens", async () => {
            await CenterFacet.reserve(0)
            expect(await CenterFacet.burnsPermitted()).to.equal(false)

            expect(await CenterFacet.burn(0))
            .not.to.be.reverted
        })
    })

    describe("Admin Functions work as expected", () => {
        it("toggleBurnPermission", async () => {
            expect(await CenterFacet.burnsPermitted()).to.equal(false)
            await CenterFacet.toggleBurnPermission()
            expect(await CenterFacet.burnsPermitted()).to.equal(true)
            await CenterFacet.toggleBurnPermission()
            expect(await CenterFacet.burnsPermitted()).to.equal(false)
        })
        it("setBaseURI", async () => {
            let newBaseURI = "https://someuri.com/"
            await CenterFacet.setBaseURI(newBaseURI)
            expect(await CenterFacet.baseURI()).to.equal(newBaseURI)
        })
        it("setAuthorisedSigner", async () => {
            await CenterFacet.setAuthorisedSigner(addr1.address)
            expect(await CenterFacet.authorisedSigner()).to.equal(addr1.address)
        })
        it("toggleTransferPermission(address)", async () => {
            expect(await CenterFacet["transferPermitted(address)"](addr1.address))
            .to.equal(false)

            await CenterFacet["toggleTransferPermission(address)"](addr1.address)
            expect(await CenterFacet["transferPermitted(address)"](addr1.address))
            .to.equal(true)
        })
        it("toggleTransferPermission(uint256)", async () => {
            expect(await CenterFacet["transferPermitted(uint256)"](0))
            .to.equal(false)

            await CenterFacet["toggleTransferPermission(uint256)"](0)
            expect(await CenterFacet["transferPermitted(uint256)"](0))
            .to.equal(true)
        })
        it("reserve", async () => {
            expect(await CenterFacet.exists(0)).to.equal(false)

            await CenterFacet.reserve(0)
            expect(await CenterFacet.exists(0)).to.equal(true)
        })
    })

    describe("Admin Functions are only callable by admins", () => {
        it("toggleBurnPermission", async () => {
            await expect(CenterFacet.connect(addr1).toggleBurnPermission())
            .to.be.revertedWith("GlobalState: caller is not admin or owner")
        })
        it("setBaseURI", async () => {
            await expect(CenterFacet.connect(addr1).setBaseURI(""))
            .to.be.revertedWith("GlobalState: caller is not admin or owner")
        })
        it("setAuthorisedSigner", async () => {
            await expect(CenterFacet.connect(addr1).setAuthorisedSigner(addr1.address))
            .to.be.revertedWith("GlobalState: caller is not admin or owner")
        })
        it("toggleTransferPermission(address)", async () => {
            await expect(CenterFacet.connect(addr1)["toggleTransferPermission(address)"](addr1.address))
            .to.be.revertedWith("GlobalState: caller is not admin or owner")
        })
        it("toggleTransferPermission(uint256)", async () => {
            await expect(CenterFacet.connect(addr1)["toggleTransferPermission(uint256)"](0))
            .to.be.revertedWith("GlobalState: caller is not admin or owner")
        })
        it("reserve", async () => {
            await expect(CenterFacet.connect(addr1).reserve(0))
            .to.be.revertedWith("GlobalState: caller is not admin or owner")
        })
    })
})