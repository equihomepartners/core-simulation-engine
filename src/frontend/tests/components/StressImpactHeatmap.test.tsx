import { render, screen } from '@testing-library/react';
import { StressImpactHeatmap } from '@/components/results/StressImpactHeatmap';

jest.mock('@/hooks/use-grid-stress-results', () => ({
  useGridStressResults: () => ({ data: { factors: [1,2], irr_matrix: [[0.1,0.2],[0.3,0.4]] }, isLoading: false })
}));

test('renders heatmap table', () => {
  render(<StressImpactHeatmap simulationId="1" />);
  expect(screen.getByRole('table')).toBeInTheDocument();
});
