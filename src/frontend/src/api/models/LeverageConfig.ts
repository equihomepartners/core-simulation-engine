/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Configuration block for leverage facilities.
 */
export type LeverageConfig = {
    green_sleeve?: {
        enabled?: boolean;
        max_mult?: number;
        spread_bps?: number;
        commitment_fee_bps?: number;
    };
    a_plus_overadvance?: {
        enabled?: boolean;
        tls_grade?: string;
        advance_rate?: number;
    };
    deal_note?: {
        enabled?: boolean;
        note_pct?: number;
        note_rate?: number;
    };
    ramp_line?: {
        enabled?: boolean;
        limit_pct_commit?: number;
        draw_period_months?: number;
        spread_bps?: number;
    };
    dynamic_rules?: Array<{
        trigger?: string;
        action?: string;
        max?: number;
    }>;
};

