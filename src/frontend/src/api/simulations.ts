import api from '../services/api';
import { API_BASE_URL } from '../config';
export interface VarianceAnalysisResult {
  status?: string;
  factors?: string[];
  variance_matrix?: number[][];
  explained_variance?: number[];
}

export const getVarianceAnalysis = async (
  simulationId: string
): Promise<VarianceAnalysisResult> => {
  const endpoint = API_BASE_URL.endsWith('/')
    ? `api/simulations/${simulationId}/variance-analysis`
    : `/api/simulations/${simulationId}/variance-analysis`;
  const response = await api.get(endpoint);
  return response.data as VarianceAnalysisResult;
};

