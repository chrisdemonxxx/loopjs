import React, { useEffect, useState } from 'react';
import request from '../axios';
import { Agent, Task } from '../types';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TasksModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: Agent;
}

const TasksModal: React.FC<TasksModalProps> = ({ isOpen, setIsOpen, user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user.id) {
      const fetchTasks = async () => {
        try {
          setIsLoading(true);
          const response = await request({
            url: `command/tasks/${user.id}`,
            method: 'GET',
          });
          setTasks(response.data.data);
        } catch (error) {
          toast.error('Error fetching tasks.');
          console.error('Error fetching tasks:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchTasks();
    }
  }, [isOpen, user]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Tasks for {user.computerName}</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading tasks...</span>
            </div>
          ) : tasks.length > 0 ? (
            tasks.map((task, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Command</CardTitle>
                    <Badge variant={task.status === 'executed' ? 'default' : task.status === 'failed' ? 'destructive' : 'secondary'}>
                      {task.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                      <code>{task.command}</code>
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Output:</h4>
                    <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto max-h-32">
                      {task.output || 'No output yet.'}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found for this client.
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TasksModal;
