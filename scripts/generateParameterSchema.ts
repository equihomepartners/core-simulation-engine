import fs from 'fs';
import path from 'path';

// Paths
const mdPath = path.resolve(__dirname, '../docs/frontend/PARAMETER_TRACKING.md');
const outPath = path.resolve(__dirname, '../src/frontend/src/schema/parameterSchema.ts');

// Read markdown
const md = fs.readFileSync(mdPath, 'utf8');
const lines = md.split('\n');

// Helper to map doc section titles to wizard steps
const mapSectionToStep = (section: string) => {
  if (section.includes('Market Condition')) return 'MarketConditions';
  if (section.includes('Default Correlation')) return 'AdvancedParameters';
  if (section.includes('Zone Balance')) return 'AdvancedParameters';
  if (section.includes('LTV Distribution')) return 'AdvancedParameters';
  if (section.includes('Waterfall Structure')) return 'BasicFundConfig';
  if (section.includes('Management Fee')) return 'BasicFundConfig';
  if (section.includes('Deployment Pace') || section.includes('Fund Term')) return 'BasicFundConfig';
  if (section.includes('Full Lifecycle')) return 'AdvancedParameters';
  if (section.includes('GP Economics')) return 'GPEconomics';
  // default
  return 'ReviewSubmit';
};

// Parse tables
let section = '';
const entries: any[] = [];
for (const line of lines) {
  const h3 = line.match(/^###\s+(.*)$/);
  if (h3) {
    section = h3[1].trim();
    continue;
  }
  // table row (ignore header/separator)
  if (line.startsWith('|') && !line.includes('---') && !line.includes('Parameter')) {
    const cols = line.split('|').slice(1, -1).map(c => c.trim());
    if (cols.length >= 4) {
      const [key, type, desc, def] = cols;
      entries.push({ key, type, desc, def, section });
    }
  }
}

// Build schema array
const schema = entries.map(e => {
  // determine field type
  let fieldType: any = 'string';
  let ui: any = 'TextInput';
  if (e.type.toLowerCase().includes('number')) { fieldType = 'number'; ui = 'NumberInput'; }
  if (e.type.toLowerCase().includes('boolean')) { fieldType = 'boolean'; ui = 'Checkbox'; }
  if (e.type.toLowerCase().includes('string') && e.desc.toLowerCase().includes('select')) { ui = 'Select'; }
  // parse default
  let defaultValue: any;
  try { defaultValue = JSON.parse(e.def); } catch { defaultValue = e.def; }

  return {
    key: e.key,
    label: e.desc,
    type: fieldType,
    uiComponent: ui,
    defaultValue,
    options: ui === 'Select' ? [] : undefined,
    step: mapSectionToStep(e.section),
    section: e.section,
  };
});

// Write TS file
const out = `export interface ParameterSchemaEntry {
  key: string;
  label: string;
  type: 'number' | 'string' | 'boolean';
  uiComponent: string;
  defaultValue: any;
  options?: { value: string; label: string }[];
  step: string;
  section: string;
}

export const parameterSchema: ParameterSchemaEntry[] = ${JSON.stringify(schema, null, 2)};
`;

fs.writeFileSync(outPath, out, 'utf8');
console.log('Generated parameterSchema.ts with', schema.length, 'entries'); 