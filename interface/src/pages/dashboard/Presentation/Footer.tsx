import UnderlineText from "@/components/UnderlineText";
import React from "react";

const explanations = [
  {
    title: "Dashboard",
    description: "Supply collateral into the protocol and follow your rewards",
  },
  {
    title: "Governance",
    description: "Understand 6022 governance and follow protocol upgrades",
  },
];

export default function Footer() {
  const [currentSelection, setCurrentSelection] = React.useState<number>(0);

  return (
    <div className="w-full flex flex-col gap-y-6 items-center justify-center bg-strong-blue text-white py-4 px-10 sm:flex-row sm:items-stretch sm:gap-y-0 sm:gap-x-12 md:gap-x-36">
      <div className="flex flex-col gap-y-5 py-2 text-center max-w-96">
        <div className="flex flex-col gap-y-1">
          <div className="flex justify-center items-center bg-very-black rounded-md">
            <span className="text-3xl leading-normal">$ 0</span>
          </div>
          <span>of liquidity locked in 6022 (estimation)</span>
        </div>
        <div>A total of 0 collateral locked</div>
      </div>
      <div className="flex flex-col bg-very-black py-2 rounded-xl grow min-h-32 max-w-80 px-4">
        <div className="flex justify-center text-lg gap-x-4">
          {explanations.map((explanation, index) => (
            <button
              key={explanation.title}
              onClick={() => {
                setCurrentSelection(index);
              }}
            >
              <UnderlineText
                className={`cursor-pointer ${
                  currentSelection === index ? "text-white" : "text-gray-300"
                }`}
                keep={currentSelection === index}
              >
                {explanation.title}
              </UnderlineText>
            </button>
          ))}
        </div>
        <div className="grow flex items-center px-2">
          {explanations[currentSelection].description}
        </div>
      </div>
    </div>
  );
}
