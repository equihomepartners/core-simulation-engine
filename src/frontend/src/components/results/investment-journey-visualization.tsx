import React from 'react';
import { EnhancedInvestmentJourneyVisualization } from './investment-journey/main-visualization';
import { TimeGranularity } from '@/types/finance';

interface InvestmentJourneyVisualizationProps {
  results: any;
  isLoading: boolean;
  timeGranularity?: TimeGranularity;
  cumulativeMode?: boolean;
}

export function InvestmentJourneyVisualization(props: InvestmentJourneyVisualizationProps) {
  return <EnhancedInvestmentJourneyVisualization {...props} />;
}

export default InvestmentJourneyVisualization; 