
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WalletState {
  isConnected: boolean;
  address: string;
  alias: string;
  userType: 'data-seller' | 'researcher';
}

interface WalletContextType {
  wallet: WalletState;
  setWallet: React.Dispatch<React.SetStateAction<WalletState>>;
  handleConnectWallet: () => void;
  handleDisconnect: () => void;
  handleSwitchUserType: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: '',
    alias: '',
    userType: 'data-seller'
  });

  const handleConnectWallet = () => {
    const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const mockAlias = 'HealthUser123';
    
    setWallet({
      isConnected: true,
      address: mockAddress,
      alias: mockAlias,
      userType: 'data-seller'
    });
  };

  const handleDisconnect = () => {
    setWallet({
      isConnected: false,
      address: '',
      alias: '',
      userType: 'data-seller'
    });
  };

  const handleSwitchUserType = () => {
    setWallet(prev => ({
      ...prev,
      userType: prev.userType === 'data-seller' ? 'researcher' : 'data-seller'
    }));
  };

  return (
    <WalletContext.Provider value={{
      wallet,
      setWallet,
      handleConnectWallet,
      handleDisconnect,
      handleSwitchUserType
    }}>
      {children}
    </WalletContext.Provider>
  );
};
