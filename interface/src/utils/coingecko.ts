type CoingeckoSmartContractData = {
  contract_address: string;
  name: string;
  symbol: string;
  image: {
    thumb?: string;
    small?: string;
    large?: string;
  };
};

export async function getImageUrl(
  smartContractAddress: string,
  tokenType: "coin" | "nft"
): Promise<string | undefined> {
  let response = await fetch(
    `https://api.coingecko.com/api/v3/${tokenType}s/polygon-pos/contract/${smartContractAddress}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch image for ${smartContractAddress}`);
  }

  let data = (await response.json()) as CoingeckoSmartContractData;

  return data.image.thumb ?? data.image.small ?? data.image.large;
}
