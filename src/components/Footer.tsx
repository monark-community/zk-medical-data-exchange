
import React from 'react';
import { Shield, Twitter, Github, MessageCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import LanguagePicker from './LanguagePicker';

const Footer = () => {
  const { wallet } = useWallet();
  const { t } = useLocalization();

  const links = {
    platform: [
      { name: t('footer.howItWorks'), href: '/how-it-works' },
      { name: t('footer.privacyPolicy'), href: '#' },
      { name: t('footer.termsOfService'), href: '#' },
      { name: t('footer.security'), href: '#' }
    ],
    research: [
      { name: t('footer.forResearchers'), href: '#' },
      { name: t('footer.dataCatalog'), href: '#' },
      { name: t('footer.apiDocumentation'), href: '#' },
      { name: t('footer.ethicsGuidelines'), href: '#' }
    ],
    community: [
      { name: t('footer.daoGovernance'), href: '#' },
      { name: t('footer.forum'), href: '#' },
      { name: t('footer.blog'), href: '#' },
      { name: t('footer.support'), href: '#' }
    ]
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: MessageCircle, href: '#', label: 'Discord' },
    { icon: Mail, href: '#', label: 'Email' }
  ];

  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold">Cura</span>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-6">{t('footer.platform')}</h3>
            <ul className="space-y-3">
              {links.platform.map((link, index) => (
                <li key={index}>
                  {link.href.startsWith('/') ? (
                    <Link 
                      to={link.href} 
                      className="text-gray-300 hover:text-white transition-colors"
                      onClick={handleLinkClick}
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a href={link.href} className="text-gray-300 hover:text-white transition-colors">
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-6">{t('footer.research')}</h3>
            <ul className="space-y-3">
              {links.research.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-gray-300 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-6">{t('footer.community')}</h3>
            <ul className="space-y-3">
              {links.community.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-gray-300 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              {t('footer.copyright')}
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              {!wallet.isConnected && <LanguagePicker variant="footer" />}
              <div className="flex items-center space-x-4">
                <span className="text-gray-400 text-sm">{t('footer.poweredBy')}</span>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-300">Midnight Network</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-300">The Graph</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-300">IPFS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
