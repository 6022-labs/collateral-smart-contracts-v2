import Header from "./components/Header";
import { useScreenContext } from "./contexts/ScreenContext";

function App() {
  const { screenState } = useScreenContext();

  return (
    <>
      <Header />
      <div className="flex justify-center items-center h-screen">
        {screenState === "insurer" ? "Insurer" : "Client"}
      </div>
    </>
  );
}

export default App;
