import { motion } from 'framer-motion';
import { HelpCircle, Zap, AlertTriangle, Wrench, RefreshCw, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  version?: string;
  category: 'outage' | 'technical' | 'equipment' | 'general';
}

const faqData: FAQItem[] = [
  // Outage-related FAQs
  {
    id: 'outage-1',
    question: 'What causes power outages during storms?',
    answer: 'Storm-related outages are typically caused by high winds damaging power lines, lightning strikes on equipment, fallen trees or branches hitting lines, and flooding affecting substations. Our crews prioritize restoring power to critical facilities first, then work on residential areas based on the number of customers affected.',
    version: 'v2.1',
    category: 'outage',
  },
  {
    id: 'outage-2',
    question: 'How are outage priorities determined?',
    answer: 'Outages are prioritized based on several factors: critical infrastructure (hospitals, emergency services), number of customers affected, safety hazards (downed lines), and restoration complexity. Our dispatch system uses AI to optimize crew assignments for maximum efficiency.',
    version: 'v2.0',
    category: 'outage',
  },
  {
    id: 'outage-3',
    question: 'What is the difference between Pre-Event, Event, and Post-Event stages?',
    answer: 'Pre-Event: Preparation phase when severe weather is forecasted - crews are positioned, equipment staged. Event: Active outage period when restoration work is ongoing. Post-Event: Analysis phase after power is restored - damage assessment, equipment repair scheduling, and performance review.',
    version: 'v2.1',
    category: 'outage',
  },
  // Technical FAQs
  {
    id: 'tech-1',
    question: 'Why does my feeder show repeated faults?',
    answer: 'Repeated faults on the same feeder often indicate underlying issues: vegetation encroachment requiring trimming, aging equipment needing replacement, wildlife interference, or conductor sagging. Review the fault history in the event timeline and check for common fault locations.',
    version: 'v2.1',
    category: 'technical',
  },
  {
    id: 'tech-2',
    question: 'How do I interpret the heat map intensity?',
    answer: 'The heat map shows outage density based on customer impact. Red/orange areas indicate high concentrations of affected customers. Blue areas show lower impact. Use this to identify problem areas requiring additional resources or infrastructure upgrades.',
    version: 'v2.0',
    category: 'technical',
  },
  {
    id: 'tech-3',
    question: 'What does ETA calculation include?',
    answer: 'ETA calculations factor in: crew travel time from current location, estimated repair complexity based on outage type, equipment availability, weather conditions, and historical repair times for similar events. ETAs update automatically as conditions change.',
    version: 'v2.1',
    category: 'technical',
  },
  // Equipment FAQs
  {
    id: 'equip-1',
    question: 'How do I report transformer overload conditions?',
    answer: 'Navigate to the asset on the map, open the asset detail drawer, and use the "Report Issue" function. Include load readings if available. The system will automatically flag transformers operating above 80% capacity and alert the engineering team.',
    version: 'v2.0',
    category: 'equipment',
  },
  {
    id: 'equip-2',
    question: 'What causes equipment failure outages?',
    answer: 'Equipment failures result from: aging infrastructure beyond service life, manufacturing defects, overloading, inadequate maintenance, environmental stress (heat, humidity), and animal interference. Regular preventive maintenance reduces these occurrences by up to 40%.',
    version: 'v2.1',
    category: 'equipment',
  },
  // General FAQs
  {
    id: 'gen-1',
    question: 'How do I dispatch multiple crews to a large event?',
    answer: 'Use the Crew Dispatch panel, select the event, then choose "Multi-Crew Dispatch". The system will suggest optimal crew combinations based on specializations, locations, and availability. You can override suggestions and manually assign crews as needed.',
    version: 'v2.1',
    category: 'general',
  },
  {
    id: 'gen-2',
    question: 'Can I export event data for reporting?',
    answer: 'Yes, from the Events page, use the export button to download event data in CSV or PDF format. You can filter by date range, lifecycle stage, and outage type before exporting. Reports include all event details, crew assignments, and timeline data.',
    version: 'v2.0',
    category: 'general',
  },
];

const categoryIcons = {
  outage: Zap,
  technical: AlertTriangle,
  equipment: Wrench,
  general: HelpCircle,
};

const categoryLabels = {
  outage: 'Outage',
  technical: 'Technical',
  equipment: 'Equipment',
  general: 'General',
};

export function TroubleshootingFAQ() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Troubleshooting FAQ
          </CardTitle>
          <CardDescription>
            Common questions about outages, technical faults, and system usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq) => {
              const CategoryIcon = categoryIcons[faq.category];
              return (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-center gap-3 flex-1 mr-4">
                      <CategoryIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="flex-1">{faq.question}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[faq.category]}
                        </Badge>
                        {faq.version && (
                          <Badge variant="secondary" className="text-xs">
                            {faq.version}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-7">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-primary" />
              <span className="font-medium">Need more help?</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Contact the Control Center at ext. 4500 or submit a support ticket through the Help menu.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
