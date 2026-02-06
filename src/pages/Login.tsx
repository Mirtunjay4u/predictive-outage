import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginDemo } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
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
            <div className="flex items-center gap-3 mb-16">
              <div className="w-11 h-11 rounded-xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/10">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Operator Copilot</h1>
                <p className="text-xs text-primary-foreground/70 font-medium tracking-wide uppercase">Predictive Outage Management</p>
              </div>
            </div>
            
            {/* B) Primary Headline */}
            <h2 className="text-[2.75rem] xl:text-5xl font-bold leading-[1.1] tracking-tight mb-5 max-w-lg">
              Grid Resilience<br />Command Center
            </h2>
            
            {/* C) Value Statement */}
            <p className="text-lg text-primary-foreground/90 font-medium mb-10 max-w-md leading-relaxed">
              AI-assisted event prioritization, restoration decision support, and customer communications.
            </p>
            
            {/* D) Capabilities - 3 Bullets */}
            <ul className="space-y-3 max-w-md">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 mt-2.5 flex-shrink-0" />
                <span className="text-primary-foreground/85 text-[15px] leading-relaxed">Track outage events and operational status</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 mt-2.5 flex-shrink-0" />
                <span className="text-primary-foreground/85 text-[15px] leading-relaxed">Review ETR confidence bands and critical-load runway</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60 mt-2.5 flex-shrink-0" />
                <span className="text-primary-foreground/85 text-[15px] leading-relaxed">Generate operator-approved updates, reports, and escalation messages</span>
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
            Decision-support only. No control actions. No live SCADA/OMS/ADMS integration in demo mode.
          </motion.p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
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

          <Card className="shadow-elevated border-border/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to access your scenario workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gap-2" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button 
                type="button"
                variant="outline" 
                className="w-full gap-2"
                onClick={loginDemo}
              >
                <Sparkles className="w-4 h-4" />
                Continue in Demo Mode
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Explore the platform using synthetic demo events (no live system access).
              </p>
              
              <p className="text-[10px] text-center text-muted-foreground/70 mt-6 pt-4 border-t border-border">
                Decision-support only. No control actions. No live SCADA/OMS/ADMS integration in demo mode.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
