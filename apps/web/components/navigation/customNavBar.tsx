"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Users, Home, Zap, Microscope, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useAuthRedirect, useWeb3AuthLogin } from "@/hooks/useAuth";
import UserMenu from "./userMenu";

const NAV_CONFIG = {
  private: [
    { label: "Dashboard", path: "/dashboard", icon: Users },
    { label: "Governance", path: "/governance", icon: Shield },
  ],
  public: [
    { label: "Home", path: "/", icon: Home },
    { label: "Research", path: "/research", icon: Microscope },
    { label: "Breakthroughs", path: "/breakthroughs", icon: Zap },
  ],
};

const Logo = ({ href }: { href: string }) => (
  <Link
    href={href}
    className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
  >
    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
      <Shield className="text-white w-5 h-5" />
    </div>
    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent ml-2">
      Cura
    </h1>
  </Link>
);

const NavLink = ({
  item,
  isActive,
  onClick,
  className = "",
}: {
  item: { label: string; path: string; icon: any };
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}) => {
  const Icon = item.icon;
  const baseStyles = "flex items-center rounded-lg transition-all duration-200";
  const activeStyles = isActive
    ? "bg-blue-50 text-blue-600 font-medium"
    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50";

  return (
    <Link
      href={item.path}
      onClick={onClick}
      className={`${baseStyles} ${activeStyles} ${className}`}
    >
      <Icon className="w-4 h-4 lg:w-4 lg:h-4" />
      <span className={className.includes("whitespace-nowrap") ? "whitespace-nowrap" : ""}>
        {item.label}
      </span>
    </Link>
  );
};

const AuthButtons = ({
  isAuthenticated,
  isAuthenticating,
  login,
  onMobileClick,
  isMobile = false,
}: {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  login: () => void;
  onMobileClick?: () => void;
  isMobile?: boolean;
}) => {
  if (isAuthenticated) {
    return isMobile ? (
      <div className="w-full flex justify-end">
        <UserMenu />
      </div>
    ) : (
      <UserMenu />
    );
  }

  const buttonSize = isMobile ? "default" : "sm";
  const buttonClass = isMobile ? "w-full" : "";

  return (
    <div className={`flex ${isMobile ? "flex-col" : "items-center"} gap-3`}>
      <Link href="/how-it-works" onClick={onMobileClick}>
        <Button variant="outline" size={buttonSize} className={buttonClass}>
          How It Works
        </Button>
      </Link>
      <Button
        size={buttonSize}
        onClick={() => {
          login();
          onMobileClick?.();
        }}
        disabled={isAuthenticating}
        className={`${buttonClass} bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700`}
      >
        {isAuthenticating ? "Connecting..." : "Connect Wallet"}
      </Button>
    </div>
  );
};

const CustomNavbar = () => {
  const { isConnected } = useAuthRedirect();
  const { login, isAuthenticating } = useWeb3AuthLogin();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status in useEffect to avoid hydration mismatch
  useEffect(() => {
    const hasSessionTokens =
      typeof window !== "undefined" &&
      localStorage.getItem("session_token") &&
      localStorage.getItem("wallet_address");

    setIsAuthenticated(!!(isConnected && hasSessionTokens));
  }, [isConnected]);

  const navItems = isAuthenticated ? NAV_CONFIG.private : NAV_CONFIG.public;
  const logoLink = isAuthenticated ? "/dashboard" : "/";

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const handleResize = () => {
      const lgBreakpoint = 1024;
      if (window.innerWidth >= lgBreakpoint) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center">
          {/* Logo */}
          <div className="flex items-center flex-1">
            <Logo href={logoLink} />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                item={item}
                isActive={pathname === item.path}
                className="space-x-2 px-3 py-2 whitespace-nowrap"
              />
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center justify-end flex-1">
            <AuthButtons
              isAuthenticated={isAuthenticated}
              isAuthenticating={isAuthenticating}
              login={login}
            />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 space-y-3 border-t border-gray-200 pt-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                item={item}
                isActive={pathname === item.path}
                onClick={closeMobileMenu}
                className="space-x-3 px-4 py-3"
              />
            ))}

            <div className="pt-3 border-t border-gray-200 space-y-2">
              <AuthButtons
                isAuthenticated={isAuthenticated}
                isAuthenticating={isAuthenticating}
                login={login}
                onMobileClick={closeMobileMenu}
                isMobile
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default CustomNavbar;
