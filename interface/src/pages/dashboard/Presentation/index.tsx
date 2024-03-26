import Footer from "./Footer";
import Main from "./Main";

export default function Presentation() {
  return (
    <div className="flex grow flex-col justify-between items-center">
      <Main />
      <Footer />
    </div>
  );
}
