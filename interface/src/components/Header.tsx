import HeaderLink from "./HeaderLink";
import HeaderButton from "./HeaderButton";
import { useLocation } from "react-router-dom";
import WalletConnectButton from "./WalletConnectButton";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Links = [
  {
    href: "/",
    label: "Dashboard",
  },
  {
    href: "/markets",
    label: "Markets",
  },
  {
    href: "/stake",
    label: "Stake",
  },
  {
    href: "/governance",
    label: "Governance",
  },
];

export default function Header() {
  const location = useLocation();

  return (
    <header className="py-1 bg-primary text-white px-8 border-b-2 border-b-secondary">
      <div className="flex items-center">
        <div className="flex w-full justify-start items-center">
          <img className="h-10" src="/logo.png" alt="logo" />
          <nav>
            <ul className="flex gap-x-4 ml-8">
              {Links.map((link) => {
                return (
                  <HeaderLink
                    key={link.href}
                    href={link.href}
                    current={link.href == location.pathname}
                  >
                    {link.label}
                  </HeaderLink>
                );
              })}
            </ul>
          </nav>
        </div>
        <div className="flex justify-center gap-x-2 items-center">
          <WalletConnectButton />
          <HeaderButton onClick={() => {}} type="button">
            <FontAwesomeIcon icon={faGear} />
          </HeaderButton>
        </div>
      </div>
    </header>
  );
}
