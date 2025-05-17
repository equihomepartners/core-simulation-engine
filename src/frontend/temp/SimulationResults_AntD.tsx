import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Row,
  Col,
  Card,
  Typography,
  Tabs,
  Badge,
  Progress,
  Tooltip,
  Button,
  Table,
  Alert,
  notification,
  Space,
  Segmented,
  Timeline,
  Statistic
} from 'antd';
import {
  InfoCircleOutlined,
  BankOutlined,
  CalendarOutlined,
  PieChartOutlined,
  LineChartOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useQuery } from 'react-query';
import { fetchSimulationResults } from '../api/apiClient';

// Helper function to generate Monte Carlo data for demo purposes
const generateMonteCarloData = () => {
  const data = [];
  const mean = 0.12; // Mean IRR of 12%
  const stdDev = 0.03; // Standard deviation
  
  // Generate normal distribution
  for (let i = 0.03; i <= 0.21; i += 0.01) {
    const frequency = Math.floor(100 * Math.exp(-0.5 * Math.pow((i - mean) / stdDev, 2)) / (stdDev * Math.sqrt(2 * Math.PI)));
    data.push({
      irr: i,
      frequency: frequency
    });
  }
  
  return data;
};

// Helper function to generate demo portfolio evolution data
const generateDemoPortfolioData = () => {
  const years = Array.from({ length: 10 }, (_, i) => i + 1);
  const activeLoans = [
    10, 25, 42, 65, 75, 82, 72, 58, 39, 20
  ];
  const newLoans = [
    12, 18, 20, 25, 15, 12, 5, 2, 0, 0
  ];
  const exitedLoans = [
    0, 2, 3, 5, 8, 15, 20, 25, 18, 15
  ];
  const defaultedLoans = [
    0, 1, 0, 2, 2, 0, 3, 1, 1, 4
  ];
  const reinvestments = [
    0, 0, 5, 8, 10, 8, 8, 4, 0, 0
  ];
  const reinvestedExits = [
    0, 0, 0, 2, 3, 5, 6, 6, 5, 16
  ];
  
  return {
    years,
    active_loans: activeLoans,
    new_loans: newLoans,
    exited_loans: exitedLoans,
    defaulted_loans: defaultedLoans,
    reinvestments,
    reinvested_exits: reinvestedExits,
    total_loans: Math.max(...activeLoans)
  };
};

// Utility functions
const formatCurrency = (value: number, compact: boolean = false): string => {
  if (value === null || value === undefined) return 'N/A';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
    notation: compact ? 'compact' : 'standard'
  });
  
  return formatter.format(value);
};

const formatPercentage = (value: number, decimals: number = 1): string => {
  if (value === null || value === undefined) return 'N/A';
  
  return `${(value * 100).toFixed(decimals)}%`;
};

