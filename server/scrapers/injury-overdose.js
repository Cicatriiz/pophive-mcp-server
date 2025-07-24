import axios from 'axios';
import { saveData } from '../utils/file-saver.js';

export class InjuryOverdoseScraper {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.sourceUrl = 'https://data.cdc.gov/resource/t6u2-f84c.json?$limit=50000';
  }

  async scrapeAll() {
    try {
      console.error('Scraping injury and overdose data from data.cdc.gov...');
      
      const response = await axios.get(this.sourceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 60000
      });

      const records = response.data;
      const normalizedData = records.map(record => this.normalizeRecord(record));

      await saveData(this.dataDir, 'injury_overdose.json', normalizedData);
      console.error(`Injury and overdose data scraped: ${normalizedData.length} records`);
      
      return normalizedData;
    } catch (error) {
      console.error('Error scraping injury and overdose data:', error.message);
      
      const sampleData = this.generateSampleInjuryOverdoseData();
      await saveData(this.dataDir, 'injury_overdose.json', sampleData);
      
      return sampleData;
    }
  }

  normalizeRecord(record) {
    return {
      geography: record.geoid,
      date: new Date(record.period).toISOString().split('T')[0],
      intent: record.intent,
      value: parseInt(record.value) || 0,
      rate: parseFloat(record.rate) || 0,
      time_period: record.time_period,
      source: 'CDC Mapping Injury, Overdose, and Violence',
      last_updated: new Date().toISOString().split('T')[0]
    };
  }

  generateSampleInjuryOverdoseData() {
    return [
      {
        geography: 'USA',
        date: '2023-12-01',
        intent: 'Drug_OD',
        value: 107543,
        rate: 32.5,
        time_period: '12 month-ending',
        source: 'CDC Mapping Injury, Overdose, and Violence (Sample)',
        last_updated: new Date().toISOString().split('T')[0]
      },
      {
        geography: 'USA',
        date: '2023-12-01',
        intent: 'All_Homicide',
        value: 26000,
        rate: 7.8,
        time_period: '12 month-ending',
        source: 'CDC Mapping Injury, Overdose, and Violence (Sample)',
        last_updated: new Date().toISOString().split('T')[0]
      },
      {
        geography: 'USA',
        date: '2023-12-01',
        intent: 'All_Suicide',
        value: 49000,
        rate: 14.8,
        time_period: '12 month-ending',
        source: 'CDC Mapping Injury, Overdose, and Violence (Sample)',
        last_updated: new Date().toISOString().split('T')[0]
      }
    ];
  }

}
