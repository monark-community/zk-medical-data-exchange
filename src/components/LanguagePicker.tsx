
import React from 'react';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalization, languageNames, Language } from '@/contexts/LocalizationContext';

interface LanguagePickerProps {
  variant?: 'footer' | 'profile';
}

const LanguagePicker = ({ variant = 'footer' }: LanguagePickerProps) => {
  const { language, setLanguage, t } = useLocalization();

  const handleLanguageChange = (value: string) => {
    setLanguage(value as Language);
  };

  if (variant === 'profile') {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3 mb-3">
          <Globe className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="font-semibold text-gray-900">{t('profile.language')}</h3>
            <p className="text-sm text-gray-600">{t('profile.languageDescription')}</p>
          </div>
        </div>
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(languageNames).map(([code, name]) => (
              <SelectItem key={code} value={code}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <span className="text-gray-400 text-sm">{t('footer.language')}</span>
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-32 h-8 bg-gray-800 border-gray-700 text-gray-300">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {Object.entries(languageNames).map(([code, name]) => (
            <SelectItem 
              key={code} 
              value={code}
              className="text-gray-300 focus:bg-gray-700 focus:text-white"
            >
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguagePicker;
