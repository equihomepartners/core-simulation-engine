import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatPercentage } from '../../lib/formatters';
import { Search, Filter, ArrowUpDown, Check, X } from 'lucide-react';

interface LoanExplorerProps {
  data: any;
  isLoading: boolean;
}

const LoanExplorer: React.FC<LoanExplorerProps> = ({ data, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<{
    zone: string[];
    isExited: boolean | null;
    isDefault: boolean | null;
  }>({
    zone: [],
    isExited: null,
    isDefault: null,
  });

  // Extract loan data
  const loans = data?.portfolio?.loans || [];

  // Apply search, sort, and filters
  const filteredLoans = useMemo(() => {
    return loans
      .filter((loan: any) => {
        // Search filter
        if (searchTerm && !loan.id.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Zone filter
        if (filters.zone.length > 0 && !filters.zone.includes(loan.zone)) {
          return false;
        }

        // Exit status filter
        if (filters.isExited !== null) {
          const isExited = loan.is_exited || loan.isExited;
          if (isExited !== filters.isExited) {
            return false;
          }
        }

        // Default status filter
        if (filters.isDefault !== null) {
          const isDefault = loan.is_default || loan.isDefault;
          if (isDefault !== filters.isDefault) {
            return false;
          }
        }

        return true;
      })
      .sort((a: any, b: any) => {
        let aValue = a[sortField] || a[sortField.toLowerCase()] || '';
        let bValue = b[sortField] || b[sortField.toLowerCase()] || '';

        // Handle numeric values
        if (!isNaN(parseFloat(aValue))) {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }

        // Handle boolean values
        if (typeof aValue === 'boolean') {
          aValue = aValue ? 1 : 0;
          bValue = bValue ? 1 : 0;
        }

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
  }, [loans, searchTerm, sortField, sortDirection, filters]);

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Toggle zone filter
  const toggleZoneFilter = (zone: string) => {
    if (filters.zone.includes(zone)) {
      setFilters({
        ...filters,
        zone: filters.zone.filter(z => z !== zone),
      });
    } else {
      setFilters({
        ...filters,
        zone: [...filters.zone, zone],
      });
    }
  };

  // Toggle boolean filters
  const toggleBooleanFilter = (field: 'isExited' | 'isDefault', value: boolean | null) => {
    setFilters({
      ...filters,
      [field]: value,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Loan Explorer</CardTitle>
            <CardDescription>Detailed view of all loans in the portfolio</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search loans..."
                className="pl-8 w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge
            variant={filters.zone.includes('green') ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleZoneFilter('green')}
          >
            Green Zone
          </Badge>
          <Badge
            variant={filters.zone.includes('orange') ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleZoneFilter('orange')}
          >
            Orange Zone
          </Badge>
          <Badge
            variant={filters.zone.includes('red') ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleZoneFilter('red')}
          >
            Red Zone
          </Badge>
          <Badge
            variant={filters.isExited === true ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleBooleanFilter('isExited', filters.isExited === true ? null : true)}
          >
            Exited
          </Badge>
          <Badge
            variant={filters.isExited === false ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleBooleanFilter('isExited', filters.isExited === false ? null : false)}
          >
            Active
          </Badge>
          <Badge
            variant={filters.isDefault === true ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleBooleanFilter('isDefault', filters.isDefault === true ? null : true)}
          >
            Defaulted
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="w-full h-[400px]" />
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort('id')}>
                    <div className="flex items-center">
                      ID
                      {sortField === 'id' && (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('loan_amount')}>
                    <div className="flex items-center">
                      Loan Amount
                      {(sortField === 'loan_amount' || sortField === 'loanAmount') && (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('ltv')}>
                    <div className="flex items-center">
                      LTV
                      {sortField === 'ltv' && (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('zone')}>
                    <div className="flex items-center">
                      Zone
                      {sortField === 'zone' && (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('interest_rate')}>
                    <div className="flex items-center">
                      Interest Rate
                      {(sortField === 'interest_rate' || sortField === 'interestRate') && (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('expected_exit_year')}>
                    <div className="flex items-center">
                      Expected Exit
                      {(sortField === 'expected_exit_year' || sortField === 'expectedExitYear') && (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('actual_exit_year')}>
                    <div className="flex items-center">
                      Actual Exit
                      {(sortField === 'actual_exit_year' || sortField === 'actualExitYear') && (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('is_exited')}>
                    <div className="flex items-center">
                      Status
                      {(sortField === 'is_exited' || sortField === 'isExited') && (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.slice(0, 10).map((loan: any) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.id}</TableCell>
                    <TableCell>{formatCurrency(loan.loan_amount || loan.loanAmount)}</TableCell>
                    <TableCell>{formatPercentage(loan.ltv)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          loan.zone === 'green'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : loan.zone === 'orange'
                              ? 'bg-orange-100 text-orange-800 hover:bg-orange-100'
                              : 'bg-red-100 text-red-800 hover:bg-red-100'
                        }
                      >
                        {loan.zone.charAt(0).toUpperCase() + loan.zone.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPercentage(loan.interest_rate || loan.interestRate)}</TableCell>
                    <TableCell>Year {loan.expected_exit_year || loan.expectedExitYear}</TableCell>
                    <TableCell>
                      {(loan.is_exited || loan.isExited)
                        ? `Year ${loan.actual_exit_year || loan.actualExitYear}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {(loan.is_default || loan.isDefault) ? (
                        <Badge variant="destructive">Defaulted</Badge>
                      ) : (loan.is_exited || loan.isExited) ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Exited
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLoans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No loans found matching the current filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {filteredLoans.length > 10 && (
              <div className="flex justify-center p-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing 10 of {filteredLoans.length} loans
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoanExplorer;