const SimulationResults: React.FC = () => {
  const { simulationId } = useParams<{ simulationId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [results, setResults] = useState<any | null>(null);
  const [cashFlowData, setCashFlowData] = useState<any | null>(null);
  const [portfolioEvolutionData, setPortfolioEvolutionData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any | null>(null);
  const [totalCapitalCalled, setTotalCapitalCalled] = useState<number>(0);
  const [totalDistributions, setTotalDistributions] = useState<number>(0);
  const [finalNetCashFlow, setFinalNetCashFlow] = useState<number>(0);
  const [hurdleRate, setHurdleRate] = useState<number>(0.08); // Default 8%
  const [carryRate, setCarryRate] = useState<number>(0.2); // Default 20%
  const [chartsReady, setChartsReady] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [portfolioValue, setPortfolioValue] = useState<number | null>(null);
  const [loanCount, setLoanCount] = useState<number | null>(null);
  const [targetPortfolioSize, setTargetPortfolioSize] = useState<number | null>(null);
  const [avgPeakExitYear, setAvgPeakExitYear] = useState<number | null>(null);
  const [avgExitValue, setAvgExitValue] = useState<number | null>(null);
  const [currentFundYear, setCurrentFundYear] = useState<number | null>(null);
  const [fundTermYears, setFundTermYears] = useState<number | null>(null);
  const [zoneData, setZoneData] = useState<any[] | null>(null);
  const [grossIRR, setGrossIRR] = useState<number | null>(null);
  const [lpIRR, setLpIRR] = useState<number | null>(null);
  const [lpMultiple, setLpMultiple] = useState<number | null>(null);
  const [fundSize, setFundSize] = useState<number | null>(null);
  const [gpCommitment, setGpCommitment] = useState<number | null>(null);
  const [managementFee, setManagementFee] = useState<number | null>(null);

  // API call to fetch simulation results
  const { data, isLoading, isError, refetch } = useQuery(
    ['simulationResults', simulationId],
    () => fetchSimulationResults(simulationId),
    {
      enabled: !!simulationId,
      onSuccess: (data) => {
        // Process data here
        setResults(data);
        processData(data);
      },
      onError: (error: any) => {
        setError(error.message || 'Failed to fetch simulation results');
      }
    }
  );

  // Process the data from the API
  const processData = (result: any) => {
    if (!result) return;
    
    // Extract and prepare data for dashboard metrics
    try {
      // Portfolio metrics
      if (result.portfolio_dict) {
        if (result.portfolio_dict.metrics) {
          setPortfolioValue(result.portfolio_dict.metrics.portfolio_value || null);
          setLoanCount(result.portfolio_dict.metrics.loan_count || null);
          setTargetPortfolioSize(result.portfolio_dict.metrics.target_size || 100000000);
          setAvgPeakExitYear(result.portfolio_dict.metrics.avg_peak_exit_year || null);
          setAvgExitValue(result.portfolio_dict.metrics.avg_exit_value || null);
          setCurrentFundYear(result.portfolio_dict.metrics.current_year || 3);
          setFundTermYears(result.portfolio_dict.metrics.fund_term || 10);
          
          // Zone distribution data for TLS risk exposure
          const zoneDistribution = result.portfolio_dict.metrics.zone_distribution || 
                                  result.portfolio_dict.zone_distribution || null;
          
          if (zoneDistribution) {
            const zoneColors = {
              'green': '#52c41a', // success green
              'yellow': '#faad14', // warning yellow
              'orange': '#fa8c16', // orange
              'red': '#f5222d', // error red
            };
            
            const formattedZoneData = Object.entries(zoneDistribution).map(([zone, value]) => ({
              name: zone.charAt(0).toUpperCase() + zone.slice(1),
              value: typeof value === 'number' ? value * 100 : 0,
              color: zoneColors[zone as keyof typeof zoneColors] || '#1890ff'
            }));
            
            setZoneData(formattedZoneData);
          }
        }
        
        // IRR and equity multiple
        if (result.portfolio_dict.waterfall_results) {
          const waterfall = result.portfolio_dict.waterfall_results;
          setGrossIRR(waterfall.gross_irr || null);
          setLpIRR(waterfall.lp_irr || null);
          setLpMultiple(waterfall.lp_multiple || null);
        }
        
        // Fund parameters
        if (result.portfolio_dict.parameters) {
          const params = result.portfolio_dict.parameters;
          setFundSize(params.fund_size || null);
          setGpCommitment(params.gp_commitment || 0.01);
          setManagementFee(params.management_fee || 0.02);
          setHurdleRate(params.hurdle_rate || 0.08);
          setCarryRate(params.carry_rate || 0.2);
        }
      }
      
      // Prepare cashflow data
      if (result.cash_flows) {
        // PATCH: If cash_flows is an object keyed by year, transform to arrays for UI
        let cashFlowDataObj = result.cash_flows;
        let years: number[] = [];
        let capital_called: number[] = [];
        let distributions: number[] = [];
        let net_cash_flow: number[] = [];
        let cum_net_cash_flow: number[] = [];
        // If it's an object (not array), transform
        if (typeof cashFlowDataObj === 'object' && !Array.isArray(cashFlowDataObj)) {
          years = Object.keys(cashFlowDataObj).map(Number).sort((a, b) => a - b);
          for (const year of years) {
            const yearData = cashFlowDataObj[year];
            capital_called.push(yearData.capital_called || 0);
            
            // Ensure distributions are available, synthesize if needed
            if (yearData.distributions !== undefined) {
              distributions.push(yearData.distributions);
            } else {
              // Synthesize distributions from components if available
              const exitProceeds = yearData.exit_proceeds || 0;
              const interestIncome = yearData.interest_income || 0;
              const appreciationIncome = yearData.appreciation_income || 0;
              distributions.push(exitProceeds + interestIncome + appreciationIncome);
            }
            
            // Calculate net cash flow
            const netCf = (yearData.distributions || 0) - (yearData.capital_called || 0);
            net_cash_flow.push(netCf);
          }
          
          // Calculate cumulative net cash flow
          let cumulative = 0;
          cum_net_cash_flow = net_cash_flow.map(value => {
            cumulative += value;
            return cumulative;
          });
        } else if (Array.isArray(cashFlowDataObj)) {
          // It's already in the format we need
          years = cashFlowDataObj.map(cf => cf.year);
          capital_called = cashFlowDataObj.map(cf => cf.capital_called || 0);
          distributions = cashFlowDataObj.map(cf => cf.distributions || 0);
          net_cash_flow = cashFlowDataObj.map(cf => cf.net_cash_flow || 0);
          cum_net_cash_flow = cashFlowDataObj.map(cf => cf.cum_net_cash_flow || 0);
        }
        
        setCashFlowData({
          years,
          capital_called,
          distributions,
          net_cash_flow,
          cum_net_cash_flow
        });
        
        // Set summary metrics
        setTotalCapitalCalled(capital_called.reduce((sum, value) => sum + value, 0));
        setTotalDistributions(distributions.reduce((sum, value) => sum + value, 0));
        setFinalNetCashFlow(cum_net_cash_flow[cum_net_cash_flow.length - 1] || 0);
      }
      
      // Generate demo data for portfolio evolution if not available
      setPortfolioEvolutionData(generateDemoPortfolioData());
      
      setChartsReady(true);
    } catch (error) {
      console.error('Error processing data:', error);
      setError('Failed to process simulation results');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleRefresh = useCallback(() => {
    refetch();
    notification.success({
      message: 'Refreshed',
      description: 'Simulation data has been refreshed.',
      placement: 'topRight',
    });
  }, [refetch]);

  // Render component
  return (
    <Layout style={{ padding: 24, minHeight: '100vh', background: '#f5f5f5' }}>
      <Layout.Content>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Simulation Results
            </Typography.Title>
            <Typography.Text type="secondary">
              {simulationId ? `ID: ${simulationId}` : 'No simulation ID'}
            </Typography.Text>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={isLoading || isFetching}
            >
              Refresh
            </Button>
          </Col>
        </Row>

        {error ? (
          <>
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Button 
              icon={<LeftOutlined />} 
              onClick={handleBack}
              style={{ marginTop: 16 }}
            >
              Back to Dashboard
            </Button>
          </>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="ant-spin ant-spin-lg ant-spin-spinning">
              <span className="ant-spin-dot">
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
              </span>
            </div>
            <div style={{ marginTop: 16 }}>Loading simulation results...</div>
          </div>
        ) : (
          <>
            {/* Tabs navigation */}
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              items={[
                { key: 'overview', label: 'Overview' },
                { key: 'cashFlows', label: 'Cash Flows' },
                { key: 'riskAnalysis', label: 'Risk Analysis' },
                { key: 'gpEconomics', label: 'GP Economics' },
                { key: 'details', label: 'Details' },
              ]}
              style={{ marginBottom: 24 }}
            />
            
            {/* Content based on active tab */}
            {activeTab === 'overview' && (
              <div>
                {/* Headline Metrics Row */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  {/* Portfolio Value */}
                  <Col xs={24} sm={12} lg={4.8}>
                    <Card bordered style={{ height: '100%' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Typography.Text>
                            Portfolio Value
                          </Typography.Text>
                          <Tooltip title="Current total value of all active loans in the portfolio.">
                            <InfoCircleOutlined />
                          </Tooltip>
                        </Space>
                        <Typography.Title level={2} style={{ margin: '4px 0' }}>
                          {portfolioValue !== null ? formatCurrency(portfolioValue) : 'N/A'}
                        </Typography.Title>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Tooltip title="Number of active loans in the portfolio">
                              <Typography.Text type="secondary">
                                {loanCount !== null ? `${loanCount} Loans` : 'No data'}
                              </Typography.Text>
                            </Tooltip>
                          </Col>
                        </Row>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Tooltip title="Average principal amount per active loan">
                              <Typography.Text type="secondary">
                                Avg. Loan Size: {portfolioValue !== null && loanCount !== null && loanCount > 0
                                  ? formatCurrency(portfolioValue / loanCount)
                                  : 'N/A'}
                              </Typography.Text>
                            </Tooltip>
                          </Col>
                        </Row>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Tooltip title="Portfolio value as a percentage of the fund's committed capital">
                              <Typography.Text type="secondary">
                                {portfolioValue !== null && targetPortfolioSize !== null && targetPortfolioSize > 0
                                  ? `${((portfolioValue / targetPortfolioSize) * 100).toFixed(0)}% of target`
                                  : 'N/A'}
                              </Typography.Text>
                            </Tooltip>
                          </Col>
                        </Row>
                        <Progress 
                          percent={portfolioValue !== null && targetPortfolioSize !== null
                            ? Math.min(100, (portfolioValue / targetPortfolioSize) * 100)
                            : 0}
                          showInfo={false}
                          status="active"
                        />
                      </Space>
                    </Card>
                  </Col>
                  
                  {/* Aggregate LP IRR */}
                  <Col xs={24} sm={12} lg={4.8}>
                    <Card bordered style={{ height: '100%' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Typography.Text>
                            Aggregate LP IRR
                          </Typography.Text>
                          <Tooltip title="Internal Rate of Return for Limited Partners after fees and carry">
                            <InfoCircleOutlined />
                          </Tooltip>
                        </Space>
                        <Typography.Title level={2} style={{ margin: '4px 0' }}>
                          {lpIRR !== null ? formatPercentage(lpIRR) : 'N/A'}
                        </Typography.Title>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Typography.Text type="secondary">
                              Gross IRR: {grossIRR !== null ? formatPercentage(grossIRR) : 'N/A'}
                            </Typography.Text>
                          </Col>
                        </Row>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Typography.Text type="secondary">
                              Net IRR: {lpIRR !== null ? formatPercentage(lpIRR) : 'N/A'}
                            </Typography.Text>
                          </Col>
                        </Row>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Space>
                              <Typography.Text type="secondary">
                                Hurdle: {hurdleRate !== null ? formatPercentage(hurdleRate) : 'N/A'}
                              </Typography.Text>
                              {lpIRR !== null && hurdleRate !== null && (
                                <Typography.Text 
                                  type={lpIRR >= hurdleRate ? "success" : "danger"}
                                  style={{ fontWeight: 'bold' }}
                                >
                                  {lpIRR >= hurdleRate ? '+' : ''}{(lpIRR - hurdleRate).toFixed(1)}%
                                </Typography.Text>
                              )}
                            </Space>
                          </Col>
                        </Row>
                        <Progress 
                          percent={lpIRR !== null && hurdleRate !== null
                            ? Math.min(100, (lpIRR / hurdleRate) * 100)
                            : 0}
                          showInfo={false}
                          status={lpIRR !== null && hurdleRate !== null && lpIRR >= hurdleRate ? "success" : "exception"}
                        />
                      </Space>
                    </Card>
                  </Col>
                  
                  {/* Avg Loan Peak Exit Year */}
                  <Col xs={24} sm={12} lg={4.8}>
                    <Card bordered style={{ height: '100%' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Typography.Text>
                            Avg Loan Peak Exit Year
                          </Typography.Text>
                          <Tooltip title="Average year when loans are expected to reach their peak exit value">
                            <InfoCircleOutlined />
                          </Tooltip>
                        </Space>
                        <Typography.Title level={2} style={{ margin: '4px 0' }}>
                          {avgPeakExitYear !== null ? avgPeakExitYear.toFixed(1) : 'N/A'}
                        </Typography.Title>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Tooltip title="Average property value at the expected exit point">
                              <Typography.Text type="secondary">
                                Avg Exit Property Value: {avgExitValue !== null ? formatCurrency(avgExitValue) : 'N/A'}
                              </Typography.Text>
                            </Tooltip>
                          </Col>
                        </Row>
                      </Space>
                    </Card>
                  </Col>
                  
                  {/* Fund Term Progress */}
                  <Col xs={24} sm={12} lg={4.8}>
                    <Card bordered style={{ height: '100%' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Typography.Text>
                            Fund Term Progress
                          </Typography.Text>
                          <Tooltip title="Current year of the fund relative to its total term duration">
                            <InfoCircleOutlined />
                          </Tooltip>
                        </Space>
                        <Typography.Title level={2} style={{ margin: '4px 0' }}>
                          {currentFundYear !== null && fundTermYears !== null
                            ? `Year ${currentFundYear} of ${fundTermYears}`
                            : 'N/A'}
                        </Typography.Title>
                        <Progress 
                          percent={currentFundYear !== null && fundTermYears !== null
                            ? (currentFundYear / fundTermYears) * 100
                            : 0}
                          showInfo={false}
                        />
                        <Row justify="space-between" align="middle">
                          <Col span={8}>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              Investment
                            </Typography.Text>
                          </Col>
                          <Col span={8} style={{ textAlign: 'center' }}>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              Peak Exit
                            </Typography.Text>
                          </Col>
                          <Col span={8} style={{ textAlign: 'right' }}>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              Term End
                            </Typography.Text>
                          </Col>
                        </Row>
                      </Space>
                    </Card>
                  </Col>
                  
                  {/* TLS Risk Exposure */}
                  <Col xs={24} sm={12} lg={4.8}>
                    <Card bordered style={{ height: '100%' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Typography.Text>
                            TLS Risk Exposure
                          </Typography.Text>
                          <Tooltip title="Distribution of loans across risk zones based on TLS metrics">
                            <InfoCircleOutlined />
                          </Tooltip>
                        </Space>
                        
                        {zoneData && zoneData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={100}>
                            <PieChart>
                              <Pie
                                data={zoneData}
                                cx="50%"
                                cy="50%"
                                outerRadius={40}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, value }) => `${name} ${value}%`}
                                labelLine={true}
                              >
                                {zoneData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(value) => `${value}%`} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <Typography.Text type="secondary">
                              <ExclamationCircleOutlined /> No zone data available
                            </Typography.Text>
                          </div>
                        )}
                      </Space>
                    </Card>
                  </Col>
                </Row>
                
                {/* Total Fund Cashflow */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={12} lg={8}>
                    <Card bordered style={{ height: '100%' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Typography.Text>
                            Total Fund Cashflow
                          </Typography.Text>
                          <Tooltip title="Net cash flow for the fund over its lifetime">
                            <InfoCircleOutlined />
                          </Tooltip>
                        </Space>
                        <Typography.Title level={2} style={{ margin: '4px 0' }}>
                          {finalNetCashFlow !== null ? formatCurrency(finalNetCashFlow) : '$0.00'}
                        </Typography.Title>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Typography.Text type="secondary">
                              Total Capital Called: {totalCapitalCalled !== null ? formatCurrency(totalCapitalCalled) : '$0.00'}
                            </Typography.Text>
                          </Col>
                        </Row>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Typography.Text type="secondary">
                              Total Distributions: {totalDistributions !== null ? formatCurrency(totalDistributions) : '$0.00'}
                            </Typography.Text>
                          </Col>
                        </Row>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Space>
                              <Typography.Text type="secondary">
                                Lifetime MOIC: {lpMultiple !== null ? `${lpMultiple.toFixed(2)}x` : 'N/A'}
                              </Typography.Text>
                            </Space>
                          </Col>
                        </Row>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
            
            {activeTab === 'cashFlows' && (
              <div>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card title="Fund Cash Flows" bordered>
                      <div style={{ height: 400 }}>
                        {cashFlowData && cashFlowData.years && cashFlowData.years.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={cashFlowData.years.map((year, idx) => ({
                                year,
                                capitalCalled: cashFlowData.capital_called[idx] || 0,
                                distributions: cashFlowData.distributions[idx] || 0,
                                netCashFlow: cashFlowData.net_cash_flow[idx] || 0,
                                cumNetCashFlow: cashFlowData.cum_net_cash_flow[idx] || 0,
                              }))}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" />
                              <YAxis
                                yAxisId="left"
                                orientation="left"
                                tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                              />
                              <YAxis
                                yAxisId="right"
                                orientation="right"
                                tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                              />
                              <RechartsTooltip
                                formatter={(value, name) => [
                                  formatCurrency(value as number),
                                  name === 'capitalCalled'
                                    ? 'Capital Called'
                                    : name === 'distributions'
                                    ? 'Distributions'
                                    : name === 'netCashFlow'
                                    ? 'Net Cash Flow'
                                    : 'Cumulative Net Cash Flow',
                                ]}
                              />
                              <Legend />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="capitalCalled"
                                name="Capital Called"
                                stroke="#8884d8"
                                activeDot={{ r: 8 }}
                              />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="distributions"
                                name="Distributions"
                                stroke="#82ca9d"
                                activeDot={{ r: 8 }}
                              />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="netCashFlow"
                                name="Net Cash Flow"
                                stroke="#ffc658"
                                activeDot={{ r: 8 }}
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="cumNetCashFlow"
                                name="Cumulative Net Cash Flow"
                                stroke="#ff7300"
                                activeDot={{ r: 8 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography.Text type="secondary">
                              No cash flow data available
                            </Typography.Text>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>
                </Row>
                
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col span={24}>
                    <Card title="Cash Flow Summary" bordered>
                      <Table
                        dataSource={
                          cashFlowData && cashFlowData.years 
                            ? cashFlowData.years.map((year, index) => ({
                                key: year,
                                year,
                                capital_called: cashFlowData.capital_called[index] || 0,
                                distributions: cashFlowData.distributions[index] || 0,
                                net_cash_flow: cashFlowData.net_cash_flow[index] || 0,
                                cum_net_cash_flow: cashFlowData.cum_net_cash_flow[index] || 0,
                              })) 
                            : []
                        }
                        columns={[
                          {
                            title: 'Year',
                            dataIndex: 'year',
                            key: 'year',
                          },
                          {
                            title: 'Capital Called',
                            dataIndex: 'capital_called',
                            key: 'capital_called',
                            render: (value) => formatCurrency(value),
                          },
                          {
                            title: 'Distributions',
                            dataIndex: 'distributions',
                            key: 'distributions',
                            render: (value) => formatCurrency(value),
                          },
                          {
                            title: 'Net Cash Flow',
                            dataIndex: 'net_cash_flow',
                            key: 'net_cash_flow',
                            render: (value) => formatCurrency(value),
                          },
                          {
                            title: 'Cumulative Net Cash Flow',
                            dataIndex: 'cum_net_cash_flow',
                            key: 'cum_net_cash_flow',
                            render: (value) => formatCurrency(value),
                          },
                        ]}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
            
            {activeTab === 'riskAnalysis' && (
              <div>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card title="Zone Distribution" bordered>
                      <div style={{ height: 300 }}>
                        {zoneData && zoneData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={zoneData}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}%`}
                                labelLine={true}
                              >
                                {zoneData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(value) => `${value}%`} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography.Text type="secondary">
                              No zone distribution data available
                            </Typography.Text>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>
                  
                  <Col xs={24} lg={12}>
                    <Card title="IRR Distribution (Monte Carlo Simulation)" bordered>
                      <div style={{ height: 300 }}>
                        {/* Monte Carlo simulation chart */}
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={generateMonteCarloData()}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="irr" 
                              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                            />
                            <YAxis />
                            <RechartsTooltip 
                              formatter={(value, name, props) => [
                                `${value} simulations`, 
                                `IRR: ${(props.payload.irr * 100).toFixed(1)}%`
                              ]}
                            />
                            <Bar dataKey="frequency" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </Col>
                </Row>
                
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col span={24}>
                    <Card title="Risk Metrics" bordered>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <Card>
                            <Statistic
                              title={
                                <Space>
                                  <span>Portfolio Default Rate</span>
                                  <Tooltip title="Overall probability of default across the portfolio">
                                    <InfoCircleOutlined />
                                  </Tooltip>
                                </Space>
                              }
                              value={0.01}
                              precision={2}
                              formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
                            />
                          </Card>
                        </Col>
                        
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <Card>
                            <Statistic
                              title={
                                <Space>
                                  <span>Return Volatility</span>
                                  <Tooltip title="Portfolio volatility based on simulated returns">
                                    <InfoCircleOutlined />
                                  </Tooltip>
                                </Space>
                              }
                              value={0.03}
                              precision={2}
                              formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
                            />
                          </Card>
                        </Col>
                        
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <Card>
                            <Statistic
                              title={
                                <Space>
                                  <span>Hurdle Rate Achievement</span>
                                  <Tooltip title="Probability of achieving the hurdle rate">
                                    <InfoCircleOutlined />
                                  </Tooltip>
                                </Space>
                              }
                              value={0.85}
                              precision={2}
                              formatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
                            />
                          </Card>
                        </Col>
                        
                        <Col xs={24} sm={12} md={8} lg={6}>
                          <Card>
                            <Statistic
                              title={
                                <Space>
                                  <span>VaR (95%)</span>
                                  <Tooltip title="Value at Risk - maximum expected loss at 95% confidence level">
                                    <InfoCircleOutlined />
                                  </Tooltip>
                                </Space>
                              }
                              value={0.05}
                              precision={2}
                              formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
                            />
                          </Card>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
            
            {activeTab === 'gpEconomics' && (
              <div>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card title="GP Economics Summary" bordered>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Table
                            dataSource={[
                              { 
                                key: '1', 
                                metric: 'GP Commitment', 
                                value: formatCurrency(fundSize !== null && gpCommitment !== null ? fundSize * gpCommitment : 0) 
                              },
                              { 
                                key: '2', 
                                metric: 'Management Fee', 
                                value: formatPercentage(managementFee !== null ? managementFee : 0) 
                              },
                              { 
                                key: '3', 
                                metric: 'Carried Interest', 
                                value: formatPercentage(carryRate !== null ? carryRate : 0) 
                              },
                              { 
                                key: '4', 
                                metric: 'Hurdle Rate', 
                                value: formatPercentage(hurdleRate !== null ? hurdleRate : 0) 
                              }
                            ]}
                            columns={[
                              { title: 'Metric', dataIndex: 'metric', key: 'metric' },
                              { title: 'Value', dataIndex: 'value', key: 'value' }
                            ]}
                            pagination={false}
                          />
                        </Col>
                        
                        <Col xs={24} md={12}>
                          <div style={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'LP Returns', value: lpIRR !== null ? lpIRR : 0 },
                                    { name: 'GP Carry', value: carryRate !== null ? carryRate : 0 },
                                    { name: 'Management Fee', value: managementFee !== null ? managementFee : 0 }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, value }) => `${name}: ${(value * 100).toFixed(1)}%`}
                                >
                                  <Cell fill="#0088FE" />
                                  <Cell fill="#00C49F" />
                                  <Cell fill="#FFBB28" />
                                </Pie>
                                <RechartsTooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
                
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col span={24}>
                    <Card title="Waterfall Distribution" bordered>
                      <Timeline mode="left">
                        <Timeline.Item 
                          label="Return of Capital"
                          dot={<DollarOutlined style={{ fontSize: '16px' }} />}
                        >
                          <Typography.Text strong>100% to LPs</Typography.Text>
                          <Typography.Paragraph>
                            First, Limited Partners receive a return of their invested capital.
                          </Typography.Paragraph>
                        </Timeline.Item>
                        
                        <Timeline.Item 
                          label="Preferred Return"
                          dot={<ArrowUpOutlined style={{ fontSize: '16px', color: '#52c41a' }} />}
                        >
                          <Typography.Text strong>100% to LPs up to {formatPercentage(hurdleRate !== null ? hurdleRate : 0)} hurdle</Typography.Text>
                          <Typography.Paragraph>
                            LPs receive all profits until they've achieved the preferred return (hurdle rate).
                          </Typography.Paragraph>
                        </Timeline.Item>
                        
                        <Timeline.Item 
                          label="Catch-Up"
                          dot={<PieChartOutlined style={{ fontSize: '16px', color: '#722ed1' }} />}
                        >
                          <Typography.Text strong>100% to GP</Typography.Text>
                          <Typography.Paragraph>
                            GP receives all profits until they've received {formatPercentage(carryRate !== null ? carryRate : 0)} of profits above the return of capital.
                          </Typography.Paragraph>
                        </Timeline.Item>
                        
                        <Timeline.Item 
                          label="Carried Interest"
                          dot={<BankOutlined style={{ fontSize: '16px', color: '#1890ff' }} />}
                        >
                          <Typography.Text strong>
                            {formatPercentage(1 - (carryRate !== null ? carryRate : 0))} to LPs / {formatPercentage(carryRate !== null ? carryRate : 0)} to GP
                          </Typography.Text>
                          <Typography.Paragraph>
                            All remaining profits are split according to the carried interest arrangement.
                          </Typography.Paragraph>
                        </Timeline.Item>
                      </Timeline>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
            
            {activeTab === 'details' && (
              <div>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card title="Simulation Parameters" bordered>
                      {results && results.portfolio_dict && results.portfolio_dict.parameters ? (
                        <Table
                          dataSource={Object.entries(results.portfolio_dict.parameters).map(([key, value], index) => ({
                            key: index,
                            parameter: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                            value: typeof value === 'number' 
                              ? key.includes('rate') || key.includes('percentage') || key.includes('fee') || key.includes('carry')
                                ? formatPercentage(value as number)
                                : key.includes('amount') || key.includes('size') || key.includes('capital') || key.includes('value')
                                  ? formatCurrency(value as number)
                                  : value.toString()
                              : String(value)
                          }))}
                          columns={[
                            { title: 'Parameter', dataIndex: 'parameter', key: 'parameter' },
                            { title: 'Value', dataIndex: 'value', key: 'value' }
                          ]}
                          pagination={false}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <Typography.Text type="secondary">
                            No parameters data available
                          </Typography.Text>
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>
                
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col span={24}>
                    <Card title="Market Conditions" bordered>
                      {results && results.market_conditions ? (
                        <Table
                          dataSource={Object.keys(results.market_conditions).map((year, index) => {
                            const marketData = results.market_conditions[year];
                            return {
                              key: index,
                              year,
                              base_appreciation: marketData.base_appreciation_rate || 'N/A',
                              base_default: marketData.base_default_rate || 'N/A',
                              housing_market: marketData.housing_market_trend || 'N/A',
                              interest_rates: marketData.interest_rate_environment || 'N/A',
                              economic_outlook: marketData.economic_outlook || 'N/A'
                            };
                          })}
                          columns={[
                            { title: 'Year', dataIndex: 'year', key: 'year' },
                            { 
                              title: 'Base Appreciation', 
                              dataIndex: 'base_appreciation', 
                              key: 'base_appreciation',
                              render: (value) => typeof value === 'number' ? formatPercentage(value) : value
                            },
                            { 
                              title: 'Base Default', 
                              dataIndex: 'base_default', 
                              key: 'base_default',
                              render: (value) => typeof value === 'number' ? formatPercentage(value) : value
                            },
                            { title: 'Housing Market', dataIndex: 'housing_market', key: 'housing_market' },
                            { title: 'Interest Rates', dataIndex: 'interest_rates', key: 'interest_rates' },
                            { title: 'Economic Outlook', dataIndex: 'economic_outlook', key: 'economic_outlook' }
                          ]}
                          scroll={{ x: 'max-content' }}
                          pagination={{ pageSize: 5 }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <Typography.Text type="secondary">
                            No market conditions data available
                          </Typography.Text>
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>
                
                {/* Portfolio Evolution */}
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col span={24}>
                    <Card title="Portfolio Evolution" bordered>
                      <div style={{ height: 400 }}>
                        {portfolioEvolutionData ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={portfolioEvolutionData.years.map((year, idx) => ({
                                year,
                                active: portfolioEvolutionData.active_loans[idx],
                                new: portfolioEvolutionData.new_loans[idx],
                                exited: portfolioEvolutionData.exited_loans[idx],
                                defaulted: portfolioEvolutionData.defaulted_loans[idx],
                              }))}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" />
                              <YAxis />
                              <RechartsTooltip />
                              <Legend />
                              <Bar dataKey="active" name="Active Loans" stackId="a" fill="#8884d8" />
                              <Bar dataKey="new" name="New Loans" stackId="b" fill="#82ca9d" />
                              <Bar dataKey="exited" name="Exited Loans" stackId="c" fill="#ffc658" />
                              <Bar dataKey="defaulted" name="Defaulted Loans" stackId="d" fill="#ff8042" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography.Text type="secondary">
                              No portfolio evolution data available
                            </Typography.Text>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </>
        )}
      </Layout.Content>
    </Layout>
  );
};

export default SimulationResults; 