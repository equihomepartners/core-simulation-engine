import React, { useState } from 'react';
import { SimulationCard } from './simulation-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Empty } from '@/components/ui/empty';
import { useNavigate } from 'react-router-dom';
import { LogCategory, LogLevel, log } from '@/utils/logging';

interface SimulationListProps {
  simulations: any[];
  onDelete?: (id: string) => void;
}

export function SimulationList({ simulations, onDelete }: SimulationListProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter simulations based on search term
  const filteredSimulations = simulations.filter((simulation) => {
    const id = simulation.simulationId || simulation.simulation_id || '';
    const name = simulation.name || `Simulation ${id}`;
    const status = simulation.status || '';
    
    const searchLower = searchTerm.toLowerCase();
    return (
      id.toString().toLowerCase().includes(searchLower) ||
      name.toLowerCase().includes(searchLower) ||
      status.toLowerCase().includes(searchLower)
    );
  });

  // Sort simulations
  const sortedSimulations = [...filteredSimulations].sort((a, b) => {
    const aId = a.simulationId || a.simulation_id || '';
    const bId = b.simulationId || b.simulation_id || '';
    const aName = a.name || `Simulation ${aId}`;
    const bName = b.name || `Simulation ${bId}`;
    const aStatus = a.status || '';
    const bStatus = b.status || '';
    const aDate = a.created_at ? new Date(a.created_at) : new Date();
    const bDate = b.created_at ? new Date(b.created_at) : new Date();

    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = aName.localeCompare(bName);
        break;
      case 'status':
        comparison = aStatus.localeCompare(bStatus);
        break;
      case 'date':
      default:
        comparison = aDate.getTime() - bDate.getTime();
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: 'date' | 'name' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleCreateSimulation = () => {
    navigate('/wizard');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <Input
          placeholder="Search simulations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'date' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('date')}
          >
            Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('name')}
          >
            Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button
            variant={sortBy === 'status' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('status')}
          >
            Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
        </div>
      </div>

      {sortedSimulations.length === 0 ? (
        <Empty
          title="No simulations found"
          description={
            searchTerm
              ? `No simulations match "${searchTerm}"`
              : "You haven't created any simulations yet."
          }
          action={{
            label: 'Create Simulation',
            onClick: handleCreateSimulation,
          }}
          className="h-[300px]"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedSimulations.map((simulation) => (
            <SimulationCard
              key={simulation.simulationId || simulation.simulation_id}
              simulation={simulation}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
