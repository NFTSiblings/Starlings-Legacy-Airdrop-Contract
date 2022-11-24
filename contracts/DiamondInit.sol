// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**************************************************************\
 * Initialiser contract authored by Sibling Labs
 * Version 0.1.0
 * 
 * This initialiser contract has been written specifically for
 * STARLINGS-LEGACY-AIRDROP-CONTRACT by Sibling Labs
/**************************************************************/

import { GlobalState } from "./libraries/GlobalState.sol";
import { CenterFacetLib } from "./facets/CenterFacet.sol";
import { ERC165Lib } from "./facets/ERC165Facet.sol";
import { ERC721Lib } from "./ancillary/ERC721DiamondStorage.sol";
import { PaymentSplitterLib } from "./facets/PaymentSplitterFacet.sol";
import { RoyaltiesConfigLib } from "./facets/RoyaltiesConfigFacet.sol";

contract DiamondInit {

    function initAll() external {
        initAdminPrivilegesFacet();
        initCenterFacet();
        initERC165Facet();
        initPaymentSplitterFacet();
        initRoyaltiesConfigFacet();
    }

    // AdminPrivilegesFacet //

    function initAdminPrivilegesFacet() public {
        // List of admins must be placed inside this function,
        // as arrays cannot be constant and
        // therefore will not be accessible by the
        // delegatecall from the diamond contract.
        address[] memory admins = new address[](2);
        admins[0] = 0x885Af893004B4405Dc18af1A4147DCDCBdA62b50;
        admins[1] = 0x699a1928EA12D21dd2138F36A3690059bf1253A0;

        for (uint256 i; i < admins.length; i++) {
            GlobalState.getState().admins[admins[i]] = true;
        }
    }

    // CenterFacet //

    address private constant authorisedSigner = 0x699a1928EA12D21dd2138F36A3690059bf1253A0;
    string private constant baseURI = "https://gateway.pinata.cloud/ipfs/.../?";
    bool private constant burnsPermitted = false;

    string private constant name = "MyToken";
    string private constant symbol = "MTK";

    function initCenterFacet() public {
        
        CenterFacetLib.state storage s1 = CenterFacetLib.getState();

        s1.authorisedSigner = authorisedSigner;
        s1.baseURI = baseURI;
        s1.burnsPermitted = burnsPermitted;

        ERC721Lib.state storage s2 = ERC721Lib.getState();

        s2._name = name;
        s2._symbol = symbol;
    }

    // ERC165Facet //

    function initERC165Facet() public {
        // List of bytes4 selectors must be placed inside this
        // function, as arrays cannot be constant and
        // therefore will not be accessible by the
        // delegatecall from the diamond contract.
        
        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = 0x01ffc9a7; // IERC165
        selectors[1] = 0x7f5828d0; // IERC173
        selectors[2] = 0x2a55205a; // IERC2981
        selectors[3] = 0x80ac58cd; // IERC721
        selectors[4] = 0x5b5e139f; // IERC721METADATA
        selectors[5] = 0x48e2b093; // IDIAMONDLOUPE
        selectors[6] = 0x1f931c1c; // IDIAMONDCUT

        ERC165Lib.state storage s = ERC165Lib.getState();

        for(uint8 i; i < selectors.length; i++) {
            s.supportedInterfaces[selectors[i]] = true;
        }
    }

    // PaymentSplitterFacet //

    function initPaymentSplitterFacet() public {
        // Lists of payees and shares must be placed inside this
        // function, as arrays cannot be constant and therefore
        // will not be accessible by the delegatecall from the
        // diamond contract.
        address[] memory payees = new address[](1);
        payees[0] = 0x699a1928EA12D21dd2138F36A3690059bf1253A0;

        uint256[] memory shares = new uint256[](1);
        shares[0] = 1;

        require(payees.length == shares.length, "PaymentSplitter: payees and shares length mismatch");
        require(payees.length > 0, "PaymentSplitter: no payees");

        for (uint256 i = 0; i < payees.length; i++) {
            PaymentSplitterLib._addPayee(payees[i], shares[i]);
        }
    }

    // RoyaltiesConfigFacet //

    address payable private constant royaltyRecipient = payable(0x699a1928EA12D21dd2138F36A3690059bf1253A0);
    uint256 private constant royaltyBps = 500;

    function initRoyaltiesConfigFacet() public {
        RoyaltiesConfigLib.state storage s = RoyaltiesConfigLib.getState();

        s.royaltyRecipient = royaltyRecipient;
        s.royaltyBps = royaltyBps;
    }

}