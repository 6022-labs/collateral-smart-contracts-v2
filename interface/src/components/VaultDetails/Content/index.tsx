import React from "react";
import { Vault } from "@/types/Vault";
import LeftContent from "./LeftContent";
import RightContent from "./RightContent";

type ContentProps = {
  vault: Vault;
};

export default function Content(props: Readonly<ContentProps>) {
  const leftContentRef = React.useRef<HTMLDivElement>(null);
  const rightContentRef = React.useRef<HTMLDivElement>(null);

  const updateCollateralCardWidth = () => {
    let leftContentCard = leftContentRef.current?.querySelector(".card");
    if (leftContentCard) {
      let rightContentCard = rightContentRef.current?.querySelector(
        ".card"
      ) as HTMLElement;
      if (rightContentCard) {
        rightContentCard.style.width = getComputedStyle(leftContentCard).width;
        rightContentCard.style.minWidth =
          getComputedStyle(leftContentCard).width;
      }
    }
  };

  React.useEffect(() => {
    window.addEventListener("resize", updateCollateralCardWidth);
    // Initial check
    updateCollateralCardWidth();
    return () => {
      window.removeEventListener("resize", updateCollateralCardWidth);
    };
  }, []);

  return (
    <div className="flex flex-col gap-y-4 text-xxs px-5 py-5 h-full sm:px-10 sm:flex-row sm:justify-between lg:text-xs">
      <LeftContent ref={leftContentRef} vault={props.vault} />
      <RightContent ref={rightContentRef} vault={props.vault} />
    </div>
  );
}
