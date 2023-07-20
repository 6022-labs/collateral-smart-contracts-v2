import React from "react";

type ScreenContextType = {
  screenState: "insurer" | "client";
  switchScreenState: () => void;
};

const ScreenContext = React.createContext<ScreenContextType | undefined>(
  undefined
);

export function ScreenContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [screenState, setScreenState] = React.useState<"insurer" | "client">(
    "client"
  );

  const switchScreenState = () => {
    setScreenState((prevState) =>
      prevState === "insurer" ? "client" : "insurer"
    );
  };

  return (
    <ScreenContext.Provider value={{ screenState, switchScreenState }}>
      {children}
    </ScreenContext.Provider>
  );
}

export function useScreenContext() {
  const context = React.useContext(ScreenContext);
  if (context === undefined) {
    throw new Error(
      "useScreenContext must be used within a ScreenContextProvider"
    );
  }
  return context;
}
