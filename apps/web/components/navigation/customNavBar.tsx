"use client";

import React from "react";
import Link from "next/link";

import { Shield, Users, Home, Zap, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useAuthRedirect, useWeb3AuthLogin } from "@/hooks/useAuth";

import UserMenu from "./userMenu";

const NAV_CONFIG = {
  private: [
    { 
      label: "Dashboard", 
      path: "/dashboard", 
      icon: Users 
    },
    { 
      label: "Governance", 
      path: "/governance", 
      icon: Shield 
    },
  ],
  public: [
    { 
      label: "Home", 
      path: "/", 
      icon: Home 
    },
    { 
      label: "Research", 
      path: "/research", 
      icon: Microscope 
    },
    { 
      label: "Breakthroughs", 
      path: "/breakthroughs", 
      icon: Zap 
    },
  ],
};

const CustomNavbar = () => {
  const { isConnected } = useAuthRedirect();
  const { login, isAuthenticating } = useWeb3AuthLogin();
  const pathname = usePathname();

  const hasSessionTokens = typeof window !== "undefined" && 
    localStorage.getItem("session_token") && 
    localStorage.getItem("wallet_address");
  
  const isAuthenticated = isConnected && hasSessionTokens;
  
  const navItems = isAuthenticated ? NAV_CONFIG.private : NAV_CONFIG.public;
  const logoLink = isAuthenticated ? "/dashboard" : "/";
  
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center">
          <div className="flex items-center flex-1">
            <Link href={logoLink} className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
                <Shield className="text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent ml-2">
                Cura
              </h1>
            </Link>
          </div>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-end flex-1">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/how-it-works">
                  <Button variant="outline" size="sm">
                    How It Works
                  </Button>
                </Link>
                <Button 
                  size="sm"
                  onClick={login}
                  disabled={isAuthenticating}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                >
                  {isAuthenticating ? "Connecting..." : "Connect Wallet"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CustomNavbar;
