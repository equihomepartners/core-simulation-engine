import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

interface TrancheDetailsTableProps {
  tranches: Record<string, any> | null;
  isLoading?: boolean;
}

export function TrancheDetailsTable({ tranches, isLoading = false }: TrancheDetailsTableProps) {
  const trancheArray = React.useMemo(() => {
    if (!tranches || isLoading) return [];
    return Object.entries(tranches)
      .filter(([key]) => key !== 'errors')
      .map(([id, t]) => ({ id, ...(t as any) }));
  }, [tranches, isLoading]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tranche Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!trancheArray.length) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tranche Details</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Tranche ID</TableHead>
              <TableHead className="whitespace-nowrap">Size</TableHead>
              <TableHead className="whitespace-nowrap">Deploy Start</TableHead>
              <TableHead className="whitespace-nowrap">Deploy Period</TableHead>
              <TableHead className="whitespace-nowrap">IRR</TableHead>
              <TableHead className="whitespace-nowrap">Multiple</TableHead>
              <TableHead className="whitespace-nowrap">Loans</TableHead>
              {trancheArray.some(t => t.total_returned !== undefined) && (
                <TableHead className="whitespace-nowrap">Total Returned</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {trancheArray.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.id}</TableCell>
                <TableCell>{formatCurrency(t.size)}</TableCell>
                <TableCell>{t.deploy_start ?? t.deployStart}</TableCell>
                <TableCell>{t.deploy_period ?? t.deployPeriod}</TableCell>
                <TableCell>{formatPercentage(t.irr)}</TableCell>
                <TableCell>{t.multiple?.toFixed?.(2)}x</TableCell>
                <TableCell>{t.loan_count ?? t.loanCount}</TableCell>
                {trancheArray.some(tr => tr.total_returned !== undefined) && (
                  <TableCell>{formatCurrency(t.total_returned ?? t.totalReturned)}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
