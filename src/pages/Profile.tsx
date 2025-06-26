
import React from 'react';
import { User, Wallet, Settings, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Profile = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-8 py-12 text-white">
            <div className="flex items-center space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl bg-white/20 text-white">
                  HU
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">HealthUser123</h1>
                <p className="text-blue-100 mb-2">0x1234...5678</p>
                <div className="flex items-center space-x-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Data Seller</span>
                  <span className="bg-green-500/80 px-3 py-1 rounded-full text-sm flex items-center">
                    <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
                    Connected
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Account Settings */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Settings className="w-6 h-6 mr-2 text-blue-600" />
                  Account Settings
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Wallet Address</h3>
                    <p className="text-gray-600 font-mono text-sm">0x1234567890abcdef1234567890abcdef12345678</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">User Alias</h3>
                    <p className="text-gray-600">HealthUser123</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Account Type</h3>
                    <p className="text-gray-600">Data Seller</p>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Database className="w-6 h-6 mr-2 text-teal-600" />
                  Activity Summary
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-1">Data Contributions</h3>
                    <p className="text-2xl font-bold text-blue-600">12</p>
                    <p className="text-blue-700 text-sm">Datasets shared</p>
                  </div>
                  
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <h3 className="font-semibold text-teal-900 mb-1">Earnings</h3>
                    <p className="text-2xl font-bold text-teal-600">$247.50</p>
                    <p className="text-teal-700 text-sm">Total rewards earned</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-1">Privacy Score</h3>
                    <p className="text-2xl font-bold text-green-600">100%</p>
                    <p className="text-green-700 text-sm">Data always protected</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex flex-wrap gap-4">
                <Button className="bg-gradient-to-r from-blue-600 to-teal-600">
                  Edit Profile
                </Button>
                <Button variant="outline">
                  Privacy Settings
                </Button>
                <Button variant="outline">
                  Download Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
