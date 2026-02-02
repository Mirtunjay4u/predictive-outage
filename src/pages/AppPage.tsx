import { useState, useEffect } from 'react';
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
  Calendar as CalendarIcon,
  Bot,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface CopilotResponse {
  type: 'explain' | 'validate' | 'improve';
  summary: string;
  items: { icon: 'check' | 'warning' | 'info'; text: string }[];
}

function generateCopilotResponse(scenario: DemoScenario, type: 'explain' | 'validate' | 'improve'): CopilotResponse {
  const now = new Date();
  const scenarioTime = new Date(scenario.time.replace(' ', 'T'));
  const isPast = scenarioTime < now;

  if (type === 'explain') {
    const stageStatus = scenario.stage 
      ? '✅ **Activated readiness** - This scenario is staged and ready for execution.'
      : '⚠️ **Inactive risk** - This scenario is not staged, which may delay response time.';
    
    const lifecycleInfo = {
      'Pre-Event': 'Currently in preparation phase. Focus on planning and resource allocation.',
      'Event': 'Active execution phase. Monitor closely and be ready to adapt.',
      'Post-Event': 'Review and analysis phase. Document lessons learned.',
    };

    return {
      type: 'explain',
      summary: `**${scenario.name}**\n\n${stageStatus}\n\n**Lifecycle:** ${scenario.lifecycleStage}\n${lifecycleInfo[scenario.lifecycleStage]}`,
      items: [
        { icon: scenario.stage ? 'check' : 'warning', text: scenario.stage ? 'Scenario is activated and staged' : 'Scenario is not staged - consider activating' },
        { icon: 'info', text: `Current phase: ${scenario.lifecycleStage}` },
        { icon: isPast ? 'warning' : 'check', text: isPast ? `Scheduled time has passed (${scenario.time})` : `Scheduled for ${scenario.time}` },
      ],
    };
  }

  if (type === 'validate') {
    const checks: { icon: 'check' | 'warning'; text: string }[] = [];
    
    // Check 1: Stage validation
    if (scenario.stage) {
      checks.push({ icon: 'check', text: 'Stage is activated - ready for deployment' });
    } else {
      checks.push({ icon: 'warning', text: 'Stage is inactive - scenario may not execute properly' });
    }

    // Check 2: Time validation
    if (isPast) {
      checks.push({ icon: 'warning', text: `Scheduled time (${scenario.time}) is in the past - update required` });
    } else {
      checks.push({ icon: 'check', text: 'Scheduled time is valid and in the future' });
    }

    // Check 3: Lifecycle consistency
    if (scenario.lifecycleStage === 'Post-Event' && scenario.stage) {
      checks.push({ icon: 'warning', text: 'Post-Event scenarios typically should not be staged' });
    } else {
      checks.push({ icon: 'check', text: 'Lifecycle stage is consistent with current status' });
    }

    // Check 4: Status alignment
    if (scenario.status === 'Activated' && !scenario.stage) {
      checks.push({ icon: 'warning', text: 'Status is Activated but Stage is No - misalignment detected' });
    } else {
      checks.push({ icon: 'check', text: 'Status and Stage are properly aligned' });
    }

    const passedChecks = checks.filter(c => c.icon === 'check').length;
    
    return {
      type: 'validate',
      summary: `**Validation Results**\n\n${passedChecks}/${checks.length} checks passed for "${scenario.name}"`,
      items: checks,
    };
  }

  // Improvements
  const improvements: { icon: 'info'; text: string }[] = [];
  
  if (!scenario.stage) {
    improvements.push({ icon: 'info', text: '**Activate the stage** to ensure the scenario is ready for immediate execution when needed.' });
  }
  
  if (scenario.lifecycleStage === 'Pre-Event') {
    improvements.push({ icon: 'info', text: '**Add contingency plans** - Pre-event scenarios benefit from documented fallback procedures.' });
  }
  
  if (isPast) {
    improvements.push({ icon: 'info', text: '**Update the scheduled time** to a future date to maintain scenario relevance.' });
  }
  
  improvements.push({ icon: 'info', text: '**Document operator responsibilities** to ensure clear accountability during execution.' });
  improvements.push({ icon: 'info', text: '**Set up monitoring alerts** to track scenario progress and detect anomalies early.' });
  improvements.push({ icon: 'info', text: '**Create a communication plan** to keep stakeholders informed during all lifecycle phases.' });

  return {
    type: 'improve',
    summary: `**Suggested Improvements for "${scenario.name}"**\n\nHere are actionable recommendations to enhance this scenario:`,
    items: improvements.slice(0, 3),
  };
}

interface CopilotPanelProps {
  scenario: DemoScenario;
  onRefresh?: () => void;
}

function CopilotPanel({ scenario }: CopilotPanelProps) {
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<'explain' | 'validate' | 'improve'>('explain');

  useEffect(() => {
    // Auto-generate explanation when scenario loads
    handleAction('explain');
  }, [scenario.id]);

  const handleAction = async (type: 'explain' | 'validate' | 'improve') => {
    setIsLoading(true);
    setActiveAction(type);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const newResponse = generateCopilotResponse(scenario, type);
    setResponse(newResponse);
    setIsLoading(false);
  };

  return (
    <div className="w-80 border-l border-border bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Operator Copilot</h3>
            <p className="text-xs text-muted-foreground">AI-powered insights</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={activeAction === 'explain' ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={() => handleAction('explain')}
            disabled={isLoading}
          >
            <Lightbulb className="w-3 h-3 mr-1" />
            Explain
          </Button>
          <Button
            size="sm"
            variant={activeAction === 'validate' ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={() => handleAction('validate')}
            disabled={isLoading}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Validate
          </Button>
          <Button
            size="sm"
            variant={activeAction === 'improve' ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={() => handleAction('improve')}
            disabled={isLoading}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Improve
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-8"
            >
              <RefreshCw className="w-5 h-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Analyzing...</span>
            </motion.div>
          ) : response ? (
            <motion.div
              key={response.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-sm whitespace-pre-wrap">{response.summary}</p>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {response.items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border"
                  >
                    {item.icon === 'check' && (
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    )}
                    {item.icon === 'warning' && (
                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                    )}
                    {item.icon === 'info' && (
                      <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    )}
                    <span className="text-xs leading-relaxed">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </ScrollArea>
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

  // Reset form when scenario changes
  useEffect(() => {
    if (scenario) {
      setFormData({ ...scenario });
      const timeParts = scenario.time.split(' ');
      if (timeParts.length === 2) {
        const dateObj = new Date(`${timeParts[0]}T${timeParts[1]}`);
        if (!isNaN(dateObj.getTime())) {
          setSelectedDate(dateObj);
        }
      }
    }
  }, [scenario?.id]);

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      toast.success('Scenario saved');
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

          {/* Drawer with Copilot */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[800px] bg-card border-l border-border shadow-xl z-50 flex"
          >
            {/* Form Section */}
            <div className="flex-1 flex flex-col">
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
            </div>

            {/* Copilot Panel */}
            <CopilotPanel scenario={formData} />
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
