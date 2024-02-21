import Head from "./Head";
import Main from "./Main";
import { useAccount } from "wagmi";

export default function Dashboard() {
  const { isConnected } = useAccount();

  return (
    <>
      {!isConnected ? (
        <div className="flex justify-center items-center h-screen">
          Please connect your wallet
        </div>
      ) : (
        <>
          <Head />
          <Main />
        </>
      )}
    </>
  );
}
