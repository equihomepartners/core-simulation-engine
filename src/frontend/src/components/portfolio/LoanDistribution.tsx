import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency, formatPercentage, formatNumber } from '../../lib/formatters';

interface LoanDistributionProps {
  data: any;
  isLoading: boolean;
}

const LoanDistribution: React.FC<LoanDistributionProps> = ({ data, isLoading }) => {
  const [distributionType, setDistributionType] = useState<'size' | 'ltv'>('size');

  // Extract distribution data
  const loanSizeDistribution = data?.portfolio?.loan_size_distribution || data?.portfolio?.loanSizeDistribution || {};
  const ltvDistribution = data?.portfolio?.ltv_distribution || data?.portfolio?.ltvDistribution || {};

  // Transform histogram data for charts
  const loanSizeHistogram = loanSizeDistribution?.histogram?.map((bin: any, index: number) => ({
    name: `$${(bin.bin_min || bin.binMin).toLocaleString()} - $${(bin.bin_max || bin.binMax).toLocaleString()}`,
    value: bin.count,
    percentage: bin.percentage,
    color: '#3b82f6',
  })) || [];

  const ltvHistogram = ltvDistribution?.histogram?.map((bin: any, index: number) => ({
    name: `${((bin.bin_min || bin.binMin) * 100).toFixed(1)}% - ${((bin.bin_max || bin.binMax) * 100).toFixed(1)}%`,
    value: bin.count,
    percentage: bin.percentage,
    color: '#10b981',
  })) || [];

  const activeHistogram = distributionType === 'size' ? loanSizeHistogram : ltvHistogram;
  const activeDistribution = distributionType === 'size' ? loanSizeDistribution : ltvDistribution;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Loan Distribution</CardTitle>
            <CardDescription>Distribution of loans by size and LTV</CardDescription>
          </div>
          <Tabs
            value={distributionType}
            onValueChange={(value) => setDistributionType(value as 'size' | 'ltv')}
            className="w-[200px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="size">Loan Size</TabsTrigger>
              <TabsTrigger value="ltv">LTV</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeHistogram}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`${value} loans (${(value / (data?.portfolio?.metrics?.loan_count || 1) * 100).toFixed(1)}%)`, 'Count']}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name={distributionType === 'size' ? 'Loan Size Distribution' : 'LTV Distribution'}
                  >
                    {activeHistogram.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Distribution Statistics</h3>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Mean:</span>
                    <span className="text-lg font-medium">
                      {distributionType === 'size'
                        ? formatCurrency(activeDistribution?.mean)
                        : formatPercentage(activeDistribution?.mean)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Median:</span>
                    <span className="text-lg font-medium">
                      {distributionType === 'size'
                        ? formatCurrency(activeDistribution?.median)
                        : formatPercentage(activeDistribution?.median)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Standard Deviation:</span>
                    <span className="text-lg font-medium">
                      {distributionType === 'size'
                        ? formatCurrency(activeDistribution?.std_dev || activeDistribution?.stdDev)
                        : formatPercentage(activeDistribution?.std_dev || activeDistribution?.stdDev)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Minimum:</span>
                    <span className="text-lg font-medium">
                      {distributionType === 'size'
                        ? formatCurrency(activeDistribution?.min)
                        : formatPercentage(activeDistribution?.min)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Maximum:</span>
                    <span className="text-lg font-medium">
                      {distributionType === 'size'
                        ? formatCurrency(activeDistribution?.max)
                        : formatPercentage(activeDistribution?.max)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Target {distributionType === 'size' ? 'Size' : 'LTV'}:</span>
                    <span className="text-lg font-medium">
                      {distributionType === 'size'
                        ? formatCurrency(data?.config?.avg_loan_size)
                        : formatPercentage(data?.config?.avg_loan_ltv)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoanDistribution;
