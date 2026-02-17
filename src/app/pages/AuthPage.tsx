import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LanguageToggle } from '../components/shared/LanguageToggle';
import { useAppStore } from '../../store/useAppStore';
import { signIn, signUp, ensureProfile } from '../../lib/auth';
import { useTranslation } from 'react-i18next';

export function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [hotelRole, setHotelRole] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        if (!firstName.trim() || !lastName.trim() || !hotelRole.trim()) {
          setError(t('auth.fillRequired'));
          setLoading(false);
          return;
        }
        const { user } = await signUp(email, password);
        if (user) {
          await ensureProfile(user, {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            hotel_role: hotelRole.trim(),
          });
          setUser(user);
        }
      } else {
        const { user } = await signIn(email, password);
        if (user) {
          await ensureProfile(user);
          setUser(user);
        }
      }
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{
        background:
          'radial-gradient(ellipse at top, rgba(14, 40, 20, 0.8) 0%, transparent 60%), radial-gradient(ellipse at bottom, rgba(10, 30, 15, 0.7) 0%, transparent 60%), linear-gradient(135deg, #050f08 0%, #0a1810 15%, #0e2414 30%, #081a0f 50%, #0c2212 70%, #061408 85%, #030a05 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute top-4 end-4">
        <LanguageToggle />
      </div>
      <div className="glass-card rounded-2xl px-10 py-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Building2 className="w-16 h-16 text-primary mb-3" strokeWidth={1.5} />
          <h1 className="text-xl font-bold text-primary tracking-widest uppercase">Reziro</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp ? t('auth.createAccount') : t('auth.signInContinue')}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" dir="ltr">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                <Input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required={isSignUp}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                <Input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required={isSignUp}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hotelRole">{t('auth.hotelRole')}</Label>
                <Input
                  id="hotelRole"
                  type="text"
                  autoComplete="organization-title"
                  value={hotelRole}
                  onChange={(e) => setHotelRole(e.target.value)}
                  required={isSignUp}
                  placeholder={t('auth.hotelRolePlaceholder')}
                  className="w-full"
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '...' : isSignUp ? t('auth.signUp') : t('auth.logIn')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => { setIsSignUp((v) => !v); setError(null); }}
          >
            {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.needAccount')}
          </Button>
        </form>
      </div>
    </div>
  );
}
