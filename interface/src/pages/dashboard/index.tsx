import Overview from "./Overview";
import { useAccount } from "wagmi";
import Presentation from "./Presentation";

export default function Dashboard() {
  const { isConnected } = useAccount();

  return <>{!isConnected ? <Presentation /> : <Overview />}</>;
}
