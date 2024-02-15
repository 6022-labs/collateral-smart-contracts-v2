import Head from "./Head";
import Main from "./Main";
import { useAccount } from "wagmi";

export default function Dashboard() {
  const { isConnected } = useAccount();

  return (
    <>
      {isConnected ? (
        <>
          <Head />
          <Main />
        </>
      ) : (
        <></>
      )}
    </>
  );
}
