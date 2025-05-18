import { render, screen } from '@testing-library/react';
import { BootstrapFanChart } from '@/components/results/BootstrapFanChart';

jest.mock('@/hooks/use-bootstrap-results', () => ({
  useBootstrapResults: () => ({ data: { irr_distribution: [0.1,0.2] }, isLoading: false })
}));

test('renders bootstrap chart container', () => {
  render(<BootstrapFanChart simulationId="1" />);
  expect(screen.getByText(/Bootstrap Fan Chart/)).toBeInTheDocument();
});
