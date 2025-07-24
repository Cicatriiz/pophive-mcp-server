import axios from 'axios';
import { saveData } from '../utils/file-saver.js';
import path from 'path';
import fs from 'fs/promises';

export class HospitalCapacityScraper {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.sourceUrl = 'https://healthdata.gov/resource/g62h-syeh.json';
    this.states = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];
  }

  async scrapeAll() {
    try {
      const existingData = await this.loadExistingData();
      
      if (existingData.length === 0) {
        console.error('Performing initial parallel fetch for hospital capacity data...');
        return await this.initialFetch();
      } else {
        console.error('Performing incremental fetch for hospital capacity data...');
        return await this.incrementalFetch(existingData);
      }
    } catch (error) {
      console.error('Error scraping hospital capacity data:', error.message);
      const sampleData = this.generateSampleHospitalCapacityData();
      await saveData(this.dataDir, 'hospital_capacity.json', sampleData);
      return sampleData;
    }
  }

  async initialFetch() {
    let allRecords = [];
    const batchSize = 10;

    for (let i = 0; i < this.states.length; i += batchSize) {
      const batch = this.states.slice(i, i + batchSize);
      console.error(`Fetching batch of ${batch.length} states...`);
      
      const promises = batch.map(state => {
        const url = `${this.sourceUrl}?state=${state}&$limit=50000`;
        return axios.get(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 60000
        });
      });

      const responses = await Promise.all(promises);
      const batchRecords = responses.flatMap(response => response.data);
      allRecords = allRecords.concat(batchRecords);
    }

    // Fetch records where state is not in the list of states (e.g., territories)
    console.error('Fetching non-state records...');
    const nonStateUrl = `${this.sourceUrl}?$where=state NOT IN (${this.states.map(s => `'${s}'`).join(',')})&$limit=50000`;
    const nonStateResponse = await axios.get(nonStateUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 60000
    });
    allRecords = allRecords.concat(nonStateResponse.data);

    const normalizedData = allRecords.map(record => this.normalizeRecord(record));

    await saveData(this.dataDir, 'hospital_capacity.json', normalizedData);
    console.error(`Initial hospital capacity data scraped: ${normalizedData.length} records`);
    return normalizedData;
  }

  async incrementalFetch(existingData) {
    const latestDate = existingData.reduce((max, row) => (row.date > max ? row.date : max), '1970-01-01');
    console.error(`Fetching new records since ${latestDate}...`);

    const url = `${this.sourceUrl}?$where=date>'${latestDate}'&$limit=500000`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 60000
    });

    const newRecords = response.data.map(record => this.normalizeRecord(record));
    
    if (newRecords.length > 0) {
      const combinedData = this.mergeData(existingData, newRecords);
      await saveData(this.dataDir, 'hospital_capacity.json', combinedData);
      console.error(`Incremental hospital capacity data scraped: ${newRecords.length} new records`);
      return combinedData;
    } else {
      console.error('No new hospital capacity data found.');
      return existingData;
    }
  }

  mergeData(existingData, newData) {
    const existingDataMap = new Map(existingData.map(row => [`${row.date}-${row.geography}`, row]));
    newData.forEach(row => {
      existingDataMap.set(`${row.date}-${row.geography}`, row);
    });
    return Array.from(existingDataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async loadExistingData() {
    try {
      const filepath = path.join(this.dataDir, 'hospital_capacity.json');
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  normalizeRecord(record) {
    const inpatient_beds = parseInt(record.inpatient_beds) || 0;
    const inpatient_beds_used = parseInt(record.inpatient_beds_used) || 0;
    
    return {
      geography: record.state,
      date: new Date(record.date).toISOString().split('T')[0],
      inpatient_beds: inpatient_beds,
      inpatient_beds_used: inpatient_beds_used,
      inpatient_beds_used_covid: parseInt(record.inpatient_beds_used_covid) || 0,
      bed_utilization: inpatient_beds > 0 ? inpatient_beds_used / inpatient_beds : 0,
      icu_utilization: parseFloat(record.adult_icu_bed_utilization) || 0,
      covid_icu_utilization: parseFloat(record.adult_icu_bed_covid_utilization) || 0,
      deaths_covid: parseInt(record.deaths_covid) || 0,
      critical_staffing_shortage_today_yes: parseInt(record.critical_staffing_shortage_today_yes) || 0,
      source: 'HHS Hospital Capacity',
      last_updated: new Date().toISOString().split('T')[0]
    };
  }

  generateSampleHospitalCapacityData() {
    return [
      {
        geography: 'US',
        date: '2023-10-01',
        inpatient_beds: 850000,
        inpatient_beds_used: 650000,
        inpatient_beds_used_covid: 25000,
        bed_utilization: 0.76,
        icu_utilization: 0.68,
        covid_icu_utilization: 0.12,
        deaths_covid: 350,
        critical_staffing_shortage_today_yes: 5,
        source: 'HHS Hospital Capacity (Sample)',
        last_updated: new Date().toISOString().split('T')[0]
      }
    ];
  }
}
