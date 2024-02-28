import React from "react";
import HeaderLink from "./HeaderLink";
import HeaderButton from "./HeaderButton";
import { useLocation } from "react-router-dom";
import WalletConnectButton from "./WalletConnectButton";
import { faBars, faGear } from "@fortawesome/free-solid-svg-icons";
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

  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);

  return (
    <header className="py-2 relative bg-primary text-white border-b-2 border-b-secondary">
      <div className="flex items-center px-3 sm:px-8">
        <div className="flex w-full justify-start items-center">
          <img className="h-10" src="/logo.png" alt="logo" />
          <nav className="justify-self-center font-semibold hidden sm:flex sm:items-center">
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
          <button
            type="button"
            className="block relative p-1.5 float-right sm:ml-3 sm:hidden"
            aria-label="menu"
            aria-haspopup="menu"
            onClick={() => {
              setMenuOpen((value) => !value);
            }}
          >
            <FontAwesomeIcon width={20} height={20} icon={faBars} />
          </button>
        </div>
        {menuOpen && (
          <div className="block h-44 absolute overflow-hidden top-full inset-x-0 w-full sm:hidden">
            <nav
              role="navigation"
              className="flex flex-col block inset-x-0 font-semibold top-0 p-6 bg-secondary"
            >
              {Links.map((link) => {
                return (
                  <HeaderLink
                    className="w-fit"
                    key={link.href}
                    href={link.href}
                    current={link.href == location.pathname}
                  >
                    {link.label}
                  </HeaderLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
