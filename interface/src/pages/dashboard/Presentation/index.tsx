import Footer from "./Footer";
import Main from "./Main";

export default function Presentation() {
  return (
    <div className="flex flex-col grow bg-very-black text-white justify-between items-center">
      <Main />
      <Footer />
    </div>
  );
}
