// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**************************************************************\
 * Initialiser contract authored by Sibling Labs
 * Version 0.4.0
 * 
 * This initialiser contract has been written specifically for
 * ERC721A-DIAMOND-TEMPLATE by Sibling Labs
/**************************************************************/

import { GlobalState } from "./libraries/GlobalState.sol";
import { CenterFacetLib } from "./facets/CenterFacet.sol";
import { ERC165Lib } from "./facets/ERC165Facet.sol";
import { ERC721Lib } from "./ancillary/ERC721DiamondStorage.sol";
import { PaymentSplitterLib } from "./facets/PaymentSplitterFacet.sol";
import { RoyaltiesConfigLib } from "./facets/RoyaltiesConfigFacet.sol";

contract DiamondInit {

    function initAll() public {
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
        address[] memory admins = new address[](1);
        admins[0] = 0x885Af893004B4405Dc18af1A4147DCDCBdA62b50;

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

    bytes4 private constant ID_IERC165 = 0x01ffc9a7;
    bytes4 private constant ID_IERC173 = 0x7f5828d0;
    bytes4 private constant ID_IERC2981 = 0x2a55205a;
    bytes4 private constant ID_IERC721 = 0x80ac58cd;
    bytes4 private constant ID_IERC721METADATA = 0x5b5e139f;
    bytes4 private constant ID_IDIAMONDLOUPE = 0x48e2b093;
    bytes4 private constant ID_IDIAMONDCUT = 0x1f931c1c;

    function initERC165Facet() public {
        ERC165Lib.state storage s = ERC165Lib.getState();

        s.supportedInterfaces[ID_IERC165] = true;
        s.supportedInterfaces[ID_IERC173] = true;
        s.supportedInterfaces[ID_IERC2981] = true;
        s.supportedInterfaces[ID_IERC721] = true;
        s.supportedInterfaces[ID_IERC721METADATA] = true;

        s.supportedInterfaces[ID_IDIAMONDLOUPE] = true;
        s.supportedInterfaces[ID_IDIAMONDCUT] = true;
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
    uint256 private constant royaltyBps = 1000;

    function initRoyaltiesConfigFacet() public {
        RoyaltiesConfigLib.state storage s = RoyaltiesConfigLib.getState();

        s.royaltyRecipient = royaltyRecipient;
        s.royaltyBps = royaltyBps;
    }

}