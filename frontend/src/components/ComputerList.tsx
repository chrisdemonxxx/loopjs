import { useState, useEffect } from 'react';
import { Computer } from '../types';
import { generateMockComputers, updateComputerMetrics } from '../lib/mockData';
import { ComputerCard } from './ComputerCard';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search } from 'lucide-react';

export function ComputerList() {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    setComputers(generateMockComputers());
    
    // Simulate real-time updates every 3 seconds
    const interval = setInterval(() => {
      setComputers(prev => prev.map(updateComputerMetrics));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const filteredComputers = computers.filter(computer => {
    const matchesSearch = 
      computer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      computer.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      computer.ip.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || computer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, hostname, or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Computers</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredComputers.map(computer => (
          <ComputerCard key={computer.id} computer={computer} />
        ))}
      </div>

      {filteredComputers.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No computers found matching your filters.
        </div>
      )}
    </div>
  );
}
