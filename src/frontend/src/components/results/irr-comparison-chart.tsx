import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPercentage } from '@/utils/format';
import { LogLevel, LogCategory, log } from '@/utils/logging';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface IRRComparisonChartProps {
  results: any;
  isLoading: boolean;
  expanded?: boolean;
}

export function IRRComparisonChart({ results, isLoading, expanded = false }: IRRComparisonChartProps) {
  // Extract IRR data from results
  const irrData = React.useMemo(() => {
    if (isLoading || !results) return null;

    // Try to get metrics from results
    const metrics = results.metrics || {};

    // Extract IRR values
    const grossIrr = metrics.gross_irr || metrics.grossIrr;
    const fundIrr = metrics.fund_irr || metrics.fundIrr || metrics.irr;
    const lpIrr = metrics.lp_irr || metrics.lpIrr;

    // Log missing data
    if (grossIrr === undefined) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing gross_irr in IRRComparisonChart');
    }
    if (fundIrr === undefined) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing fund_irr in IRRComparisonChart');
    }
    if (lpIrr === undefined) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing lp_irr in IRRComparisonChart');
    }

    // Create chart data
    return {
      labels: ['Gross IRR', 'Fund IRR', 'LP IRR'],
      datasets: [
        {
          label: 'IRR',
          data: [
            grossIrr !== undefined ? grossIrr * 100 : 0,
            fundIrr !== undefined ? fundIrr * 100 : 0,
            lpIrr !== undefined ? lpIrr * 100 : 0
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.7)',  // Green for Gross IRR
            'rgba(59, 130, 246, 0.7)', // Blue for Fund IRR
            'rgba(99, 102, 241, 0.7)'  // Indigo for LP IRR
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(99, 102, 241, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  }, [results, isLoading]);

  // Chart options
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatPercentage(context.raw as number / 100);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatPercentage(Number(value) / 100);
          }
        },
        title: {
          display: true,
          text: 'Internal Rate of Return (IRR)'
        }
      }
    }
  };

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!irrData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No IRR data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Bar data={irrData} options={options} />
      <div className="mt-4 space-y-3 text-xs">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mb-1"></div>
            <p className="font-semibold">Gross IRR</p>
            <p className="text-center">{formatPercentage(irrData.datasets[0].data[0]/100)}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mb-1"></div>
            <p className="font-semibold">Fund IRR</p>
            <p className="text-center">{formatPercentage(irrData.datasets[0].data[1]/100)}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 bg-indigo-500 rounded-full mb-1"></div>
            <p className="font-semibold">LP IRR</p>
            <p className="text-center">{formatPercentage(irrData.datasets[0].data[2]/100)}</p>
          </div>
        </div>
        <div className="bg-muted/30 p-2 rounded text-center">
          <p><span className="font-semibold text-green-600">Gross IRR:</span> Return on investments before any fees or carried interest</p>
          <p><span className="font-semibold text-blue-600">Fund IRR:</span> Return after management fees but before carried interest</p>
          <p><span className="font-semibold text-indigo-600">LP IRR:</span> Return to limited partners after all fees and carried interest</p>
        </div>
      </div>
    </div>
  );
}
