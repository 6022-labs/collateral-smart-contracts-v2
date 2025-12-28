// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {StringEscape} from "./StringEscape.sol";

library NFTSVG {
    using Strings for uint256;
    using Strings for address;

    using StringEscape for string;

    struct SVGParams {
        string name;
        uint256 tokenId;
        address vaultAddress;
        address creatorAddress;
        address rewardPoolAddress;
        address wantedTokenAddress;
    }

    function generateSVG(SVGParams memory params) internal pure returns (string memory svg) {
        return
            string(
                abi.encodePacked(
                    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="768" viewBox="0 0 512 768">',
                    generateSVGDefs(params),
                    generateSvgInsideContent(params),
                    generateSvgBorderContent(params),
                    '</svg>'
                )
            );
    }

    function generateSVGDefs(SVGParams memory params) internal pure returns (string memory svg) {
        bytes32 hash = keccak256(abi.encodePacked(params.creatorAddress));
        uint256 numberOfColors = 3 + (uint256(uint8(hash[0])) % 8); // Random number between 3 and 10

        string[] memory colors = new string[](numberOfColors);

        for (uint256 i = 0; i < numberOfColors; i++) {
            string memory color = colorFromHash(hash, uint8(i * 3));
            colors[i] = color;
        }

        return
            string(
                abi.encodePacked(
                    '<defs>',
                        '<clipPath id="clip-border">',
                            '<rect width="512" height="768" rx="20" ry="20" />',
                        '</clipPath>',
                        '<clipPath id="clip-image">',
                            '<rect x="20" y="20" width="472" height="728" rx="16" ry="16" />',
                        '</clipPath>',
                        '<clipPath id="wallet-carousel-clip">',
                            '<rect x="7" y="750" width="498" height="24" />',
                        '</clipPath>',
                        '<path id="wallet-carousel-path" d="M 0,762 H 512" />',

                        '<clipPath id="name-carousel-clip">',
                            '<rect x="12" y="12" width="316" height="60" />',
                        '</clipPath>',
                        '<path id="name-carousel-path" d="M -0,45 H 336" />',

                        '<linearGradient id="fadeOverlay" x1="0" y1="0" x2="1" y2="1">',
                            '<stop offset="0%" stop-color="black" stop-opacity="1" />',
                            '<stop offset="10%" stop-color="black" stop-opacity="0" />',
                            '<stop offset="90%" stop-color="black" stop-opacity="0" />',
                            '<stop offset="100%" stop-color="black" stop-opacity="1" />',
                        '</linearGradient>',

                        '<linearGradient id="borderGradient" x1="0" y1="1" x2="1" y2="1">',
                            '<stop offset="0%" stop-color="#E068BA" />',
                            '<stop offset="25%" stop-color="#22B7E0" />',
                            '<stop offset="50%" stop-color="#9859FE" />',
                            '<stop offset="75%" stop-color="#467D83" />',
                            '<stop offset="100%" stop-color="#953A53" />',
                        '</linearGradient>',
                    '</defs>'
                )
            );
    }

    function generateSvgInsideContent(SVGParams memory params) internal pure returns (string memory svg) {
        string memory idLabel = string(abi.encodePacked("Id: ", params.tokenId.toString()));
        string memory rewardPoolLabel = string(abi.encodePacked("Reward pool: ", params.rewardPoolAddress.toHexString()));
        string memory wantedTokenLabel = string(abi.encodePacked("Wanted token: ", params.wantedTokenAddress.toHexString()));

        uint256 idWidth = paddedWidth(idLabel, 13, 60);
        uint256 rewardPoolWidth = paddedWidth(rewardPoolLabel, 13, 450);
        uint256 wantedTokenWidth = paddedWidth(wantedTokenLabel, 13, 456);

        return
            string(
                abi.encodePacked(
                    '<g clip-path="url(#clip-border)">',
                    '<rect width="512" height="768" fill="url(#borderGradient)" />',
                    '<g clip-path="url(#clip-image)">',
                        generateAvogadroLogo(),
                        '<rect x="20" y="20" width="472" height="728" fill="url(#fadeOverlay)" />',
                    '</g>',
                    '<g transform="translate(86,40)">',
                        '<rect width="340" height="60" rx="12" ry="12" fill="rgba(0,0,0,0.7)" />',
                        '<g clip-path="url(#name-carousel-clip)">',
                            '<text',
                                ' fill="white" font-family="Courier, Liberation Mono, monospace"',
                                ' font-size="48"',
                            '>',
                                '<textPath xlink:href="#name-carousel-path" startOffset="340">',
                                    params.name.svgText(),
                                    '<animate',
                                        ' attributeName="startOffset" from="340" to="-480" dur="20s"',
                                        ' repeatCount="indefinite"',
                                    '/>',
                                '</textPath>',
                            '</text>',
                        '</g>',
                    '</g>',
                    '<g transform="translate(28,610)">',
                        '<rect',
                            ' width="', idWidth.toString(),
                            '" height="32" rx="8" ry="8" fill="rgba(0,0,0,0.6)"',
                        '/>',
                        '<text',
                            ' x="12" y="20" fill="white"',
                            ' font-family="Courier, Liberation Mono, monospace"',
                            ' font-size="13"',
                        '>',
                            idLabel.svgText(),
                        '</text>',
                    '</g>',
                    '<g transform="translate(28,650)">',
                        '<rect',
                            ' width="', rewardPoolWidth.toString(), '"',
                            ' height="32" rx="8" ry="8" fill="rgba(0,0,0,0.6)"',
                        '/>',
                        '<text',
                            ' x="12" y="20" fill="white"', 
                            ' font-family="Courier, Liberation Mono, monospace"',
                            ' font-size="13"',
                        '>',
                            rewardPoolLabel,
                        '</text>',
                    '</g>',
                    '<g transform="translate(28,690)">',
                        '<rect width="',
                            wantedTokenWidth.toString(),
                            '" height="32" rx="8" ry="8" fill="rgba(0,0,0,0.6)"',
                        '/>',
                        '<text',
                            ' x="12" y="20"',
                            ' fill="white" font-family="Courier, Liberation Mono, monospace"',
                            ' font-size="13"',
                        '>',
                            wantedTokenLabel,
                        '</text>',
                    '</g>',
                '</g>'
                )
            );
    }

    function generateAvogadroLogo() internal pure returns (string memory svg) {
        return
            string(
                abi.encodePacked(
                    '<g',
                        ' transform="matrix(0.13, 0, 0, -0.13, -14, 756)"',
                        ' fill="#000000" stroke="none">',
                        '<path',
                            ' d="M1790 4951 c-315 -69 -535 -246 -628 -505 -17 -46 -40 -133 -52 -192 -11 -60 -29 -136 -40 -169 -50 -154 -64 -321 -35 -440 7 -33 30 -102 50 -154 28 -73 35 -102 30 -129 -5 -29 -4 -34 9 -29 18 7 23 -18 6 -28 -5 -3 -10 -13 -10 -22 0 -15 2 -14 18 0 18 17 42 23 42 11 0 -3 -11 -19 -25 -36 -27 -31 -34 -91 -13 -104 7 -4 8 -3 4 5 -13 20 3 60 29 77 32 21 41 13 20 -19 -29 -44 -36 -86 -20 -123 17 -41 39 -46 28 -6 -12 46 -6 76 22 99 48 42 105 21 105 -37 0 -28 -38 -70 -64 -70 -7 0 -18 -28 -25 -62 -29 -144 -127 -429 -192 -562 -34 -68 -45 -81 -225 -273 -74 -79 -134 -147 -134 -151 0 -5 26 -12 58 -14 31 -3 93 -18 137 -32 103 -35 444 -203 700 -346 543 -304 855 -430 1063 -430 44 0 53 3 48 15 -17 45 -512 729 -891 1230 -203 270 -295 397 -263 365 17 -16 420 -520 504 -630 118 -153 215 -282 289 -385 57 -80 331 -441 381 -504 2 -2 21 7 41 21 55 35 118 58 163 58 21 0 41 4 44 8 2 4 -44 80 -104 169 -126 187 -157 244 -180 326 l-16 60 -131 54 -130 55 -51 91 c-50 91 -76 147 -67 147 2 0 16 -20 31 -45 40 -68 40 -47 1 26 -19 35 -38 77 -42 93 -4 21 -9 26 -14 17 -6 -9 -23 14 -53 71 -24 45 -41 84 -38 86 4 1 60 -22 125 -53 99 -46 126 -55 174 -55 81 0 110 -35 51 -60 -38 -16 -39 -30 -1 -30 16 0 34 -6 40 -14 10 -12 7 -18 -16 -32 -34 -21 -53 -43 -53 -61 0 -11 6 -10 30 2 59 31 115 10 70 -27 -12 -10 -21 -20 -19 -21 2 -2 16 -8 32 -15 32 -14 36 -32 7 -32 -11 0 -20 -4 -20 -10 0 -5 6 -10 14 -10 7 0 19 -6 25 -14 10 -12 8 -16 -10 -21 -15 -5 -26 -2 -34 8 -12 17 -20 13 -47 -18 -17 -20 -16 -20 59 -17 l75 4 74 -73 c67 -67 77 -81 95 -144 22 -73 195 -435 209 -435 5 0 45 39 89 86 89 96 96 115 60 173 -19 32 -76 108 -230 306 -111 143 -167 296 -185 508 -4 47 -15 98 -25 119 -25 50 -24 59 11 93 20 19 30 24 30 14 0 -12 2 -12 10 1 5 8 10 30 10 48 0 27 3 32 18 28 9 -3 24 -1 32 4 8 5 10 10 3 10 -10 0 -33 50 -33 73 0 5 9 7 20 4 28 -7 42 14 24 37 -18 25 -18 50 1 66 11 9 11 16 3 29 -8 13 -6 33 10 82 11 35 23 77 27 93 3 16 17 45 31 65 17 25 24 49 24 84 0 47 0 47 27 41 l27 -7 -22 28 c-19 24 -22 40 -22 119 1 126 10 161 90 321 104 207 112 289 46 483 -42 125 -66 171 -132 258 -84 111 -216 204 -395 278 -179 74 -341 106 -559 112 -136 3 -180 1 -250 -15z m227 -173 c25 -28 87 -137 81 -143 -16 -16 -128 118 -128 153 0 19 25 14 47 -10z m166 -127 c40 -63 93 -136 119 -163 52 -53 46 -61 -17 -23 -42 24 -60 48 -49 66 3 5 -4 9 -15 9 -21 0 -82 83 -132 181 -29 57 -1 36 36 -27 14 -24 28 -44 31 -44 7 0 -37 82 -65 120 -24 33 -24 34 -2 15 12 -11 55 -71 94 -134z m202 118 c49 -29 113 -101 135 -152 26 -58 20 -70 -18 -35 -15 14 -54 43 -87 65 -121 82 -136 129 -17 53 97 -61 42 2 -63 74 -38 26 -39 27 -10 20 17 -4 44 -15 60 -25z m-484 -26 c12 -21 36 -53 53 -72 31 -34 117 -81 148 -81 17 0 68 -47 68 -62 0 -14 -84 -9 -139 8 -73 21 -144 88 -171 160 -25 68 -25 84 -1 84 12 0 28 -15 42 -37z m-73 -80 c12 -23 36 -58 53 -78 28 -32 29 -35 11 -35 -55 0 -103 82 -101 171 1 40 2 41 8 14 4 -16 17 -49 29 -72z m556 -35 c93 -63 176 -134 176 -149 0 -5 -13 -9 -29 -9 -15 0 -42 -5 -60 -11 -71 -25 -131 27 -203 178 -26 56 -48 105 -48 108 0 4 17 -7 38 -24 20 -18 77 -59 126 -93z m-617 -36 c36 -48 68 -65 131 -68 31 -2 83 -11 116 -20 46 -12 70 -14 115 -6 l56 10 45 -42 c57 -53 162 -112 215 -120 39 -6 38 -5 -13 15 -29 12 -51 23 -49 26 3 2 41 1 85 -2 l81 -7 -10 -27 c-37 -97 -159 -130 -273 -72 -70 35 -68 19 4 -32 90 -63 193 -83 267 -52 19 8 75 54 124 101 l88 87 60 -13 c112 -24 161 -74 161 -167 0 -99 -29 -139 -140 -190 -41 -19 -90 -46 -109 -60 -30 -24 -32 -24 -22 -4 20 37 -7 24 -33 -16 -63 -95 -69 -170 -27 -305 16 -51 37 -138 46 -193 9 -55 27 -132 41 -171 31 -91 31 -125 -2 -164 -49 -58 -89 -68 -173 -44 -22 6 -22 5 -11 -16 9 -17 9 -29 1 -47 -14 -30 -14 -53 -1 -53 6 0 10 6 10 13 0 8 11 24 25 37 23 22 27 22 41 8 9 -8 18 -34 21 -57 5 -37 4 -41 -16 -41 -12 0 -35 -7 -51 -15 -25 -13 -33 -13 -67 1 -29 13 -56 15 -111 10 -89 -7 -129 8 -134 51 l-3 28 -23 -37 c-13 -20 -39 -47 -58 -58 -24 -15 -34 -29 -34 -47 l0 -25 29 24 c15 14 43 30 60 38 28 11 37 11 66 -3 24 -11 49 -14 82 -11 35 4 62 0 101 -15 29 -12 75 -21 102 -21 28 0 50 -4 50 -8 0 -22 -29 -32 -90 -32 -51 0 -78 -6 -127 -30 -35 -16 -63 -31 -63 -33 0 -2 49 -1 110 1 101 4 110 3 116 -14 3 -11 15 -37 27 -60 42 -84 -1 -123 -148 -131 -79 -5 -81 -4 -140 34 -33 21 -82 47 -109 58 -40 16 -54 28 -70 61 -17 34 -28 43 -56 49 -108 21 -190 86 -190 153 -1 37 -1 37 -15 12 l-13 -25 -7 26 c-4 16 2 55 16 99 24 80 23 176 -2 221 -13 22 -15 17 -21 -66 -3 -49 -9 -124 -13 -166 -5 -49 -4 -88 3 -108 14 -40 7 -40 -14 1 -17 34 -16 93 5 229 13 83 2 155 -22 151 -9 -2 -17 2 -17 9 0 6 -26 39 -57 74 -105 115 -158 227 -205 436 -34 152 -32 344 4 489 28 112 103 329 119 345 5 5 9 -6 10 -30 0 -22 4 -78 8 -125 10 -116 -3 -212 -39 -284 -25 -48 -26 -56 -10 -41 36 33 78 131 85 201 4 37 2 113 -5 174 -9 86 -9 122 1 167 l12 58 15 -45 c8 -25 26 -60 39 -78z m-311 -15 c-77 -94 -116 -220 -124 -397 -6 -145 -19 -130 -29 36 -9 160 28 275 118 359 61 57 81 58 35 2z m56 -9 c-43 -62 -81 -142 -113 -233 -33 -95 -36 -82 -9 33 23 96 57 167 100 211 45 44 56 38 22 -11z m1368 -92 c62 -29 77 -25 37 10 -15 13 -24 24 -19 24 4 0 21 -14 37 -30 22 -23 26 -33 17 -42 -24 -24 -162 55 -202 116 -7 10 8 3 32 -17 24 -20 68 -47 98 -61z m-1345 -27 c-39 -102 -62 -138 -50 -79 9 44 73 185 81 178 3 -3 -11 -48 -31 -99z m1018 -5 c12 -13 -3 -21 -28 -17 -13 3 -22 9 -19 14 6 10 38 12 47 3z m-1315 -532 c19 -25 15 -32 -19 -32 -62 0 -110 -82 -95 -163 6 -34 63 -133 72 -125 2 3 -5 25 -15 49 -11 25 -23 63 -27 86 -5 36 -3 45 19 67 15 14 38 26 52 26 28 0 29 -2 16 -47 -7 -23 -5 -51 6 -97 l16 -64 -31 -66 c-17 -36 -36 -66 -42 -66 -14 0 -74 129 -91 193 -15 63 -7 167 18 209 33 56 89 70 121 30z m160 -119 c-5 -110 -29 -195 -65 -225 -13 -11 -13 -8 0 24 17 41 43 162 53 251 10 92 17 66 12 -50z m1412 68 c0 -24 -129 -106 -143 -92 -14 14 1 30 67 72 70 45 76 46 76 20z m98 -77 c34 -24 26 -32 -22 -22 -60 13 -112 -3 -175 -53 -28 -22 -51 -36 -51 -30 0 18 62 81 99 101 44 23 119 26 149 4z m-10 -109 c2 -15 -4 -35 -14 -46 -19 -21 -13 -24 17 -9 13 8 19 7 19 0 0 -19 -67 -40 -127 -40 l-58 -1 35 -19 c19 -10 52 -22 73 -25 38 -7 42 -12 29 -31 -21 -32 -85 -23 -130 19 -29 26 -64 92 -55 101 4 4 32 4 64 0 49 -5 59 -4 78 15 14 14 21 34 21 57 0 36 1 36 23 22 12 -9 23 -28 25 -43z m-123 36 c7 -12 -12 -24 -25 -16 -11 7 -4 25 10 25 5 0 11 -4 15 -9z m-1475 -133 c-7 -33 -26 -77 -42 -100 -20 -26 -26 -44 -20 -50 16 -16 144 118 175 182 l26 55 1 -43 c0 -50 -25 -116 -40 -107 -6 4 -18 1 -26 -6 -13 -10 -11 -14 8 -24 20 -10 25 -9 40 9 17 21 17 21 11 -4 -9 -38 -51 -89 -78 -96 -14 -3 -22 -11 -19 -16 6 -9 25 -7 71 8 14 4 13 1 -6 -15 -17 -15 -19 -21 -8 -21 22 0 77 58 77 80 0 10 5 22 10 25 6 4 10 -8 10 -29 0 -20 5 -36 11 -36 17 0 4 -68 -17 -91 -24 -26 -41 -24 -81 11 -22 19 -45 30 -64 30 -24 0 -44 13 -87 54 l-55 53 40 61 c22 33 46 82 53 108 17 67 25 36 10 -38z m1554 -176 c33 -31 38 -60 16 -108 -26 -59 -61 -108 -70 -97 -10 11 -50 164 -50 191 0 43 62 51 104 14z m-1105 -369 c0 -16 -4 -37 -8 -48 -7 -17 -10 -15 -20 17 -13 40 -9 58 15 58 9 0 14 -10 13 -27z m-127 -18 c4 -20 3 -23 -8 -14 -15 12 -20 54 -5 45 5 -3 11 -17 13 -31z m72 -29 c9 -19 16 -47 15 -63 l-1 -28 -7 30 c-4 17 -15 45 -25 63 -9 17 -12 32 -7 32 5 0 16 -15 25 -34z m141 -174 c-7 -7 -34 18 -47 42 -8 16 -3 14 21 -8 17 -16 29 -32 26 -34z m407 -526 c15 -38 27 -71 25 -73 -5 -4 -72 143 -81 177 -6 22 -5 22 10 -5 9 -16 30 -61 46 -99z" />',
                        '<path',
                            ' d="M2481 4066 c-15 -61 -49 -86 -116 -86 -42 0 -71 10 -155 51 -90 44 -112 50 -164 50 -34 0 -72 -4 -86 -10 -22 -8 -18 -10 26 -10 84 -1 204 -48 204 -80 0 -5 -38 -11 -85 -13 -66 -5 -94 -11 -129 -32 -49 -29 -120 -104 -153 -164 l-23 -40 36 -31 c34 -30 36 -31 66 -15 17 9 41 14 54 11 13 -2 21 0 18 4 -3 5 -1 17 5 26 9 16 11 15 19 -7 14 -36 38 -53 74 -52 42 1 72 33 72 77 0 40 -2 40 36 20 32 -16 46 -51 35 -84 -8 -25 16 -29 35 -6 14 16 30 11 30 -9 0 -16 -48 -27 -160 -35 l-85 -7 37 -17 c21 -9 60 -17 88 -17 27 0 50 -4 50 -9 0 -4 -11 -20 -24 -34 -28 -30 -76 -41 -151 -35 -30 3 -55 3 -55 2 0 -13 77 -39 130 -43 l65 -6 -30 -17 c-38 -22 -15 -23 52 -3 62 18 108 62 152 145 l34 63 -29 21 -28 21 29 5 c22 4 31 12 35 30 3 14 14 38 25 54 11 17 20 46 20 71 0 29 9 55 30 86 22 34 30 58 33 107 2 34 2 62 -1 62 -2 0 -10 -20 -16 -44z m-230 -173 c52 -27 72 -54 52 -74 -5 -5 -37 2 -75 17 -41 17 -73 24 -85 19 -14 -5 -7 -10 30 -20 56 -14 97 -42 114 -76 19 -37 6 -35 -29 4 -27 30 -44 39 -88 47 -79 15 -138 -2 -216 -61 -66 -51 -91 -59 -100 -34 -12 29 7 66 60 119 64 64 114 84 212 85 58 1 80 -4 125 -26z m-191 -128 c0 -8 -7 -15 -15 -15 -16 0 -20 12 -8 23 11 12 23 8 23 -8z" />',
                        '<path d="M2470 3307 c0 -8 91 -69 96 -64 3 3 -7 14 -23 24 -33 24 -73 45 -73 40z" />',
                        '<path',
                            ' d="M2347 3277 c-32 -34 -159 -179 -177 -201 -13 -17 -9 -17 28 4 59 33 162 128 162 149 0 9 7 26 15 37 30 39 8 48 -28 11z" />',
                        '<path',
                            ' d="M2395 3123 c21 -18 38 -23 86 -23 34 0 73 -7 90 -15 34 -18 57 -11 38 12 -29 34 -73 47 -157 48 l-83 0 26 -22z" />',
                        '<path',
                            ' d="M2396 2172 c-2 -4 -1 -14 4 -22 7 -11 12 -12 21 -3 6 6 8 16 5 22 -8 13 -23 14 -30 3z" />',
                    '</g>'
                )
            );
    }

    function generateSvgBorderContent(SVGParams memory params) internal pure returns (string memory svg) {
        return
            string(
                abi.encodePacked(
                        '<g>',
                            '<!-- width = 512 - 40 -->',
                            '<!-- height = 768 - 40 -->',
                            '<rect',
                                ' x="20"',
                                ' y="20"',
                                ' width="472"',
                                ' height="728"',
                                ' rx="16"',
                                ' ry="16"',
                                ' fill="none"',
                                ' stroke="black"',
                                ' stroke-width="url(#borderGradient)"',
                            '/>',
                            '<g clip-path="url(#wallet-carousel-clip)">',
                                '<text fill="white" font-family="Courier, Liberation Mono, monospace" font-size="14">',
                                    '<textPath xlink:href="#wallet-carousel-path" startOffset="-352">',
                                        params.vaultAddress.toHexString(),
                                        '<animate attributeName="startOffset"',
                                            ' from="-352" to="512"',
                                            ' dur="10s" repeatCount="indefinite"',
                                        '/>',
                                    '</textPath>',
                                '</text>',
                            '</g>',
                        '</g>'
                )
            );
    }

    function colorFromHash(
        bytes32 hash,
        uint8 offset
    ) private pure returns (string memory) {
        uint8 r = uint8(hash[offset]);
        uint8 g = uint8(hash[offset + 1]);
        uint8 b = uint8(hash[offset + 2]);
        return
            string(
                abi.encodePacked(
                    "#",
                    toHexString(r),
                    toHexString(g),
                    toHexString(b)
                )
            );
    }

    function toHexString(uint8 value) private pure returns (string memory) {
        bytes memory buffer = new bytes(2);
        buffer[0] = hexChar(value / 16);
        buffer[1] = hexChar(value % 16);
        return string(buffer);
    }

    function hexChar(uint8 value) private pure returns (bytes1) {
        return value < 10 ? bytes1(value + 48) : bytes1(value + 87);
    }

    /// @dev Estimate text width (in px) assuming monospace characters of width ~= 0.6 * fontSize.
    function estimateStrLen(string memory value, uint256 fontSize) private pure returns (uint256) {
        uint256 byteLen = bytes(value).length;
        return (byteLen * fontSize * 6) / 10;
    }

    function paddedWidth(string memory value, uint256 fontSize, uint256 minWidth) private pure returns (uint256) {
        uint256 padding = 24;
        uint256 estimated = estimateStrLen(value, fontSize) + padding;
        return estimated > minWidth ? estimated : minWidth;
    }
}