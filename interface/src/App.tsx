import Stake from "./pages/stake";
import Markets from "./pages/markets";
import Header from "./components/Header";
import Dashboard from "./pages/dashboard";
import Governance from "./pages/governance";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { OwnedVaultsContextProvider } from "./contexts/OwnedVaultsContext";
import { CreatedRewardPoolContextProvider } from "./contexts/CreatedRewardPoolContext";

function App() {
  return (
    <CreatedRewardPoolContextProvider>
      <OwnedVaultsContextProvider>
        <ToastContainer />
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="stake" element={<Stake />} />
            <Route path="markets" element={<Markets />} />
            <Route path="governance" element={<Governance />} />
          </Routes>
        </BrowserRouter>
      </OwnedVaultsContextProvider>
    </CreatedRewardPoolContextProvider>
  );
}

export default App;
