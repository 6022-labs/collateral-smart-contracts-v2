export function truncateEthAddress(
  address: string | undefined,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address) {
    return "";
  }

  // Ensure the address is not shorter than the sum of the start and end lengths
  if (address.length <= startLength + endLength) {
    return address; // Return the original address if it's too short to truncate
  }

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}
