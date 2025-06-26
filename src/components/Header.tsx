import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Users, Settings, User, LogOut, Wallet, Microscope, Zap, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWallet } from '@/contexts/WalletContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { wallet, handleConnectWallet, handleDisconnect, handleSwitchUserType } = useWallet();

  const connectWallet = async () => {
    handleConnectWallet();
    navigate('/dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const disconnect = () => {
    handleDisconnect();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProfileClick = () => {
    navigate('/profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatAddress = (address: string) => {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleLogoClick = () => {
    if (wallet.isConnected) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigation items for non-connected users
  const publicNavItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Active Research', path: '/research', icon: Microscope },
    { name: 'Breakthroughs', path: '/breakthroughs', icon: Zap },
  ];

  // Navigation items for connected users
  const privateNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Users },
    { name: 'Governance', path: '/governance', icon: Settings },
  ];

  const currentNavItems = wallet.isConnected ? privateNavItems : publicNavItems;

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button onClick={handleLogoClick} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Cura
            </span>
          </button>

          <nav className="hidden md:flex items-center space-x-6">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4">
            {!wallet.isConnected ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    navigate('/how-it-works');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Get Started
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-teal-600" onClick={connectWallet}>
                  Connect Wallet
                </Button>
              </>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2 h-10">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-teal-500 text-white">
                        {wallet.alias.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{wallet.alias}</span>
                      <span className="text-xs text-gray-500">{formatAddress(wallet.address)}</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-2">
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      Current view: {wallet.userType === 'data-seller' ? 'Data Seller' : 'Researcher'}
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={handleProfileClick}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={handleSwitchUserType}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Switch to {wallet.userType === 'data-seller' ? 'Researcher' : 'Data Seller'}
                    </Button>
                    <hr className="my-1" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={disconnect}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
