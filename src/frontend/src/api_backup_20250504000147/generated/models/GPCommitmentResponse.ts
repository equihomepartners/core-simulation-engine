/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FundCommitmentResponse } from './FundCommitmentResponse';
/**
 * Response model for GP commitment.
 */
export type GPCommitmentResponse = {
    total_commitment: number;
    total_return: number;
    multiple: number;
    roi: number;
    by_fund: Record<string, FundCommitmentResponse>;
};

