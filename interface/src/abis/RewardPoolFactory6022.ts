export const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_controllerAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "_protocolTokenAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AlreadyCreatedRewardPool",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "rewardPool",
        type: "address",
      },
    ],
    name: "RewardPoolCreated",
    type: "event",
  },
  {
    inputs: [],
    name: "controller",
    outputs: [
      {
        internalType: "contract IController6022",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_lifetimeVaultAmount",
        type: "uint256",
      },
    ],
    name: "createRewardPool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "protocolTokenAddress",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
