import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useFormContext } from 'react-hook-form';

// Define ZoneMetrics interface
interface ZoneMetrics {
  id: string;
  name: string;
  zone_color: string;
  growth_mu: number;
  risk_weight: number;
}

interface SuburbSelectorProps {
  name: string;
  label: string;
  description?: string;
  tooltip?: string;
}

export function SuburbSelector({ name, label, description, tooltip }: SuburbSelectorProps) {
  const { defaultClient } = useApi();
  const [zones, setZones] = useState<ZoneMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'mock' | 'production'>('mock');
  const [selectedZones, setSelectedZones] = useState<Record<string, string[]>>({
    green: [],
    orange: [],
    red: []
  });
  const [useTlsGrowth, setUseTlsGrowth] = useState(false);

  const { setValue, getValues } = useFormContext();

  // Fetch zones from API
  useEffect(() => {
    const fetchZones = async () => {
      try {
        setLoading(true);
        // Use the correct API endpoint path
        const zonesData = await defaultClient.getApiTrafficLightZones(dataSource);
        setZones(zonesData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching zones:', err);
        setError('Failed to load suburb data');
        setLoading(false);
      }
    };

    fetchZones();
  }, [defaultClient]);

  // Group zones by color
  const zonesByColor = zones.reduce((acc, zone) => {
    const color = zone.zone_color as string;
    if (!acc[color]) {
      acc[color] = [];
    }
    acc[color].push(zone);
    return acc;
  }, {} as Record<string, ZoneMetrics[]>);

  // Update form values when selections change
  useEffect(() => {
    // Create zone_profiles object
    const zoneProfiles: Record<string, { ids: string[], weight: number }> = {};

    // Add selected zones to profiles
    Object.entries(selectedZones).forEach(([color, ids]) => {
      if (ids.length > 0) {
        zoneProfiles[color] = {
          ids,
          weight: color === 'green' ? 0.6 : color === 'orange' ? 0.3 : 0.1
        };
      }
    });

    // Set form values
    setValue('geo_strategy', 'profile');
    setValue('zone_profiles', zoneProfiles);
    setValue('use_tls_zone_growth', useTlsGrowth);
    setValue('data_source', dataSource);

  }, [selectedZones, useTlsGrowth, dataSource, setValue]);

  // Handle zone selection
  const handleZoneSelection = (color: string, id: string, checked: boolean) => {
    setSelectedZones(prev => {
      const newSelection = { ...prev };
      if (checked) {
        newSelection[color] = [...(newSelection[color] || []), id];
      } else {
        newSelection[color] = (newSelection[color] || []).filter(zoneId => zoneId !== id);
      }
      return newSelection;
    });
  };

  // Always render the UI, even if loading or error
  // This ensures that the component is visible
  const isLoading = loading;
  const hasError = error !== null;

  // Debug information
  console.log('SuburbSelector rendering with:', {
    loading: isLoading,
    error: hasError,
    zones,
    zonesByColor,
    selectedZones,
    dataSource,
    useTlsGrowth
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">{label}</h3>
        {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}

        {/* Debug Info */}
        {hasError && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            Error: {error}
          </div>
        )}

        {isLoading && (
          <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg">
            Loading suburb data...
          </div>
        )}

        {/* Data Source Selection */}
        <div className="space-y-2 border p-4 rounded-md mb-4">
          <Label className="text-base font-medium">Data Source</Label>
          <RadioGroup
            value={dataSource}
            onValueChange={(value) => setDataSource(value as 'mock' | 'production')}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mock" id="mock" />
              <Label htmlFor="mock">Mock Data (10 suburbs)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="production" id="production" />
              <Label htmlFor="production">Production Data (12 suburbs)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Use TLS Growth Rates */}
        <div className="flex items-center space-x-2 border p-4 rounded-md mb-4">
          <Checkbox
            id="use-tls-growth"
            checked={useTlsGrowth}
            onCheckedChange={(checked) => setUseTlsGrowth(checked as boolean)}
          />
          <Label htmlFor="use-tls-growth">
            Use suburb-specific growth rates instead of zone-level rates
          </Label>
        </div>

        {/* Zone Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['green', 'orange', 'red'].map(color => (
            <Card key={color} className="border-2" style={{ borderColor: color }}>
              <CardHeader className="pb-2">
                <CardTitle className="capitalize">{color} Zone</CardTitle>
                <CardDescription>Select suburbs for this zone</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {zonesByColor[color]?.map(zone => (
                    <div key={zone.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`zone-${zone.id}`}
                        checked={selectedZones[color]?.includes(zone.id as string)}
                        onCheckedChange={(checked) => handleZoneSelection(color, zone.id as string, checked as boolean)}
                      />
                      <Label htmlFor={`zone-${zone.id}`} className="flex items-center justify-between w-full">
                        <span>{zone.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {(zone.growth_mu as number * 100).toFixed(1)}%
                        </Badge>
                      </Label>
                    </div>
                  ))}

                  {/* Show message if no suburbs in this zone */}
                  {(!zonesByColor[color] || zonesByColor[color].length === 0) && (
                    <div className="text-sm text-gray-500">No suburbs available in this zone</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
