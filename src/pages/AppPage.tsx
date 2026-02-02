import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  ChevronRight, 
  FileText, 
  Lightbulb, 
  Settings,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type LifecycleStage = 'Pre-Event' | 'Event' | 'Post-Event';

interface DemoScenario {
  id: string;
  name: string;
  stage: boolean;
  lifecycleStage: LifecycleStage;
  time: string;
  status: 'Activated' | 'Inactive';
}

const demoScenarios: DemoScenario[] = [
  {
    id: '1',
    name: 'Emergency Response Protocol',
    stage: true,
    lifecycleStage: 'Pre-Event',
    time: '2026-02-15 09:00',
    status: 'Activated',
  },
  {
    id: '2',
    name: 'Scheduled Maintenance Window',
    stage: true,
    lifecycleStage: 'Event',
    time: '2026-02-10 14:30',
    status: 'Activated',
  },
  {
    id: '3',
    name: 'Customer Onboarding Flow',
    stage: false,
    lifecycleStage: 'Pre-Event',
    time: '2026-02-20 10:00',
    status: 'Inactive',
  },
  {
    id: '4',
    name: 'Security Audit Preparation',
    stage: true,
    lifecycleStage: 'Post-Event',
    time: '2026-02-08 16:00',
    status: 'Activated',
  },
  {
    id: '5',
    name: 'Product Launch Sequence',
    stage: false,
    lifecycleStage: 'Pre-Event',
    time: '2026-03-01 08:00',
    status: 'Inactive',
  },
  {
    id: '6',
    name: 'Quarterly Review Process',
    stage: true,
    lifecycleStage: 'Event',
    time: '2026-02-28 11:00',
    status: 'Activated',
  },
];

const navItems = [
  { label: 'Scenarios', icon: FileText, active: true, href: '/app' },
  { label: 'Insights', icon: Lightbulb, active: false, href: '#' },
  { label: 'Settings', icon: Settings, active: false, href: '#' },
];

function LifecycleBadge({ stage }: { stage: LifecycleStage }) {
  const colors: Record<LifecycleStage, string> = {
    'Pre-Event': 'bg-warning/20 text-warning border-warning/30',
    'Event': 'bg-primary/20 text-primary border-primary/30',
    'Post-Event': 'bg-accent/20 text-accent-foreground border-accent/30',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', colors[stage])}>
      {stage}
    </Badge>
  );
}

function StatusPill({ status }: { status: 'Activated' | 'Inactive' }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          status === 'Activated' ? 'bg-primary' : 'bg-muted-foreground/50'
        )}
      />
      <span className={cn(
        'text-sm font-medium',
        status === 'Activated' ? 'text-primary' : 'text-muted-foreground'
      )}>
        {status}
      </span>
    </div>
  );
}

export default function AppPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { logout } = useAuth();

  const filteredScenarios = demoScenarios.filter(scenario =>
    scenario.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 border-r border-border bg-card flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Scenario Studio</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    item.active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" />
            Log out
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="h-16 px-6 flex items-center justify-between border-b border-border bg-card"
        >
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>

          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Scenario
          </Button>
        </motion.header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Scenarios</h1>
              <p className="text-muted-foreground">
                Manage and monitor your operational scenarios
              </p>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Scenario Name</TableHead>
                    <TableHead className="font-semibold">Stage</TableHead>
                    <TableHead className="font-semibold">Lifecycle</TableHead>
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScenarios.map((scenario, index) => (
                    <motion.tr
                      key={scenario.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="group cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium">{scenario.name}</TableCell>
                      <TableCell>
                        <span className={cn(
                          'text-sm font-medium',
                          scenario.stage ? 'text-primary' : 'text-muted-foreground'
                        )}>
                          {scenario.stage ? 'Yes' : 'No'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <LifecycleBadge stage={scenario.lifecycleStage} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {scenario.time}
                      </TableCell>
                      <TableCell>
                        <StatusPill status={scenario.status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>

              {filteredScenarios.length === 0 && (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No scenarios found</p>
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
