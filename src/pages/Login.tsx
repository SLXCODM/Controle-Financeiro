import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { lovable } from '@/integrations/lovable';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({
          title: 'Erro ao fazer login',
          description: 'Não foi possível conectar com o Google.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Erro ao fazer login',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <h1 className="gradient-text text-3xl font-bold">SLX Finance</h1>
            <p className="text-sm text-muted-foreground">Controle Financeiro Inteligente</p>
          </div>
          <CardTitle className="text-lg">Bem-vindo!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Faça login para sincronizar seus dados na nuvem e nunca perder suas informações.
          </p>
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full gap-2"
            size="lg"
          >
            <LogIn className="h-5 w-5" />
            {loading ? 'Conectando...' : 'Entrar com Google'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Seus dados ficam seguros e sincronizados automaticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
