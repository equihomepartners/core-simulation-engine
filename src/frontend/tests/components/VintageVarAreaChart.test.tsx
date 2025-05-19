import { render, screen } from '@testing-library/react';
import { VintageVarAreaChart } from '@/components/results/VintageVarAreaChart';

jest.mock('@/hooks/use-vintage-var-results', () => ({
  useVintageVarResults: () => ({ data: { vintage_var: { '2020': { value_at_risk: 0.1 } } }, isLoading: false })
}));

test('renders vintage var chart', () => {
  render(<VintageVarAreaChart simulationId="1" />);
  expect(screen.getByText(/Vintage VaR/)).toBeInTheDocument();
});
