import fs from 'fs/promises';
import path from 'path';

export class DataLoader {
  constructor() {
    this.dataDir = process.env.DATA_CACHE_DIR || './data';
    this.lastUpdateFile = path.join(this.dataDir, '.last_update');
    this.datasets = {
      'immunizations_nis': 'immunizations_nis.json',
      'immunizations_epic': 'immunizations_epic.json',
      'respiratory_ed': 'respiratory_ed.json',
      'respiratory_lab': 'respiratory_lab.json',
      'respiratory_wastewater': 'respiratory_wastewater.json',
      'respiratory_trends': 'respiratory_trends.json',
      'chronic_obesity': 'chronic_obesity.json',
      'chronic_diabetes': 'chronic_diabetes.json'
    };
  }

  async ensureDataDir() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  async shouldUpdateData(frequency = 'daily') {
    try {
      const lastUpdateData = await fs.readFile(this.lastUpdateFile, 'utf8');
      const lastUpdate = new Date(lastUpdateData.trim());
      const now = new Date();
      
      const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
      
      switch (frequency) {
        case 'hourly':
          return hoursSinceUpdate >= 1;
        case 'daily':
          return hoursSinceUpdate >= 24;
        case 'weekly':
          return hoursSinceUpdate >= 168; // 24 * 7
        default:
          return hoursSinceUpdate >= 24;
      }
    } catch {
      // If no last update file exists, we should update
      return true;
    }
  }

  async markDataUpdated() {
    await this.ensureDataDir();
    await fs.writeFile(this.lastUpdateFile, new Date().toISOString());
  }

