import { formatUnits } from "viem";

export function roundWei(
  value: bigint,
  decimals: number,
  decimalsToRound: number
) {
  let eth = formatUnits(value, decimals);

  let fixedEth = parseFloat(eth).toFixed(decimalsToRound);

  // Remove trailing zeros
  let ethArray = fixedEth.split(".");

  if (ethArray.length > 1) {
    let lastPart = ethArray[1].replace(/0+$/, "");

    if (lastPart.length > 0) {
      return `${ethArray[0]}.${lastPart}`;
    } else {
      return ethArray[0];
    }
  } else {
    return ethArray[0];
  }
}
