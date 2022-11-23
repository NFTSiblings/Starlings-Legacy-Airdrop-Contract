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