import React, { useState, useEffect } from 'react';
import { WizardStep } from '@/components/wizard/wizard-step';
import { FormSection } from '@/components/wizard/form-section';
import { ParameterField } from '@/components/wizard/parameter-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useFormContext } from 'react-hook-form';

export function SydneyDataStep() {
  const { watch, setValue } = useFormContext();
  const [dataSource, setDataSource] = useState<'mock' | 'production'>('production');

  // Force set all suburbs to be checked when using the 100M preset
  React.useEffect(() => {
    const presetId = localStorage.getItem('activePreset');
    if (presetId === '100m') {
      console.log('Setting all suburbs to be checked for 100M preset');

      // Get all suburb IDs for each color
      const greenSuburbIds = productionSuburbs.green.map(suburb => suburb.id);
      const orangeSuburbIds = productionSuburbs.orange.map(suburb => suburb.id);
      const redSuburbIds = productionSuburbs.red.map(suburb => suburb.id);

      // Set the zone_profiles with all suburbs checked
      setValue('zone_profiles', {
        'Sydney-Green': { ids: greenSuburbIds, weight: 0.8 },
        'Sydney-Orange': { ids: orangeSuburbIds, weight: 0.2 },
        'Sydney-Red': { ids: redSuburbIds, weight: 0.0 }
      });
    }
  }, [setValue]);

  // Mock data for demonstration
  const mockSuburbs = {
    green: [
      { id: '2000', name: 'Sydney CBD', risk: 0.8 },
      { id: '2010', name: 'Surry Hills', risk: 0.85 },
      { id: '2011', name: 'Potts Point', risk: 0.82 },
    ],
    orange: [
      { id: '2170', name: 'Liverpool', risk: 0.6 },
      { id: '2200', name: 'Bankstown', risk: 0.65 },
      { id: '2204', name: 'Marrickville', risk: 0.68 },
    ],
    red: [
      { id: '2145', name: 'Westmead', risk: 0.4 },
      { id: '2150', name: 'Parramatta', risk: 0.45 },
      { id: '2160', name: 'Merrylands', risk: 0.42 },
    ],
  };

  const productionSuburbs = {
    green: [
      { id: '2000', name: 'Sydney CBD', risk: 0.8 },
      { id: '2010', name: 'Surry Hills', risk: 0.85 },
      { id: '2011', name: 'Potts Point', risk: 0.82 },
      { id: '2060', name: 'North Sydney', risk: 0.79 },
      { id: '2061', name: 'Kirribilli', risk: 0.81 },
    ],
    orange: [
      { id: '2170', name: 'Liverpool', risk: 0.6 },
      { id: '2200', name: 'Bankstown', risk: 0.65 },
      { id: '2204', name: 'Marrickville', risk: 0.68 },
      { id: '2208', name: 'Kingsgrove', risk: 0.63 },
      { id: '2213', name: 'East Hills', risk: 0.62 },
    ],
    red: [
      { id: '2145', name: 'Westmead', risk: 0.4 },
      { id: '2150', name: 'Parramatta', risk: 0.45 },
      { id: '2160', name: 'Merrylands', risk: 0.42 },
      { id: '2161', name: 'Guildford', risk: 0.38 },
      { id: '2166', name: 'Cabramatta', risk: 0.41 },
    ],
  };

  // Initialize all suburbs when the component mounts
  useEffect(() => {
    const currentProfiles = watch('zone_profiles') || {};

    // If we have zone profiles, make sure all suburbs are selected
    if (Object.keys(currentProfiles).length > 0) {
      // For each zone color
      ['green', 'orange', 'red'].forEach(color => {
        const zoneName = `Sydney-${color.charAt(0).toUpperCase() + color.slice(1)}`;
        const currentZone = currentProfiles[zoneName] || { ids: [], weight: color === 'green' ? 0.8 : color === 'orange' ? 0.2 : 0.0 };

        // Get all suburb IDs for this color
        const allSuburbIds = productionSuburbs[color as keyof typeof productionSuburbs].map(suburb => suburb.id);

        // Add any missing suburb IDs
        const missingIds = allSuburbIds.filter(id => !currentZone.ids.includes(id));
        if (missingIds.length > 0) {
          setValue(`zone_profiles.${zoneName}`, {
            ...currentZone,
            ids: [...currentZone.ids, ...missingIds]
          });
        }
      });
    }
  }, [watch, setValue]);

  const zonesByColor = dataSource === 'mock' ? mockSuburbs : productionSuburbs;

  // Handle suburb selection
  const handleSuburbSelection = (zoneColor: string, suburbId: string, checked: boolean) => {
    const currentProfiles = watch('zone_profiles') || {};
    const zoneName = `Sydney-${zoneColor.charAt(0).toUpperCase() + zoneColor.slice(1)}`;

    const currentZone = currentProfiles[zoneName] || { ids: [], weight: zoneColor === 'green' ? 0.5 : zoneColor === 'orange' ? 0.3 : 0.2 };

    let newIds;
    if (checked) {
      newIds = [...currentZone.ids, suburbId];
    } else {
      newIds = currentZone.ids.filter(id => id !== suburbId);
    }

    setValue(`zone_profiles.${zoneName}`, {
      ...currentZone,
      ids: newIds
    });
  };

  return (
    <WizardStep
      title="Sydney Suburb Data"
      description="Configure Sydney suburb data and zone profiles"
    >
      <FormSection
        title="Data Source Configuration"
        description="Configure the geographical allocation strategy"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="geo_strategy"
            label="Geographical Strategy"
            tooltip="Strategy for allocating suburbs to traffic-light zones"
            type="select"
            options={[
              { value: 'simple', label: 'Simple (Default Zones)' },
              { value: 'profile', label: 'Profile-Based (Grouped Suburbs)' },
              { value: 'explicit', label: 'Explicit (Manual Allocation)' },
            ]}
            defaultValue="profile"
          />
          <ParameterField
            name="use_tls_zone_growth"
            label="Use TLS Growth Data"
            tooltip="Use Traffic Light System data for zone growth rates"
            type="switch"
            defaultValue={true}
          />
        </div>
      </FormSection>

      <FormSection
        title="Sydney Suburb Selection"
        description="Select Sydney suburbs for each zone"
      >
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
              <Label htmlFor="mock">Mock Data (9 suburbs)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="production" id="production" />
              <Label htmlFor="production">Production Data (15 suburbs)</Label>
            </div>
          </RadioGroup>
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
                  {zonesByColor[color as keyof typeof zonesByColor]?.map(zone => (
                    <div key={zone.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${color}-${zone.id}`}
                        checked={
                          // Check if this suburb ID is in the current zone profile
                          // If the preset is loaded, all suburbs should be checked
                          (watch(`zone_profiles.Sydney-${color.charAt(0).toUpperCase() + color.slice(1)}.ids`) || [])
                            .includes(zone.id)
                        }
                        onCheckedChange={(checked) =>
                          handleSuburbSelection(color, zone.id, checked === true)
                        }
                      />
                      <Label htmlFor={`${color}-${zone.id}`} className="text-sm">
                        {zone.name} ({zone.id}) - Risk: {zone.risk}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Risk Weight Overrides"
        description="Override risk weights for specific suburbs"
        defaultExpanded={false}
      >
        <div className="grid grid-cols-1 gap-4">
          <ParameterField
            name="risk_weight_table"
            label="Risk Weight Table"
            tooltip="Override risk weights for specific suburbs"
            type="object"
            placeholder="Enter risk weight overrides..."
          />
        </div>
      </FormSection>
    </WizardStep>
  );
}
