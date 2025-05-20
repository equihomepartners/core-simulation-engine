import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LoanGeneratorInputsProps {
  simulation: any;
  results: any;
  isLoading: boolean;
}

export function LoanGeneratorInputs({ 
  simulation, 
  results, 
  isLoading 
}: LoanGeneratorInputsProps) {
  const [viewFormat, setViewFormat] = React.useState<'yaml' | 'json'>('json');
  
  // Extract relevant configuration parameters
  const configParams = React.useMemo(() => {
    if (!simulation || isLoading) return null;
    
    // Extract the most relevant parameters for loan generation
    const params = {
      // Fund parameters
      fund_size: simulation.parameters?.fund_size,
      fund_term: simulation.parameters?.fund_term,
      
      // Loan parameters
      avg_loan_size: simulation.parameters?.avg_loan_size,
      loan_size_std_dev: simulation.parameters?.loan_size_std_dev,
      min_loan_size: simulation.parameters?.min_loan_size,
      max_loan_size: simulation.parameters?.max_loan_size,
      avg_loan_term: simulation.parameters?.avg_loan_term,
      avg_loan_interest_rate: simulation.parameters?.avg_loan_interest_rate,
      avg_loan_ltv: simulation.parameters?.avg_loan_ltv,
      ltv_std_dev: simulation.parameters?.ltv_std_dev,
      
      // Zone allocation
      zone_allocation: simulation.parameters?.zone_allocation,
      geo_strategy: simulation.parameters?.geo_strategy,
      zone_profiles: simulation.parameters?.zone_profiles,
      
      // Deployment parameters
      deployment_period: simulation.parameters?.deployment_period,
      deployment_pace: simulation.parameters?.deployment_pace,
      deployment_monthly_granularity: simulation.parameters?.deployment_monthly_granularity,
      
      // Exit parameters
      avg_loan_exit_year: simulation.parameters?.avg_loan_exit_year,
      exit_year_std_dev: simulation.parameters?.exit_year_std_dev,
      early_exit_probability: simulation.parameters?.early_exit_probability,
      force_exit_within_fund_term: simulation.parameters?.force_exit_within_fund_term,
      
      // Reinvestment parameters
      reinvestment_period: simulation.parameters?.reinvestment_period,
      enable_reinvestments: simulation.parameters?.enable_reinvestments,
      
      // Default parameters
      enable_defaults: simulation.parameters?.enable_defaults,
      default_rates: simulation.parameters?.default_rates,
      default_correlation: simulation.parameters?.default_correlation,
      
      // Appreciation parameters
      enable_appreciation: simulation.parameters?.enable_appreciation,
      appreciation_rates: simulation.parameters?.appreciation_rates,
      appreciation_sharing_method: simulation.parameters?.appreciation_sharing_method,
      appreciation_fund_share: simulation.parameters?.appreciation_fund_share,
    };
    
    // Filter out undefined values
    return Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
    );
  }, [simulation, isLoading]);
  
  // Format the configuration as JSON or YAML
  const formattedConfig = React.useMemo(() => {
    if (!configParams) return '';
    
    if (viewFormat === 'json') {
      return JSON.stringify(configParams, null, 2);
    } else {
      // Simple YAML formatter
      return Object.entries(configParams)
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            const nestedYaml = Object.entries(value)
              .map(([nestedKey, nestedValue]) => `  ${nestedKey}: ${nestedValue}`)
              .join('\n');
            return `${key}:\n${nestedYaml}`;
          }
          return `${key}: ${value}`;
        })
        .join('\n');
    }
  }, [configParams, viewFormat]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Loan Generator Inputs</CardTitle>
            <CardDescription>Configuration values used by the engine</CardDescription>
          </div>
          <Tabs value={viewFormat} onValueChange={(value) => setViewFormat(value as 'yaml' | 'json')} className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="yaml">YAML</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="w-full h-[300px]" />
        ) : (
          <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-xs">
            <code>{formattedConfig}</code>
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
