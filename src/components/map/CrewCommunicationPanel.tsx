import { useState } from 'react';
import { Phone, MessageSquare, Radio, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CrewCommunicationPanelProps {
  crewName: string;
  crewId: string;
  contactPhone: string | null;
}

type MessageTemplate = {
  id: string;
  label: string;
  message: string;
};

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  { id: 'status', label: 'Request Status Update', message: 'Please provide a status update on your current assignment.' },
  { id: 'eta', label: 'ETA Check', message: 'What is your current ETA to the incident location?' },
  { id: 'safety', label: 'Safety Check-in', message: 'Please confirm crew safety status and any hazards on site.' },
  { id: 'resources', label: 'Resource Needs', message: 'Do you require any additional resources or support?' },
  { id: 'custom', label: 'Custom Message', message: '' },
];

export function CrewCommunicationPanel({
  crewName,
  crewId,
  contactPhone,
}: CrewCommunicationPanelProps) {
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [radioDialogOpen, setRadioDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('status');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleCall = () => {
    if (contactPhone) {
      // In a real app, this would initiate a VoIP call
      toast.success(`Initiating call to ${crewName}`, {
        description: `Dialing ${contactPhone}...`,
      });
    } else {
      toast.error('No phone number available for this crew');
    }
  };

  const handleSendMessage = async () => {
    const template = MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate);
    const messageToSend = selectedTemplate === 'custom' ? customMessage : template?.message;

    if (!messageToSend?.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    toast.success(`Message sent to ${crewName}`, {
      description: messageToSend.length > 50 ? `${messageToSend.slice(0, 50)}...` : messageToSend,
    });
    
    setIsSending(false);
    setMessageDialogOpen(false);
    setCustomMessage('');
    setSelectedTemplate('status');
  };

  const handleRadioPage = async () => {
    setIsSending(true);
    
    // Simulate radio page
    await new Promise(resolve => setTimeout(resolve, 600));
    
    toast.success(`Radio page sent to ${crewName}`, {
      description: 'Crew has been alerted via radio channel',
    });
    
    setIsSending(false);
    setRadioDialogOpen(false);
  };

  const currentTemplate = MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Quick Communication</h4>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1.5 h-auto py-3 hover:bg-primary/5 hover:border-primary/50"
            onClick={handleCall}
          >
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <Phone className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-xs font-medium">Call</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1.5 h-auto py-3 hover:bg-primary/5 hover:border-primary/50"
            onClick={() => setMessageDialogOpen(true)}
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-xs font-medium">Message</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1.5 h-auto py-3 hover:bg-primary/5 hover:border-primary/50"
            onClick={() => setRadioDialogOpen(true)}
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Radio className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-xs font-medium">Radio</span>
          </Button>
        </div>
      </div>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Send Message
            </DialogTitle>
            <DialogDescription>
              Send a message to {crewName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Message Template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESSAGE_TEMPLATES.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate === 'custom' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Message</label>
                <Textarea
                  placeholder="Type your message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="resize-none h-24"
                />
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 border border-border p-3">
                <p className="text-sm text-foreground">{currentTemplate?.message}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                To: {crewName}
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                ID: {crewId}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={isSending}>
              {isSending ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Radio Page Dialog */}
      <Dialog open={radioDialogOpen} onOpenChange={setRadioDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-500" />
              Radio Page
            </DialogTitle>
            <DialogDescription>
              Send an urgent radio page to {crewName}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-center">
              <Radio className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">
                This will send an immediate radio alert
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                The crew will receive an audible notification on their radio device
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRadioDialogOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button 
              onClick={handleRadioPage} 
              disabled={isSending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSending ? 'Sending...' : 'Send Radio Page'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
