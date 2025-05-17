import { useState, useEffect } from 'react';
import { ApiTransformService } from './apiTransformService';
import { MetricsModel } from '../models/metrics';
import { CashflowModel } from '../models/cashflow';
import { PortfolioModel } from '../models/portfolio';
import { TransformOptions } from '../models/common';

interface ApiClient {
  fetchMetrics: (simulationId: string) => Promise<any>;
  fetchCashflow: (simulationId: string) => Promise<any>;
  fetchPortfolio: (simulationId: string) => Promise<any>;
}

interface TransformedData<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching and transforming metrics data
 * @param simulationId The simulation ID to fetch metrics for
 * @param apiClient The API client to use for fetching
 * @returns Transformed metrics data, loading state, and error
 */
export function useTransformedMetrics(
  simulationId: string,
  apiClient: ApiClient
): TransformedData<MetricsModel> {
  const [data, setData] = useState<MetricsModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await apiClient.fetchMetrics(simulationId);
        const transformedData = ApiTransformService.transformMetrics(response);
        setData(transformedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [simulationId, apiClient]);

  return { data, loading, error };
}

/**
 * Hook for fetching and transforming cashflow data
 * @param simulationId The simulation ID to fetch cashflow for
 * @param apiClient The API client to use for fetching
 * @param options Optional transformation options
 * @returns Transformed cashflow data, loading state, and error
 */
export function useTransformedCashflow(
  simulationId: string,
  apiClient: ApiClient,
  options?: TransformOptions
): TransformedData<CashflowModel> {
  const [data, setData] = useState<CashflowModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await apiClient.fetchCashflow(simulationId);
        const transformedData = ApiTransformService.transformCashflow(response, options);
        setData(transformedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [simulationId, apiClient, options]);

  return { data, loading, error };
}

/**
 * Hook for fetching and transforming portfolio data
 * @param simulationId The simulation ID to fetch portfolio for
 * @param apiClient The API client to use for fetching
 * @returns Transformed portfolio data, loading state, and error
 */
export function useTransformedPortfolio(
  simulationId: string,
  apiClient: ApiClient
): TransformedData<PortfolioModel> {
  const [data, setData] = useState<PortfolioModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await apiClient.fetchPortfolio(simulationId);
        const transformedData = ApiTransformService.transformPortfolio(response);
        setData(transformedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [simulationId, apiClient]);

  return { data, loading, error };
} 