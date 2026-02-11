import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import builderPhoto from '@/assets/builder-photo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const { login, loginDemo } = useAuth();

  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const emailError =
    !trimmedEmail
      ? 'Email is required.'
      : !emailRegex.test(trimmedEmail)
      ? 'Enter a valid email address.'
      : '';
  const passwordError = !trimmedPassword ? 'Password is required.' : '';
  const isFormValid = !emailError && !passwordError;
  const showEmailError = (emailTouched || submitAttempted) && !!emailError;
  const showPasswordError = (passwordTouched || submitAttempted) && !!passwordError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setFormError('');

    if (!isFormValid) {
      setEmailTouched(true);
      setPasswordTouched(true);
      return;
    }

    setIsLoading(true);
    try {
      await login(trimmedEmail, trimmedPassword);
    } catch {
      setFormError('Authentication failed. Please verify your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        {/* Subtle dark overlay for improved text contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_50%)]" />
        
        <div className="relative z-10 flex flex-col justify-between h-full py-12 px-12 xl:px-20 text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col"
          >
            {/* A) Brand Block - Top Left */}
            <div className="flex items-center gap-3 mb-14">
              <div className="w-11 h-11 rounded-xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/10">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Operator Copilot</h1>
                <p className="text-xs text-primary-foreground/70 font-medium tracking-wide uppercase">Your AI Assistant for Decision Support</p>
              </div>
            </div>
            
            {/* B) Primary Headline */}
            <h2 className="text-[2.5rem] xl:text-[2.75rem] font-bold leading-[1.15] tracking-tight mb-4 max-w-lg">
              Predictive Outage Management
            </h2>
            
            {/* C) Sub-headline */}
            <p className="text-[17px] text-primary-foreground/90 font-medium mb-8 max-w-md leading-relaxed">
              AI Decision Support for Utility Outage Operations
            </p>
            
            {/* D) Capabilities - 3 Bullets */}
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground/70 mb-3">
              Key capabilities
            </p>
            <ul className="space-y-3 max-w-md">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 mt-2 flex-shrink-0" />
                <span className="text-primary-foreground/80 text-[15px] leading-relaxed">Monitor outages across pre-event, active, and post-event phases.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 mt-2 flex-shrink-0" />
                <span className="text-primary-foreground/80 text-[15px] leading-relaxed">Review ETR confidence and critical-load runway in real time.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 mt-2 flex-shrink-0" />
                <span className="text-primary-foreground/80 text-[15px] leading-relaxed">Generate operator-approved updates for customers and stakeholders.</span>
              </li>
            </ul>
          </motion.div>
          
          {/* E) Safety Footer */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[11px] text-primary-foreground/50 font-medium tracking-wide mt-auto pt-8"
          >
            Decision-support only. No autonomous actions. No live SCADA/OMS/ADMS access in demo mode.
          </motion.p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-2 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Operator Copilot</span>
            </div>
            <span className="text-xs text-muted-foreground text-center">AI-assisted event prioritization, restoration decision support, and customer communications</span>
          </div>

          <Card className="shadow-xl border-border/40 bg-card/95 backdrop-blur-sm">
            <CardHeader className="px-8 pt-8 pb-2 text-center">
              <CardTitle className="text-[1.75rem] font-bold tracking-tight">Welcome back</CardTitle>
              <CardDescription className="mt-1.5 text-sm text-muted-foreground/80">
                Sign in to access your scenario workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pt-4 pb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div
                    className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    role="status"
                    aria-live="polite"
                  >
                    {formError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/75">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formError) setFormError('');
                    }}
                    onBlur={() => setEmailTouched(true)}
                    aria-invalid={showEmailError}
                    aria-describedby={showEmailError ? 'email-error' : undefined}
                    disabled={isLoading}
                    className="h-11 border-border/60 bg-background/60 px-4 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                  {showEmailError && (
                    <p id="email-error" className="text-xs text-destructive" aria-live="polite">
                      {emailError}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/75">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formError) setFormError('');
                    }}
                    onBlur={() => setPasswordTouched(true)}
                    aria-invalid={showPasswordError}
                    aria-describedby={showPasswordError ? 'password-error' : undefined}
                    disabled={isLoading}
                    className="h-11 border-border/60 bg-background/60 px-4 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                  {showPasswordError && (
                    <p id="password-error" className="text-xs text-destructive" aria-live="polite">
                      {passwordError}
                    </p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="mt-2 h-11 w-full gap-2 text-sm font-semibold" 
                  disabled={isLoading || !isFormValid}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-4 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Or</span>
                </div>
              </div>

              <Button 
                type="button"
                variant="outline" 
                className="h-11 w-full gap-2 border-border/60 text-sm font-semibold hover:bg-accent/50"
                onClick={loginDemo}
                disabled={isLoading}
              >
                <Sparkles className="w-4 h-4" />
                Continue in Demo Mode
              </Button>

              <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground/70">
                Uses pre-loaded sample outages; no live system access.
              </p>
              
              {/* Safety Disclaimer - Compliance Style */}
              <div className="mt-6 pt-5 border-t border-border/40">
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-muted/30 border border-border/30">
                  <div className="w-4 h-4 mt-0.5 rounded-full bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground/60 font-bold">i</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                    Decision-support only. No control actions. No live SCADA/OMS/ADMS integration.
                  </p>
                </div>
              </div>

              {/* Builder Credit */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={builderPhoto} alt="Builder" />
                  <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">MK</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground/60">
                  Solution prototype by Mirtunjay Kumar
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
