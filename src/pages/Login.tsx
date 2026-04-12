import { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (isSignUp && password !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    if (isSignUp && password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Conta criada!',
          description: data.session
            ? 'Cadastro concluído. Entrando na sua conta...'
            : 'Cadastro concluído. Faça login com e-mail e senha.',
        });

        if (!data.session) {
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let message = 'Tente novamente mais tarde.';
      if (error.message?.includes('Invalid login credentials')) {
        message = 'E-mail ou senha incorretos.';
      } else if (error.message?.includes('User already registered')) {
        message = 'Este e-mail já está cadastrado. Faça login.';
      } else if (error.message?.includes('Email not confirmed')) {
        message = 'Confirme seu e-mail antes de fazer login.';
      }
      toast({
        title: isSignUp ? 'Erro ao criar conta' : 'Erro ao fazer login',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({
        title: 'E-mail necessário',
        description: 'Digite seu e-mail no campo acima para recuperar a senha.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      toast({
        title: 'E-mail enviado!',
        description: 'Verifique sua caixa de entrada (ou spam) para redefinir a senha.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao redefinir',
        description: error.message || 'Erro desconhecido',
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
          <CardTitle className="text-lg">
            {isSignUp ? 'Criar conta' : 'Bem-vindo!'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!isSignUp && (
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-xs text-primary underline hover:text-primary/80"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2"
              size="lg"
            >
              {isSignUp ? (
                <>
                  <UserPlus className="h-5 w-5" />
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  {loading ? 'Entrando...' : 'Entrar'}
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-primary underline hover:text-primary/80"
              >
                {isSignUp ? 'Fazer login' : 'Criar conta'}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
