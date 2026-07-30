import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { useLanguage } from '@/hooks/use-language';
import { DEMO_PASSWORD, mockUsers } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Lock, Mail, AlertCircle } from 'lucide-react';
export default function LoginPage() {
  const { login } = useAuth();
  const { setRole } = useRole();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoAccounts = mockUsers.filter((u) => u.status === 'active');
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setIsSubmitting(true);

  const result = await login(email, password);

  console.log('Login successful:', result);
  if (result.success) {

    setRole(result?.role); // "admin" from the API
  } else if (result.error === "inactive_account") {
    setError(t.login.inactiveAccount);
  } else {
    setError(t.login.invalidCredentials);
  }

  setIsSubmitting(false);
};
  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">ChatGate</h1>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">{t.login.title}</CardTitle>
            <CardDescription>{t.login.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.login.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@chatgate.sa"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t.login.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t.login.submitting : t.login.submit}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t.login.demoHint}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {demoAccounts.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => fillDemo(u.email)}
                className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted transition-colors text-muted-foreground"
              >
                {u.email} · {u.role}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/70">
            {t.login.password}: <span className="font-mono">{DEMO_PASSWORD}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
