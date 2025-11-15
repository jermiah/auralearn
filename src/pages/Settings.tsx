import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Palette, User } from "lucide-react";

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your LearnAura experience</p>
      </div>

      <Card className="p-8 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Theme</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">Select Theme</Label>
            <div className="grid grid-cols-4 gap-4">
              {["Light", "Dark", "Futuristic", "High Contrast"].map((theme) => (
                <button
                  key={theme}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    theme === "Light"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-sm font-medium text-foreground">{theme}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Teacher Profile</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-white text-3xl font-bold">
            T
          </div>
          <div className="flex-1 space-y-2">
            <Button variant="outline" className="rounded-xl">
              Upload Photo
            </Button>
            <p className="text-sm text-muted-foreground">Recommended: 400x400px, max 2MB</p>
          </div>
        </div>
      </Card>

      <Card className="p-8 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Data Management</h2>
        </div>
        <div className="space-y-3">
          <Button variant="outline" className="w-full rounded-xl justify-start">
            Export Class Data
          </Button>
          <Button variant="outline" className="w-full rounded-xl justify-start text-destructive hover:text-destructive">
            Clear Assessment History
          </Button>
        </div>
      </Card>
    </div>
  );
}
