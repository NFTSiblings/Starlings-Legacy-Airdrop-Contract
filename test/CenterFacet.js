const { deployDiamond } = require('../scripts/diamondFullDeployment.js')
const { expect, assert } = require("chai")

beforeEach(async () => {
    [deployer, addr1] = await ethers.getSigners()
    diamondAddress = await deployDiamond()
    
    CenterFacet = await ethers.getContractAt('CenterFacet', diamondAddress)
    await CenterFacet.setAuthorisedSigner(deployer.address)

    getSignature = async (addr) => {
        return await deployer.signMessage(ethers.utils.arrayify(addr))
    }
})

describe("CenterFacet", () => {
    it("Mint function accepts valid signature", async () => {
        
    })

    it("Mint function rejects invalid signature", async () => {

    })

    it("Minted tokens have correct IDs", async () => {
        expect(await CenterFacet.exists(99)).to.equal(false)

        let sig = await getSignature(deployer.address)

        // let hash = ethers.utils.hashMessage(ethers.utils.arrayify(deployer.address))
        // console.log(deployer.address, hash, sig)

        await CenterFacet.mint(99, sig)
        expect(await CenterFacet.exists(99)).to.equal(true)
    })
})