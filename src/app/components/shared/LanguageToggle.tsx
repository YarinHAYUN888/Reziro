import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

export function LanguageToggle() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Update document direction based on language
    const dir = i18n.language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', i18n.language);
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
    const dir = newLang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', newLang);
  };

  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      className="border border-border hover:bg-muted transition-colors px-6 h-11 font-semibold text-base"
    >
      <span className={i18n.language === 'en' ? 'text-primary' : 'text-muted-foreground'}>
        ENG
      </span>
      <span className="mx-2 text-muted-foreground">|</span>
      <span className={i18n.language === 'he' ? 'text-primary' : 'text-muted-foreground'}>
        עברית
      </span>
    </Button>
  );
}