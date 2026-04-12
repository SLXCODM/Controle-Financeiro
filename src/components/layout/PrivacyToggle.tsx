import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/context/FinanceContext';

export function PrivacyToggle() {
  const { settings, updateSettings } = useFinance();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => updateSettings({ privacyMode: !settings.privacyMode })}
      className="h-9 w-9"
      title={settings.privacyMode ? 'Mostrar valores' : 'Esconder valores'}
    >
      {settings.privacyMode ? (
        <EyeOff className="h-5 w-5" />
      ) : (
        <Eye className="h-5 w-5" />
      )}
    </Button>
  );
}
