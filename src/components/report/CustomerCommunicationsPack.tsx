import { useState } from 'react';
import { format } from 'date-fns';
import { 
  MessageSquare, 
  Mail, 
  Globe, 
  Copy, 
  Loader2, 
  CheckCircle2,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { ScenarioWithIntelligence } from '@/types/scenario';
import type { 
  SituationReport, 
  CommsTone, 
  CustomerCommsDrafts, 
  CustomerCommsMetadata 
} from '@/types/situation-report';

interface CustomerCommunicationsPackProps {
  event: ScenarioWithIntelligence;
  report: SituationReport;
  onCommsGenerated: (comms: CustomerCommsMetadata) => void;
}

export function CustomerCommunicationsPack({ 
  event, 
  report,
  onCommsGenerated 
}: CustomerCommunicationsPackProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [tone, setTone] = useState<CommsTone>('calm');
  const [drafts, setDrafts] = useState<CustomerCommsDrafts | null>(
    report.customer_comms?.drafts || null
  );
  const [editedDrafts, setEditedDrafts] = useState<CustomerCommsDrafts | null>(
    report.customer_comms?.drafts || null
  );
  const [activeTab, setActiveTab] = useState('sms');

  const isApproved = report.approval?.status === 'approved' || report.approval?.status === 'sent';
  const hasComms = !!report.customer_comms;

  const generateDrafts = () => {
    setIsGenerating(true);

    // Simulate brief processing delay for UX
    setTimeout(() => {
      const newDrafts = generateCustomerDrafts(event, tone);
      setDrafts(newDrafts);
      setEditedDrafts(newDrafts);
      
      const commsMetadata: CustomerCommsMetadata = {
        generated_at: new Date().toISOString(),
        tone,
        drafts: newDrafts,
      };
      
      onCommsGenerated(commsMetadata);
      setIsGenerating(false);
      
      toast({ 
        description: 'Customer communication drafts generated (demo).', 
        duration: 3000 
      });
    }, 800);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ description: `${label} copied to clipboard`, duration: 2000 });
    });
  };

  const handleDraftEdit = (field: keyof CustomerCommsDrafts, value: string) => {
    if (!editedDrafts) return;
    setEditedDrafts({ ...editedDrafts, [field]: value });
  };

  const getToneLabel = (t: CommsTone) => {
    switch (t) {
      case 'calm': return 'Calm';
      case 'direct': return 'Direct';
      case 'reassuring': return 'Reassuring';
    }
  };

  // Show only the generate button when no comms exist
  if (!drafts && !isGenerating) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            Customer Communications Pack (Draft)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate customer-facing communication drafts based on the approved Situation Report.
          </p>

          {/* Tone Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Communication Tone</Label>
            <RadioGroup 
              value={tone} 
              onValueChange={(v) => setTone(v as CommsTone)}
              className="flex gap-4"
            >
              {(['calm', 'direct', 'reassuring'] as CommsTone[]).map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <RadioGroupItem value={t} id={`tone-${t}`} />
                  <Label htmlFor={`tone-${t}`} className="text-sm cursor-pointer capitalize">
                    {getToneLabel(t)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Button
            onClick={generateDrafts}
            disabled={!isApproved}
            className="gap-2"
          >
            <Megaphone className="w-4 h-4" />
            Generate Customer Comms Drafts
          </Button>

          {!isApproved && (
            <p className="text-xs text-muted-foreground">
              Report must be approved before generating customer communications.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isGenerating) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">Generating customer drafts...</p>
        </CardContent>
      </Card>
    );
  }

  // Show drafts
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            Customer Communications Pack (Draft)
          </CardTitle>
          {report.customer_comms && (
            <span className="text-[10px] text-muted-foreground">
              Generated: {format(new Date(report.customer_comms.generated_at), 'MMM d, h:mm a')} • 
              Tone: {getToneLabel(report.customer_comms.tone)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="sms" className="text-xs gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="email" className="text-xs gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email
            </TabsTrigger>
            <TabsTrigger value="web" className="text-xs gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Web Update
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sms" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">SMS Draft (max 320 chars)</Label>
              <span className={cn(
                "text-[10px]",
                (editedDrafts?.sms.length || 0) > 320 ? "text-destructive" : "text-muted-foreground"
              )}>
                {editedDrafts?.sms.length || 0}/320
              </span>
            </div>
            <Textarea
              value={editedDrafts?.sms || ''}
              onChange={(e) => handleDraftEdit('sms', e.target.value)}
              className="min-h-[100px] text-sm resize-none font-mono"
              maxLength={320}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => copyToClipboard(editedDrafts?.sms || '', 'SMS draft')}
              className="gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy SMS
            </Button>
          </TabsContent>

          <TabsContent value="email" className="space-y-3 mt-4">
            <Label className="text-xs font-medium">Customer Email Draft</Label>
            <Textarea
              value={editedDrafts?.email || ''}
              onChange={(e) => handleDraftEdit('email', e.target.value)}
              className="min-h-[160px] text-sm resize-none"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => copyToClipboard(editedDrafts?.email || '', 'Email draft')}
              className="gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Email
            </Button>
          </TabsContent>

          <TabsContent value="web" className="space-y-3 mt-4">
            <Label className="text-xs font-medium">Web Banner / Outage Page Update</Label>
            <Textarea
              value={editedDrafts?.web_banner || ''}
              onChange={(e) => handleDraftEdit('web_banner', e.target.value)}
              className="min-h-[100px] text-sm resize-none"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => copyToClipboard(editedDrafts?.web_banner || '', 'Web update')}
              className="gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Web Update
            </Button>
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <p className="text-[10px] text-muted-foreground italic">
            This is a demo-generated draft. Operator review required before any customer communication.
          </p>
        </div>

        {/* Regenerate with different tone */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground">Regenerate with tone:</span>
            <div className="flex gap-2">
              {(['calm', 'direct', 'reassuring'] as CommsTone[]).map((t) => (
                <Button
                  key={t}
                  variant={tone === t ? 'secondary' : 'ghost'}
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => {
                    setTone(t);
                    // Auto-regenerate with new tone
                    setIsGenerating(true);
                    setTimeout(() => {
                      const newDrafts = generateCustomerDrafts(event, t);
                      setDrafts(newDrafts);
                      setEditedDrafts(newDrafts);
                      onCommsGenerated({
                        generated_at: new Date().toISOString(),
                        tone: t,
                        drafts: newDrafts,
                      });
                      setIsGenerating(false);
                    }, 500);
                  }}
                >
                  {getToneLabel(t)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to generate customer-facing drafts based on event data and tone
function generateCustomerDrafts(
  event: ScenarioWithIntelligence, 
  tone: CommsTone
): CustomerCommsDrafts {
  const etrEarliest = event.etr_earliest 
    ? format(new Date(event.etr_earliest), 'h:mm a') 
    : 'TBD';
  const etrLatest = event.etr_latest 
    ? format(new Date(event.etr_latest), 'h:mm a') 
    : 'TBD';
  const etrWindow = `${etrEarliest} – ${etrLatest}`;
  const confidence = event.etr_confidence || 'MEDIUM';
  const isLowConfidence = confidence === 'LOW' || event.etr_risk_level === 'HIGH';
  const isCriticalAtRisk = event.critical_runway_status === 'AT_RISK' || event.critical_runway_status === 'BREACH';
  const serviceArea = event.service_area || event.location_name || 'your area';
  const customersAffected = event.customers_impacted?.toLocaleString() || 'multiple';

  // Confidence caveat
  const confidenceCaveat = isLowConfidence 
    ? 'Restoration time may change as damage assessment continues.' 
    : '';

  // Critical infrastructure note (never mention hospitals explicitly)
  const criticalNote = isCriticalAtRisk 
    ? 'We are prioritizing critical infrastructure restoration.' 
    : '';

  // Disclaimer (always included)
  const disclaimer = '[Demo draft – Operator review required]';

  // Tone-specific opening phrases
  const openings = {
    calm: 'We are aware of a power outage',
    direct: 'Power outage reported',
    reassuring: 'We understand how important reliable power is to you. We are actively working on'
  };

  const toneOpening = openings[tone];

  // SMS Draft (max 320 chars)
  let sms = `${toneOpening} affecting ${serviceArea}. Estimated restoration: ${etrWindow}. Confidence: ${confidence}.`;
  if (isLowConfidence) sms += ' ETR may change.';
  if (isCriticalAtRisk) sms += ' Critical infra prioritized.';
  sms += ` ${disclaimer}`;
  // Truncate if over 320
  if (sms.length > 320) sms = sms.slice(0, 317) + '...';

  // Email Draft
  const emailLines = [
    `Dear Customer,`,
    ``,
    `${toneOpening} in ${serviceArea} affecting approximately ${customersAffected} customers.`,
    ``,
    `Estimated restoration window: ${etrWindow}`,
    `Confidence: ${confidence}`,
    confidenceCaveat ? `\n${confidenceCaveat}` : '',
    criticalNote ? `\n${criticalNote}` : '',
    ``,
    `Our crews are working to restore power as quickly and safely as possible. We appreciate your patience.`,
    ``,
    `For updates, visit our outage map or call our customer service line.`,
    ``,
    `Thank you for your understanding.`,
    ``,
    disclaimer
  ].filter(Boolean).join('\n');

  // Web Banner (2-4 lines)
  const webLines = [
    `**Outage Alert: ${serviceArea}**`,
    `Estimated restoration: ${etrWindow} (Confidence: ${confidence})`,
    confidenceCaveat,
    criticalNote,
    disclaimer
  ].filter(Boolean).join('\n');

  return {
    sms,
    email: emailLines,
    web_banner: webLines
  };
}
