// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library StringEscape {
    function json(string memory s) internal pure returns (string memory) {
        bytes memory src = bytes(s);

        uint256 extra;
        uint256 len = src.length;
        for (uint256 i = 0; i < len; ) {
            bytes1 c = src[i];
            if (
                c == "\"" ||
                c == "\\" ||
                c == bytes1(0x08) ||
                c == bytes1(0x0c) ||
                c == bytes1(0x0a) ||
                c == bytes1(0x0d) ||
                c == bytes1(0x09)
            ) {
                unchecked {
                    extra++;
                }
            } else if (uint8(c) < 0x20) {
                unchecked {
                    extra += 5; // "\\u00" + two hex chars
                }
            }
            unchecked {
                ++i;
            }
        }

        bytes memory out = new bytes(len + extra);
        uint256 j;
        for (uint256 i = 0; i < len; ) {
            bytes1 c = src[i];
            if (c == "\"") {
                out[j++] = "\\";
                out[j++] = "\"";
            } else if (c == "\\") {
                out[j++] = "\\";
                out[j++] = "\\";
            } else if (c == bytes1(0x08)) {
                out[j++] = "\\";
                out[j++] = "b";
            } else if (c == bytes1(0x0c)) {
                out[j++] = "\\";
                out[j++] = "f";
            } else if (c == bytes1(0x0a)) {
                out[j++] = "\\";
                out[j++] = "n";
            } else if (c == bytes1(0x0d)) {
                out[j++] = "\\";
                out[j++] = "r";
            } else if (c == bytes1(0x09)) {
                out[j++] = "\\";
                out[j++] = "t";
            } else if (uint8(c) < 0x20) {
                out[j++] = "\\";
                out[j++] = "u";
                out[j++] = "0";
                out[j++] = "0";
                out[j++] = _hexNibble(uint8(c) >> 4);
                out[j++] = _hexNibble(uint8(c));
            } else {
                out[j++] = c;
            }
            unchecked {
                ++i;
            }
        }

        return string(out);
    }

    function svgText(string memory s) internal pure returns (string memory) {
        bytes memory src = bytes(s);

        uint256 extra;
        uint256 len = src.length;
        for (uint256 i = 0; i < len; ) {
            bytes1 c = src[i];
            if (c == "&") {
                unchecked {
                    extra += 4; // &amp;
                }
            } else if (c == "<" || c == ">") {
                unchecked {
                    extra += 3; // &lt; or &gt;
                }
            }
            unchecked {
                ++i;
            }
        }

        bytes memory out = new bytes(len + extra);
        uint256 j;
        for (uint256 i = 0; i < len; ) {
            bytes1 c = src[i];
            if (c == "&") {
                out[j++] = "&";
                out[j++] = "a";
                out[j++] = "m";
                out[j++] = "p";
                out[j++] = ";";
            } else if (c == "<") {
                out[j++] = "&";
                out[j++] = "l";
                out[j++] = "t";
                out[j++] = ";";
            } else if (c == ">") {
                out[j++] = "&";
                out[j++] = "g";
                out[j++] = "t";
                out[j++] = ";";
            } else {
                out[j++] = c;
            }
            unchecked {
                ++i;
            }
        }

        return string(out);
    }

    function svgAttr(string memory s) internal pure returns (string memory) {
        bytes memory src = bytes(s);

        uint256 extra;
        uint256 len = src.length;
        for (uint256 i = 0; i < len; ) {
            bytes1 c = src[i];
            if (c == "&") {
                unchecked {
                    extra += 4; // &amp;
                }
            } else if (c == "<" || c == ">") {
                unchecked {
                    extra += 3; // &lt; or &gt;
                }
            } else if (c == '"' || c == "'") {
                unchecked {
                    extra += 5; // &quot; or &apos;
                }
            }
            unchecked {
                ++i;
            }
        }

        bytes memory out = new bytes(len + extra);
        uint256 j;
        for (uint256 i = 0; i < len; ) {
            bytes1 c = src[i];
            if (c == "&") {
                out[j++] = "&";
                out[j++] = "a";
                out[j++] = "m";
                out[j++] = "p";
                out[j++] = ";";
            } else if (c == "<") {
                out[j++] = "&";
                out[j++] = "l";
                out[j++] = "t";
                out[j++] = ";";
            } else if (c == ">") {
                out[j++] = "&";
                out[j++] = "g";
                out[j++] = "t";
                out[j++] = ";";
            } else if (c == '"') {
                out[j++] = "&";
                out[j++] = "q";
                out[j++] = "u";
                out[j++] = "o";
                out[j++] = "t";
                out[j++] = ";";
            } else if (c == "'") {
                out[j++] = "&";
                out[j++] = "a";
                out[j++] = "p";
                out[j++] = "o";
                out[j++] = "s";
                out[j++] = ";";
            } else {
                out[j++] = c;
            }
            unchecked {
                ++i;
            }
        }

        return string(out);
    }

    function _hexNibble(uint256 nibble) private pure returns (bytes1) {
        nibble &= 0xf;
        return nibble < 10 ? bytes1(uint8(nibble + 48)) : bytes1(uint8(nibble + 87));
    }
}