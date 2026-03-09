import { useState } from 'react';
import { Eye, EyeOff, Download, Upload, User, LogOut } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { settings, updateSettings } = useFinance();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(settings.displayName);

  const handleSaveName = () => {
    updateSettings({ displayName });
    toast({ title: 'Nome atualizado', description: 'Suas configurações foram salvas.' });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Desconectado', description: 'Você saiu da sua conta.' });
  };

  return (
    <div className="safe-top safe-bottom min-h-full p-4 pb-24 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Personalize seu app</p>
      </div>

      {/* Profile */}
      <Card className="mb-6 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="displayName">Nome de Exibição</Label>
              <div className="flex gap-2">
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" />
                <Button onClick={handleSaveName}>Salvar</Button>
              </div>
              {user?.email && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="mb-6 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Preferências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.privacyMode ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
              <div>
                <p className="font-semibold">Modo Privacidade</p>
                <p className="text-sm text-muted-foreground">Oculta os valores monetários</p>
              </div>
            </div>
            <Switch checked={settings.privacyMode} onCheckedChange={(checked) => updateSettings({ privacyMode: checked })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Moeda</p>
              <p className="text-sm text-muted-foreground">Selecione sua moeda</p>
            </div>
            <Select value={settings.currency} onValueChange={(value) => updateSettings({ currency: value })}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">R$ BRL</SelectItem>
                <SelectItem value="USD">$ USD</SelectItem>
                <SelectItem value="EUR">€ EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="mb-6 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Seus dados estão sincronizados na nuvem e protegidos com sua conta Google.
          </p>
          <Button variant="destructive" onClick={handleSignOut} className="w-full gap-2">
            <LogOut className="h-4 w-4" />
            Sair da Conta
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p className="gradient-text font-semibold">SLX Finance</p>
        <p>Versão 2.0.0</p>
        <p className="mt-2">Feito com 💜 para seu controle financeiro</p>
      </div>
    </div>
  );
}
