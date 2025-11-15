import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Load language preference on mount
  useEffect(() => {
    loadLanguagePreference();
  }, [user]);

  const loadLanguagePreference = async () => {
    try {
      // First, try to get from user's profile in Supabase if logged in
      if (user?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('language_preference')
          .eq('id', user.id)
          .single();

        if (!error && data?.language_preference) {
          await i18n.changeLanguage(data.language_preference);
          localStorage.setItem('i18nextLng', data.language_preference);
          return;
        }
      }

      // Fall back to localStorage or browser detection (handled by i18next-browser-languagedetector)
      const storedLang = localStorage.getItem('i18nextLng');
      if (storedLang) {
        await i18n.changeLanguage(storedLang);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const changeLanguage = async (lang: string) => {
    setIsLoading(true);
    try {
      // Change language in i18next
      await i18n.changeLanguage(lang);

      // Save to localStorage
      localStorage.setItem('i18nextLng', lang);

      // Save to Supabase if user is logged in
      if (user?.id) {
        const { error } = await supabase
          .from('users')
          .update({ language_preference: lang })
          .eq('id', user.id);

        if (error) {
          console.error('Error saving language preference to database:', error);
        }
      }
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LanguageContext.Provider value={{ language: i18n.language, changeLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
