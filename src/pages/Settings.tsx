import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Palette, User, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/LanguageSelector";

export default function Settings() {
  const { t } = useTranslation();
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>

      <Card className="p-8 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">{t('settings.language.title')}</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">{t('settings.language.selectLanguage')}</Label>
            <p className="text-sm text-muted-foreground mb-4">{t('settings.language.description')}</p>
            <div className="flex items-center gap-4">
              <LanguageSelector variant="outline" showLabel={true} className="px-6 py-3" />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">{t('settings.theme.title')}</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">{t('settings.theme.selectTheme')}</Label>
            <div className="grid grid-cols-4 gap-4">
              {[
                { key: "light", label: t('settings.theme.light') },
                { key: "dark", label: t('settings.theme.dark') },
                { key: "futuristic", label: t('settings.theme.futuristic') },
                { key: "highContrast", label: t('settings.theme.highContrast') }
              ].map((theme) => (
                <button
                  key={theme.key}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    theme.key === "light"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-sm font-medium text-foreground">{theme.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">{t('settings.profile.title')}</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-white text-3xl font-bold">
            T
          </div>
          <div className="flex-1 space-y-2">
            <Button variant="outline" className="rounded-xl">
              {t('settings.profile.uploadPhoto')}
            </Button>
            <p className="text-sm text-muted-foreground">{t('settings.profile.photoRecommendation')}</p>
          </div>
        </div>
      </Card>

      <Card className="p-8 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">{t('settings.dataManagement.title')}</h2>
        </div>
        <div className="space-y-3">
          <Button variant="outline" className="w-full rounded-xl justify-start">
            {t('settings.dataManagement.exportClassData')}
          </Button>
          <Button variant="outline" className="w-full rounded-xl justify-start text-destructive hover:text-destructive">
            {t('settings.dataManagement.clearAssessmentHistory')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
