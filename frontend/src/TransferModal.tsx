import React, { useState } from 'react';
import { Agent } from './types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TransferModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: Agent;
  handleProcess: (user: Agent, commandKey: string) => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, setIsOpen, user, handleProcess }) => {
  const [commandKey, setCommandKey] = useState('');

  const commands = {
    'get-processes': 'Get Processes',
    'get-services': 'Get Services',
    'get-system-info': 'Get System Info',
    'reboot-computer': 'Reboot Computer',
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sending Commands</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="computer-name" className="text-right">
              Computer Name:
            </Label>
            <div className="col-span-3">{user.computerName}</div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="command-select" className="text-right">
              Command:
            </Label>
            <Select value={commandKey} onValueChange={setCommandKey}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Choose a command" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(commands).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              if (commandKey) {
                handleProcess(user, commandKey);
                setIsOpen(false);
              }
            }}
            disabled={!commandKey}
          >
            Send Command
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferModal;