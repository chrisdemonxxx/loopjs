import React, { useEffect, useState } from 'react';
import request from '../axios';
import { Agent, Task } from '../types';
import toast from 'react-hot-toast';

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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Tasks for {user.name}</h2>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <p>Loading tasks...</p>
          ) : tasks.length > 0 ? (
            tasks.map((task, index) => (
              <div key={index} className="mb-4 p-4 rounded-lg bg-gray-100 dark:bg-boxdark-2">
                <p className="font-semibold">Command:</p>
                <pre className="bg-black text-white p-2 rounded-md"><code>{task.command}</code></pre>
                <p className="font-semibold mt-2">Output:</p>
                <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded-md">{task.output || 'No output yet.'}</pre>
              </div>
            ))
          ) : (
            <p>No tasks found for this client.</p>
          )}
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default TasksModal;