  async loadDataset(datasetName) {
    const filename = this.datasets[datasetName];
    if (!filename) {
      throw new Error(`Unknown dataset: ${datasetName}`);
    }

    const filepath = path.join(this.dataDir, filename);
    
    try {
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Return sample data if file doesn't exist
        return this.getSampleData(datasetName);
      }
      throw new Error(`Error loading dataset ${datasetName}: ${error.message}`);
    }
  }

  async saveDataset(datasetName, data) {
    const filename = this.datasets[datasetName];
    if (!filename) {
      throw new Error(`Unknown dataset: ${datasetName}`);
    }

    await this.ensureDataDir();
    const filepath = path.join(this.dataDir, filename);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }

  getSampleData(datasetName) {
    // Return sample data for each dataset type
    const samples = {
      'immunizations_nis': [
        {
          geography: "US",
          year: 2024,
          vaccine: "DTaP",
          age_group: "19-35 months",
          coverage_rate: 94.2,
          sample_size: 15234,
          source: "CDC NIS"
        },
        {
          geography: "CA",
          year: 2024,
          vaccine: "MMR",
          age_group: "19-35 months",
          coverage_rate: 96.1,
          sample_size: 1876,
          source: "CDC NIS"
        },
        {
          geography: "TX",
          year: 2024,
          vaccine: "Polio",
          age_group: "19-35 months",
          coverage_rate: 93.8,
          sample_size: 2134,
          source: "CDC NIS"
        }
      ],
      'immunizations_epic': [
        {
          geography: "US",
          year: 2024,
          vaccine: "COVID-19",
          insurance_type: "Private",
          urbanicity: "Urban",
          coverage_rate: 87.3,
          patient_count: 45678,
          source: "Epic Cosmos"
        },
        {
          geography: "CA",
          year: 2024,
          vaccine: "Influenza",
          insurance_type: "Medicaid",
          urbanicity: "Rural",
          coverage_rate: 72.1,
          patient_count: 8934,
          source: "Epic Cosmos"
        }
      ],
      'respiratory_ed': [
        {
          geography: "US",
          date: "2024-12-01",
          week: "2024-48",
          virus: "RSV",
          ed_visits: 12456,
          ed_visits_per_100k: 3.8,
          percent_change: 15.2,
          source: "Epic Cosmos"
        },
        {
          geography: "CA",
          date: "2024-12-01",
          week: "2024-48",
          virus: "COVID-19",
          ed_visits: 8934,
          ed_visits_per_100k: 22.7,
          percent_change: -8.3,
          source: "Epic Cosmos"
        },
        {
          geography: "NY",
          date: "2024-12-01",
          week: "2024-48",
          virus: "Influenza",
          ed_visits: 5678,
          ed_visits_per_100k: 29.1,
          percent_change: 23.7,
          source: "CDC NSSP"
        }
      ],
      'respiratory_lab': [
        {
          geography: "US",
          date: "2024-12-01",
          week: "2024-48",
          virus: "RSV",
          tests_positive: 1234,
          total_tests: 8765,
          positivity_rate: 14.1,
          source: "CDC NREVSS"
        },
        {
          geography: "US",
          date: "2024-12-01",
          week: "2024-48",
          virus: "Influenza A",
          tests_positive: 2345,
          total_tests: 9876,
          positivity_rate: 23.7,
          source: "CDC NREVSS"
        }
      ],
      'respiratory_wastewater': [
        {
          geography: "Region 1",
          date: "2024-12-01",
          week: "2024-48",
          virus: "SARS-CoV-2",
          viral_level: "High",
          copies_per_ml: 125000,
          percent_change: 18.5,
          source: "CDC NWWS"
        },
        {
          geography: "Region 5",
          date: "2024-12-01",
          week: "2024-48",
          virus: "RSV",
          viral_level: "Moderate",
          copies_per_ml: 45000,
          percent_change: -12.3,
          source: "CDC NWWS"
        }
      ],
      'respiratory_trends': [
        {
          geography: "US",
          date: "2024-12-01",
          week: "2024-48",
          search_term: "flu symptoms",
          relative_search_volume: 78,
          percent_change: 25.4,
          source: "Google Trends"
        },
        {
          geography: "CA",
          date: "2024-12-01",
          week: "2024-48",
          search_term: "RSV symptoms",
          relative_search_volume: 45,
          percent_change: 12.8,
          source: "Google Trends"
        }
      ],
      'chronic_obesity': [
        {
          geography: "US",
          year: 2024,
          age_group: "18-64",
          condition: "Obesity (BMI ≥30)",
          prevalence_rate: 36.2,
          patient_count: 125678,
          source: "Epic Cosmos"
        },
        {
          geography: "CA",
          year: 2024,
          age_group: "65+",
          condition: "Obesity (BMI ≥30)",
          prevalence_rate: 32.8,
          patient_count: 23456,
          source: "Epic Cosmos"
        },
        {
          geography: "TX",
          year: 2024,
          age_group: "18-64",
          condition: "Obesity (BMI ≥30)",
          prevalence_rate: 39.1,
          patient_count: 45678,
          source: "Epic Cosmos"
        }
      ],
      'chronic_diabetes': [
        {
          geography: "US",
          year: 2024,
          age_group: "18-64",
          condition: "Diabetes (HbA1c ≥7%)",
          prevalence_rate: 11.3,
          patient_count: 67890,
          source: "Epic Cosmos"
        },
        {
          geography: "FL",
          year: 2024,
          age_group: "65+",
          condition: "Diabetes (HbA1c ≥7%)",
          prevalence_rate: 26.7,
          patient_count: 34567,
          source: "Epic Cosmos"
        }
      ]
    };

    return samples[datasetName] || [];
  }

  async getDatasetMetadata(datasetName) {
    // Get actual data to compute real metadata
    let actualData = [];
    try {
      actualData = await this.loadDataset(datasetName);
    } catch (error) {
      console.warn(`Could not load data for metadata computation: ${error.message}`);
    }

    // Compute actual date range and geographies
    const computeActualMetadata = (data) => {
      const dates = data.map(row => row.date || row.year).filter(Boolean);
      const geographies = [...new Set(data.map(row => row.geography || row.state).filter(Boolean))];
      
      let dateRange = { min: null, max: null };
      if (dates.length > 0) {
        const sortedDates = dates.sort();
        dateRange = { min: sortedDates[0], max: sortedDates[sortedDates.length - 1] };
      }

      return { dateRange, geographies };
    };

    const { dateRange, geographies } = computeActualMetadata(actualData);

    const metadata = {
      'immunizations_nis': {
        name: 'CDC National Immunization Survey',
        description: 'Household survey data on childhood vaccination coverage rates by state and vaccine type',
        source: 'CDC National Immunization Survey (NIS)',
        update_frequency: 'Annual',
        geographic_level: 'State',
        geographic_granularity: ['national', 'state'],
        supported_geographies: geographies.length > 0 ? geographies : ['US', 'CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC'],
        time_range: '2019-2024',
        date_range_actual: dateRange,
        key_metrics: ['coverage_rate', 'sample_size'],
        supported_filters: ['state', 'geography', 'vaccine', 'age_group', 'year'],
        demographics: ['age_group'],
        data_quality: 'High - Gold standard for vaccination coverage',
        sample_record: actualData.length > 0 ? actualData[0] : null
      },
      'immunizations_epic': {
        name: 'Epic Cosmos Immunization Data',
        description: 'Electronic health record data on immunizations by insurance status and urbanicity',
        source: 'Epic Cosmos EHR Network',
        update_frequency: 'Monthly',
        geographic_level: 'State',
        geographic_granularity: ['national', 'state'],
        supported_geographies: geographies.length > 0 ? geographies : ['US', 'CA', 'TX', 'FL', 'NY'],
        time_range: '2020-2024',
        date_range_actual: dateRange,
        key_metrics: ['coverage_rate', 'patient_count'],
        supported_filters: ['state', 'geography', 'vaccine', 'insurance_type', 'urbanicity', 'year'],
        demographics: ['insurance_type', 'urbanicity'],
        data_quality: 'High - Large EHR network, real-world data',
        sample_record: actualData.length > 0 ? actualData[0] : null
      },
      'respiratory_ed': {
        name: 'Emergency Department Visits',
        description: 'ED visits for respiratory viruses including RSV, COVID-19, and Influenza',
        source: 'Epic Cosmos, CDC NSSP',
        update_frequency: 'Weekly',
        geographic_level: 'State/County',
        geographic_granularity: ['national', 'state'],
        supported_geographies: geographies.length > 0 ? geographies : ['US', 'CA', 'TX', 'FL', 'NY'],
        time_range: '2020-2024',
        date_range_actual: dateRange,
        key_metrics: ['ed_visits', 'ed_visits_per_100k', 'percent_change'],
        supported_filters: ['state', 'geography', 'virus', 'date', 'week', 'age_group'],
        demographics: ['age_group'],
        data_quality: 'High - Near real-time surveillance',
        sample_record: actualData.length > 0 ? actualData[0] : null
      },
      'respiratory_lab': {
        name: 'Laboratory Test Positivity',
        description: 'Laboratory test positivity rates for respiratory viruses',
        source: 'CDC National Respiratory and Enteric Virus Surveillance System (NREVSS)',
        update_frequency: 'Weekly',
        geographic_level: 'National/Regional',
        geographic_granularity: ['national'],
        supported_geographies: geographies.length > 0 ? geographies : ['US'],
        time_range: '2020-2024',
        date_range_actual: dateRange,
        key_metrics: ['positivity_rate', 'tests_positive', 'total_tests'],
        supported_filters: ['geography', 'virus', 'date', 'week'],
        demographics: [],
        data_quality: 'High - Clinical laboratory data',
        sample_record: actualData.length > 0 ? actualData[0] : null
      },
      'respiratory_wastewater': {
        name: 'Wastewater Surveillance',
        description: 'Viral levels detected in wastewater systems',
        source: 'CDC National Wastewater Surveillance System (NWWS)',
        update_frequency: 'Weekly',
        geographic_level: 'Regional/Local',
        geographic_granularity: ['regional'],
        supported_geographies: geographies.length > 0 ? geographies : ['Region 1', 'Region 2', 'Region 3', 'Region 4', 'Region 5'],
        time_range: '2020-2024',
        date_range_actual: dateRange,
        key_metrics: ['viral_level', 'copies_per_ml', 'percent_change'],
        supported_filters: ['geography', 'virus', 'date', 'week'],
        demographics: [],
        data_quality: 'Moderate - Environmental surveillance, early indicator',
        sample_record: actualData.length > 0 ? actualData[0] : null
      },
      'respiratory_trends': {
        name: 'Google Health Trends',
        description: 'Search trends for respiratory symptoms and conditions',
        source: 'Google Health Trends',
        update_frequency: 'Weekly',
        geographic_level: 'State/National',
        geographic_granularity: ['national', 'state'],
        supported_geographies: geographies.length > 0 ? geographies : ['US', 'CA', 'TX', 'FL', 'NY'],
        time_range: '2020-2024',
        date_range_actual: dateRange,
        key_metrics: ['relative_search_volume', 'percent_change'],
        supported_filters: ['state', 'geography', 'search_term', 'date', 'week'],
        demographics: [],
        data_quality: 'Moderate - Behavioral indicator, early signal',
        sample_record: actualData.length > 0 ? actualData[0] : null
      },
      'chronic_obesity': {
        name: 'Obesity Prevalence',
        description: 'Prevalence of obesity (BMI ≥30) by state and age group',
        source: 'Epic Cosmos EHR Network',
        update_frequency: 'Quarterly',
        geographic_level: 'State',
        geographic_granularity: ['national', 'state'],
        supported_geographies: geographies.length > 0 ? geographies : ['US', 'CA', 'TX', 'FL', 'NY'],
        time_range: '2020-2024',
        date_range_actual: dateRange,
        key_metrics: ['prevalence_rate', 'patient_count'],
        supported_filters: ['state', 'geography', 'age_group', 'condition', 'year'],
        demographics: ['age_group'],
        data_quality: 'High - Clinical measurements from EHR',
        sample_record: actualData.length > 0 ? actualData[0] : null
      },
      'chronic_diabetes': {
        name: 'Diabetes Prevalence',
        description: 'Prevalence of diabetes (HbA1c ≥7%) by state and age group',
        source: 'Epic Cosmos EHR Network',
        update_frequency: 'Quarterly',
        geographic_level: 'State',
        geographic_granularity: ['national', 'state'],
        supported_geographies: geographies.length > 0 ? geographies : ['US', 'CA', 'TX', 'FL', 'NY'],
        time_range: '2020-2024',
        date_range_actual: dateRange,
        key_metrics: ['prevalence_rate', 'patient_count'],
        supported_filters: ['state', 'geography', 'age_group', 'condition', 'year'],
        demographics: ['age_group'],
        data_quality: 'High - Clinical lab values from EHR',
        sample_record: actualData.length > 0 ? actualData[0] : null
      }
    };

    return metadata[datasetName] || null;
  }

  async getAllDatasets() {
    const datasets = {};
    
    for (const [name, filename] of Object.entries(this.datasets)) {
      try {
        datasets[name] = {
          data: await this.loadDataset(name),
          metadata: await this.getDatasetMetadata(name)
        };
      } catch (error) {
        console.error(`Error loading dataset ${name}:`, error.message);
        datasets[name] = {
          data: [],
          metadata: await this.getDatasetMetadata(name),
          error: error.message
        };
      }
    }
    
    return datasets;
  }

  normalizeStateName(state) {
    // Handle both state codes and full names
    const stateMappings = {
      'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
      'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
      'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
      'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
      'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
      'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
      'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
      'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
      'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
      'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
      'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
      'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
      'wisconsin': 'WI', 'wyoming': 'WY'
    };

    const normalized = state.toLowerCase().trim();
    return stateMappings[normalized] || state.toUpperCase();
  }
}
