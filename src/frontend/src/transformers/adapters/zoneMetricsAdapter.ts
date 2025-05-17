/**
 * ZoneMetrics adapter – light wrapper around the TLS dataset so the UI
 * can depend on a stable shape and safe types.
 */
import type { ZoneMetrics } from '../../api/models/ZoneMetrics';
import { wrapTransformError } from '../core/errorHandling';

export namespace ZoneMetricsAdapter {
  /**
   * Transform the raw API response from `/api/traffic-light/zones` into a
   * strongly-typed array.  The data already matches the generated SDK type, so
   * we mostly just cast & safeguard here.
   */
  export const transform = wrapTransformError((apiResponse: any): ZoneMetrics[] => {
    if (!Array.isArray(apiResponse)) {
      // Fast fallback: wrap single object or null response
      return apiResponse ? [apiResponse as ZoneMetrics] : [];
    }
    return apiResponse as ZoneMetrics[];
  }, 'ZoneMetrics transformation error');
} 