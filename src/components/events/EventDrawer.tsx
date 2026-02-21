import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { Scenario, ScenarioInsert, LifecycleStage, OutageType } from '@/types/scenario';
import { OUTAGE_TYPES } from '@/types/scenario';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  stage: z.boolean(),
  scenario_time: z.date().optional().nullable(),
  lifecycle_stage: z.enum(['Pre-Event', 'Event', 'Post-Event']),
  operator_role: z.string().optional(),
  notes: z.string().optional(),
  priority: z.string().optional(),
  outage_type: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EventDrawerProps {
  open: boolean;
  onClose: () => void;
  scenario: Scenario | null;
  onSave: (data: ScenarioInsert) => void;
  isLoading?: boolean;
}

export function EventDrawer({ open, onClose, scenario, onSave, isLoading }: EventDrawerProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      stage: false,
      scenario_time: null,
      lifecycle_stage: 'Pre-Event',
      operator_role: '',
      notes: '',
      priority: 'medium',
      outage_type: 'Unknown',
    },
  });

  useEffect(() => {
    if (scenario) {
      form.reset({
        name: scenario.name,
        description: scenario.description || '',
        stage: scenario.stage,
        scenario_time: scenario.scenario_time ? new Date(scenario.scenario_time) : null,
        lifecycle_stage: scenario.lifecycle_stage,
        operator_role: scenario.operator_role || '',
        notes: scenario.notes || '',
        priority: scenario.priority || 'medium',
        outage_type: scenario.outage_type || 'Unknown',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        stage: false,
        scenario_time: null,
        lifecycle_stage: 'Pre-Event',
        operator_role: '',
        notes: '',
        priority: 'medium',
        outage_type: 'Unknown',
      });
    }
  }, [scenario, form]);

  const handleSubmit = (values: FormValues) => {
    onSave({
      name: values.name,
      description: values.description || null,
      stage: values.stage,
      scenario_time: values.scenario_time?.toISOString() || null,
      lifecycle_stage: values.lifecycle_stage as LifecycleStage,
      operator_role: values.operator_role || null,
      notes: values.notes || null,
      priority: values.priority || null,
      outage_type: (values.outage_type as OutageType) || null,
    });
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{scenario ? 'Edit Event' : 'Create Event'}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter event name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the event..." 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Stage (Activated)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2 mt-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm text-muted-foreground">
                          {field.value ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lifecycle_stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lifecycle Stage</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pre-Event">Pre-Event</SelectItem>
                        <SelectItem value="Event">Event</SelectItem>
                        <SelectItem value="Post-Event">Post-Event</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="outage_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outage Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'Unknown'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select outage type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {OUTAGE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scenario_time"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Event Time</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP p') : 'Pick a date & time'}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operator_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operator Role</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Safety Officer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'medium'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes..." 
                      className="resize-none"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Event'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
