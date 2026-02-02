import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Search, 
  Plus, 
  ChevronRight, 
  FileText, 
  Lightbulb, 
  Settings,
  LogOut,
  X,
  ArrowLeft,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { toast } from 'sonner';

type LifecycleStage = 'Pre-Event' | 'Event' | 'Post-Event';

interface DemoScenario {
  id: string;
  name: string;
  stage: boolean;
  lifecycleStage: LifecycleStage;
  time: string;
  status: 'Activated' | 'Inactive';
}

const initialScenarios: DemoScenario[] = [
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

interface ScenarioDrawerProps {
  scenario: DemoScenario | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: DemoScenario) => void;
}

function ScenarioDrawer({ scenario, isOpen, onClose, onSave }: ScenarioDrawerProps) {
  const [formData, setFormData] = useState<DemoScenario | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Update form when scenario changes
  useState(() => {
    if (scenario) {
      setFormData({ ...scenario });
      // Parse the time string to a Date
      const timeParts = scenario.time.split(' ');
      if (timeParts.length === 2) {
        const [datePart, timePart] = timeParts;
        const dateObj = new Date(`${datePart}T${timePart}`);
        if (!isNaN(dateObj.getTime())) {
          setSelectedDate(dateObj);
        }
      }
    }
  });

  // Reset form when scenario changes
  if (scenario && formData?.id !== scenario.id) {
    setFormData({ ...scenario });
    const timeParts = scenario.time.split(' ');
    if (timeParts.length === 2) {
      const dateObj = new Date(`${timeParts[0]}T${timeParts[1]}`);
      if (!isNaN(dateObj.getTime())) {
        setSelectedDate(dateObj);
      }
    }
  }

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      toast.success('Scenario saved');
      onClose();
    }
  };

  const updateField = <K extends keyof DemoScenario>(key: K, value: DemoScenario[K]) => {
    if (formData) {
      setFormData({ ...formData, [key]: value });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && formData) {
      const timeStr = format(date, 'yyyy-MM-dd HH:mm');
      setFormData({ ...formData, time: timeStr });
    }
  };

  if (!formData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[480px] bg-card border-l border-border shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-lg font-semibold">Scenario Details</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-6">
                {/* Scenario Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Scenario Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Enter scenario name"
                  />
                </div>

                {/* Scenario Stage */}
                <div className="space-y-2">
                  <Label>Scenario Stage</Label>
                  <Select
                    value={formData.stage ? 'yes' : 'no'}
                    onValueChange={(value) => updateField('stage', value === 'yes')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Scenario Time */}
                <div className="space-y-2">
                  <Label>Scenario Time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !selectedDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP p') : 'Pick a date & time'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Lifecycle Stage */}
                <div className="space-y-2">
                  <Label>Lifecycle Stage</Label>
                  <Select
                    value={formData.lifecycleStage}
                    onValueChange={(value) => updateField('lifecycleStage', value as LifecycleStage)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pre-Event">Pre-event</SelectItem>
                      <SelectItem value="Event">During-event</SelectItem>
                      <SelectItem value="Post-Event">Post-event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => updateField('status', value as 'Activated' | 'Inactive')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activated">Activated</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                Save
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function AppPage() {
  const [scenarios, setScenarios] = useState<DemoScenario[]>(initialScenarios);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { logout } = useAuth();

  const filteredScenarios = scenarios.filter(scenario =>
    scenario.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRowClick = (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    setIsDrawerOpen(true);
  };

  const handleSave = (updated: DemoScenario) => {
    setScenarios(prev => 
      prev.map(s => s.id === updated.id ? updated : s)
    );
    setSelectedScenario(updated);
  };

  const handleNewScenario = () => {
    const newScenario: DemoScenario = {
      id: String(Date.now()),
      name: 'New Scenario',
      stage: false,
      lifecycleStage: 'Pre-Event',
      time: format(new Date(), 'yyyy-MM-dd HH:mm'),
      status: 'Inactive',
    };
    setScenarios(prev => [newScenario, ...prev]);
    setSelectedScenario(newScenario);
    setIsDrawerOpen(true);
  };

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

          <Button className="gap-2" onClick={handleNewScenario}>
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
                      onClick={() => handleRowClick(scenario)}
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

      {/* Scenario Details Drawer */}
      <ScenarioDrawer
        scenario={selectedScenario}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
