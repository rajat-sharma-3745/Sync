import { useRef, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import Avatar from "../ui/Avatar";
import PageContainer from "./PageContainer";
import { useAuth } from "../../hooks/useAuth";
import clsx from "clsx";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "rounded px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-navbar-bg)",
    isActive ? "text-neutral-50" : "text-neutral-300 hover:text-neutral-50",
  );

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      const insidePanel = mobileMenuRef.current?.contains(target);
      const insideToggle = mobileMenuButtonRef.current?.contains(target);
      if (!insidePanel && !insideToggle) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <header
      className="sticky top-0 z-50 border-b border-(--color-navbar-border) bg-(--color-navbar-bg)/95 backdrop-blur"
      role="banner"
    >
      <PageContainer>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-navbar-bg)"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              ●
            </span>
            <span className="text-base font-semibold tracking-tight text-neutral-50">
              Sync
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 text-neutral-300 sm:flex"
            aria-label="Main navigation"
          >
            {isAuthenticated && (
              <NavLink to="/rooms" className={navLinkClass}>
                Rooms
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <IconButton
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label="Open user menu"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="h-9 w-9 p-0"
                >
                  <Avatar
                    name={user?.username}
                    variant="dark"
                    className="h-9 w-9"
                  />
                </IconButton>
                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-lg"
                    role="menu"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <span className="hidden sm:inline-flex">
                <Button asChild size="sm" variant="secondary">
                  <Link to="/login">Log in</Link>
                </Button>
              </span>
            )}

            <div ref={mobileMenuButtonRef} className="flex sm:hidden">
              <IconButton
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                className="sm:hidden"
                onClick={() => {
                  setMobileMenuOpen((p) => !p);
                }}
              >
                {mobileMenuOpen ? (
                  <span className="text-lg leading-none" aria-hidden>
                    ×
                  </span>
                ) : (
                  <span className="flex flex-col gap-1" aria-hidden>
                    <span className="h-0.5 w-4 bg-current" />
                    <span className="h-0.5 w-4 bg-current" />
                    <span className="h-0.5 w-4 bg-current" />
                  </span>
                )}
              </IconButton>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="absolute left-0 right-0 top-16 z-40 border-b border-(--color-navbar-border) bg-(--color-navbar-bg) py-3 sm:hidden"
            role="dialog"
            aria-label="Mobile navigation"
          >
            <nav className="flex flex-col gap-1 px-4">
              {isAuthenticated && (
                <NavLink
                  to="/rooms"
                  className={navLinkClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Rooms
                </NavLink>
              )}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="rounded px-2 py-1.5 text-sm text-neutral-300 hover:text-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
              )}
            </nav>
          </div>
        )}
      </PageContainer>
    </header>
  );
};

export default Navbar;
