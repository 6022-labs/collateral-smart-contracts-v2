import Stake from "./pages/stake";
import Markets from "./pages/markets";
import Header from "./components/Header";
import Dashboard from "./pages/dashboard";
import Governance from "./pages/governance";
import { Route, Routes, BrowserRouter } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="stake" element={<Stake />} />
        <Route path="markets" element={<Markets />} />
        <Route path="governance" element={<Governance />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
