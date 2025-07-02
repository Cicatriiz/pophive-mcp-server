import { format, parseISO, isAfter, isBefore } from 'date-fns';

export class AnalysisTools {
  constructor(dataLoader) {
    this.dataLoader = dataLoader;
  }

  async filterData(args) {
    const { dataset, state, start_date, end_date, age_group, condition } = args;
    
    try {
      let data = await this.dataLoader.loadDataset(dataset);
      let filtered = [...data];
      const filters = [];

      // Apply state filter
      if (state) {
        const normalizedState = this.dataLoader.normalizeStateName(state);
        filtered = filtered.filter(row => {
          const rowState = this.dataLoader.normalizeStateName(row.geography || row.state || '');
          return rowState === normalizedState || row.geography === state;
        });
        filters.push(`State: ${state}`);
      }

      // Apply date range filter
      if (start_date || end_date) {
        filtered = filtered.filter(row => {
          const rowDate = row.date || row.year;
          if (!rowDate) return true;
          
          const date = typeof rowDate === 'string' ? parseISO(rowDate) : new Date(rowDate, 0, 1);
          
          if (start_date && isBefore(date, parseISO(start_date))) return false;
          if (end_date && isAfter(date, parseISO(end_date))) return false;
          return true;
        });
        
        if (start_date) filters.push(`Start Date: ${start_date}`);
        if (end_date) filters.push(`End Date: ${end_date}`);
      }

      // Apply age group filter
      if (age_group) {
        filtered = filtered.filter(row => 
          row.age_group && row.age_group.toLowerCase().includes(age_group.toLowerCase())
        );
        filters.push(`Age Group: ${age_group}`);
      }

      // Apply condition filter
      if (condition) {
        filtered = filtered.filter(row => 
          (row.condition && row.condition.toLowerCase().includes(condition.toLowerCase())) ||
          (row.vaccine && row.vaccine.toLowerCase().includes(condition.toLowerCase())) ||
          (row.virus && row.virus.toLowerCase().includes(condition.toLowerCase()))
        );
        filters.push(`Condition/Metric: ${condition}`);
      }

      const metadata = await this.dataLoader.getDatasetMetadata(dataset);
      
      return {
        content: [
          {
            type: 'text',
            text: this.formatFilterResults(dataset, filtered, filters, metadata)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Error filtering data: ${error.message}`);
    }
  }

  async compareStates(args) {
    const { dataset, states, metric, time_period } = args;
    
    try {
      const data = await this.dataLoader.loadDataset(dataset);
      const comparison = {};
      const normalizedStates = states.map(s => this.dataLoader.normalizeStateName(s));

      // Filter by time period if specified
      let filteredData = data;
      if (time_period) {
        filteredData = this.filterByTimePeriod(data, time_period);
      }

      // Calculate statistics for each state
      normalizedStates.forEach(state => {
        const stateData = filteredData.filter(row => {
          const rowState = this.dataLoader.normalizeStateName(row.geography || row.state || '');
          return rowState === state;
        });

        if (stateData.length === 0) {
          comparison[state] = { error: 'No data found for this state' };
          return;
        }

        // Extract metric values
        const values = stateData
          .map(row => this.extractMetricValue(row, metric))
          .filter(v => v !== null && !isNaN(v));

        if (values.length === 0) {
          comparison[state] = { error: `No valid values found for metric: ${metric}` };
          return;
        }

        comparison[state] = {
          count: values.length,
          latest: values[values.length - 1],
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          trend: this.calculateTrend(stateData, metric)
        };
      });

      const metadata = await this.dataLoader.getDatasetMetadata(dataset);

      return {
        content: [
          {
            type: 'text',
            text: this.formatStateComparison(dataset, comparison, metric, time_period, metadata)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Error comparing states: ${error.message}`);
    }
  }

  async timeSeriesAnalysis(args) {
    const { dataset, metric, geography, start_date, end_date, aggregation = 'monthly' } = args;
    
    try {
      let data = await this.dataLoader.loadDataset(dataset);
      
      // Filter by geography if specified
      if (geography && geography.toLowerCase() !== 'national') {
        const normalizedGeo = this.dataLoader.normalizeStateName(geography);
        data = data.filter(row => {
          const rowGeo = this.dataLoader.normalizeStateName(row.geography || row.state || '');
          return rowGeo === normalizedGeo;
        });
      }

      // Filter by date range
      if (start_date || end_date) {
        data = data.filter(row => {
          const rowDate = row.date || row.year;
          if (!rowDate) return true;
          
          const date = typeof rowDate === 'string' ? parseISO(rowDate) : new Date(rowDate, 0, 1);
          
          if (start_date && isBefore(date, parseISO(start_date))) return false;
          if (end_date && isAfter(date, parseISO(end_date))) return false;
          return true;
        });
      }

      // Extract time series data
      const timeSeries = this.extractTimeSeries(data, metric, aggregation);
      const trends = this.analyzeTrends(timeSeries);
      const metadata = await this.dataLoader.getDatasetMetadata(dataset);

      return {
        content: [
          {
            type: 'text',
            text: this.formatTimeSeriesAnalysis(dataset, metric, geography, timeSeries, trends, metadata)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Error in time series analysis: ${error.message}`);
    }
  }

  async getAvailableDatasets(args) {
    const { include_sample = false } = args;
    
    try {
      const datasets = await this.dataLoader.getAllDatasets();
      
      return {
        content: [
          {
            type: 'text',
            text: this.formatDatasetCatalog(datasets, include_sample)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Error getting datasets: ${error.message}`);
    }
  }

  async searchHealthData(args) {
    const { query, datasets, geography } = args;
    
    try {
      const searchResults = [];
      const searchTerms = query.toLowerCase().split(' ');
      
      // Determine which datasets to search
      const datasetsToSearch = datasets && datasets.length > 0 
        ? datasets 
        : Object.keys(this.dataLoader.datasets);

      for (const datasetName of datasetsToSearch) {
        try {
          let data = await this.dataLoader.loadDataset(datasetName);
          
          // Filter by geography if specified
          if (geography) {
            const normalizedGeo = this.dataLoader.normalizeStateName(geography);
            data = data.filter(row => {
              const rowGeo = this.dataLoader.normalizeStateName(row.geography || row.state || '');
              return rowGeo === normalizedGeo;
            });
          }

          // Search through data
          const matches = data.filter(row => {
            const searchableText = Object.values(row)
              .join(' ')
              .toLowerCase();
            
            return searchTerms.some(term => searchableText.includes(term));
          });

          if (matches.length > 0) {
            searchResults.push({
              dataset: datasetName,
              matches: matches.slice(0, 10), // Limit to 10 matches per dataset
              total_matches: matches.length
            });
          }
        } catch (error) {
          console.error(`Error searching dataset ${datasetName}:`, error.message);
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: this.formatSearchResults(query, searchResults, geography)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Error searching health data: ${error.message}`);
    }
  }

  // Helper methods for data processing and formatting

  extractMetricValue(row, metric) {
    // Try different possible field names for the metric
    const possibleFields = [
      metric,
      metric.toLowerCase(),
      metric.replace(/_/g, ''),
      'coverage_rate',
      'prevalence_rate',
      'positivity_rate',
      'ed_visits',
      'ed_visits_per_100k',
      'relative_search_volume',
      'viral_level',
      'copies_per_ml'
    ];

    for (const field of possibleFields) {
      if (row[field] !== undefined && row[field] !== null) {
        const value = parseFloat(row[field]);
        return isNaN(value) ? null : value;
      }
    }
    return null;
  }

  calculateTrend(data, metric) {
    if (data.length < 2) return 'insufficient_data';
    
    const sortedData = data.sort((a, b) => {
      const dateA = new Date(a.date || a.year || 0);
      const dateB = new Date(b.date || b.year || 0);
      return dateA - dateB;
    });

    const values = sortedData
      .map(row => this.extractMetricValue(row, metric))
      .filter(v => v !== null);

    if (values.length < 2) return 'insufficient_data';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  filterByTimePeriod(data, timePeriod) {
    const now = new Date();
    
    switch (timePeriod.toLowerCase()) {
      case 'latest':
        // Return most recent data
        return data.filter(row => {
          const rowDate = new Date(row.date || row.year || 0);
          const cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          return rowDate >= cutoff;
        });
      
      case 'last_6_months':
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        return data.filter(row => {
          const rowDate = new Date(row.date || row.year || 0);
          return rowDate >= sixMonthsAgo;
        });
      
      case '2024':
        return data.filter(row => {
          const year = row.year || new Date(row.date || 0).getFullYear();
          return year === 2024;
        });
      
      default:
        return data;
    }
  }

  extractTimeSeries(data, metric, aggregation) {
    const timePoints = {};
    
    data.forEach(row => {
      const value = this.extractMetricValue(row, metric);
      if (value === null) return;
      
      let timeKey;
      if (row.date) {
        const date = parseISO(row.date);
        switch (aggregation) {
          case 'weekly':
            timeKey = format(date, 'yyyy-ww');
            break;
          case 'monthly':
            timeKey = format(date, 'yyyy-MM');
            break;
          case 'quarterly':
            timeKey = `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
            break;
          case 'yearly':
            timeKey = format(date, 'yyyy');
            break;
          default:
            timeKey = format(date, 'yyyy-MM');
        }
      } else if (row.year) {
        timeKey = row.year.toString();
      } else {
        return;
      }
      
      if (!timePoints[timeKey]) {
        timePoints[timeKey] = [];
      }
      timePoints[timeKey].push(value);
    });

    // Calculate averages for each time point
    const timeSeries = Object.entries(timePoints)
      .map(([time, values]) => ({
        time,
        value: values.reduce((a, b) => a + b, 0) / values.length,
        count: values.length
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    return timeSeries;
  }

  analyzeTrends(timeSeries) {
    if (timeSeries.length < 2) {
      return { trend: 'insufficient_data', change: 0 };
    }

    const values = timeSeries.map(point => point.value);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    
    const overallChange = ((lastValue - firstValue) / firstValue) * 100;
    
    // Calculate moving average trend
    const windowSize = Math.min(3, Math.floor(values.length / 2));
    let increasingPeriods = 0;
    let decreasingPeriods = 0;
    
    for (let i = windowSize; i < values.length; i++) {
      const currentAvg = values.slice(i - windowSize, i).reduce((a, b) => a + b, 0) / windowSize;
      const previousAvg = values.slice(i - windowSize - 1, i - 1).reduce((a, b) => a + b, 0) / windowSize;
      
      if (currentAvg > previousAvg) increasingPeriods++;
      else if (currentAvg < previousAvg) decreasingPeriods++;
    }

    let trend;
    if (Math.abs(overallChange) < 5) {
      trend = 'stable';
    } else if (increasingPeriods > decreasingPeriods) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return {
      trend,
      overall_change: overallChange,
      recent_direction: increasingPeriods > decreasingPeriods ? 'up' : 'down',
      volatility: this.calculateVolatility(values)
    };
  }

  calculateVolatility(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    return (standardDeviation / mean) * 100; // Coefficient of variation as percentage
  }

  // Formatting methods

  formatFilterResults(dataset, filtered, filters, metadata) {
    const summary = `## Filtered ${metadata?.name || dataset} Data

**Applied Filters:** ${filters.length > 0 ? filters.join(', ') : 'None'}
**Results:** ${filtered.length} records found

**Dataset Info:**
- Source: ${metadata?.source || 'Unknown'}
- Update Frequency: ${metadata?.update_frequency || 'Unknown'}
- Geographic Level: ${metadata?.geographic_level || 'Unknown'}

**Sample Results:**`;

    const sampleData = filtered.slice(0, 10).map(row => {
      const cleanRow = Object.fromEntries(
        Object.entries(row).filter(([key, value]) => value !== null && value !== undefined)
      );
      return JSON.stringify(cleanRow, null, 2);
    }).join('\n\n');

    const footer = filtered.length > 10 ? `\n\n*Showing first 10 of ${filtered.length} total records*` : '';

    return `${summary}\n\n\`\`\`json\n${sampleData}\n\`\`\`${footer}`;
  }

  formatStateComparison(dataset, comparison, metric, timePeriod, metadata) {
    const header = `## State Comparison: ${metric} in ${metadata?.name || dataset}

**Time Period:** ${timePeriod || 'All available data'}
**Metric:** ${metric}
**Source:** ${metadata?.source || 'Unknown'}

**Comparison Results:**`;

    const results = Object.entries(comparison).map(([state, stats]) => {
      if (stats.error) {
        return `**${state}:** ${stats.error}`;
      }
      
      return `**${state}:**
- Latest Value: ${stats.latest?.toFixed(2) || 'N/A'}
- Average: ${stats.average?.toFixed(2) || 'N/A'}
- Range: ${stats.min?.toFixed(2) || 'N/A'} - ${stats.max?.toFixed(2) || 'N/A'}
- Trend: ${stats.trend || 'Unknown'}
- Data Points: ${stats.count || 0}`;
    }).join('\n\n');

    // Add ranking
    const validStates = Object.entries(comparison)
      .filter(([_, stats]) => !stats.error && stats.latest !== undefined)
      .sort(([_, a], [__, b]) => (b.latest || 0) - (a.latest || 0));

    const ranking = validStates.length > 0 ? `

**Ranking by Latest Value:**
${validStates.map(([state, stats], index) => 
  `${index + 1}. ${state}: ${stats.latest?.toFixed(2) || 'N/A'}`
).join('\n')}` : '';

    return `${header}\n\n${results}${ranking}`;
  }

  formatTimeSeriesAnalysis(dataset, metric, geography, timeSeries, trends, metadata) {
    const header = `## Time Series Analysis: ${metric}

**Dataset:** ${metadata?.name || dataset}
**Geographic Focus:** ${geography || 'National'}
**Metric:** ${metric}
**Time Points:** ${timeSeries.length}

**Trend Analysis:**
- Overall Trend: ${trends.trend}
- Overall Change: ${trends.overall_change?.toFixed(2) || 'N/A'}%
- Recent Direction: ${trends.recent_direction || 'Unknown'}
- Volatility: ${trends.volatility?.toFixed(2) || 'N/A'}%`;

    const timeSeriesData = timeSeries.slice(-20).map(point => 
      `${point.time}: ${point.value.toFixed(2)} (n=${point.count})`
    ).join('\n');

    const footer = timeSeries.length > 20 ? `\n*Showing last 20 of ${timeSeries.length} time points*` : '';

    return `${header}\n\n**Time Series Data:**\n\`\`\`\n${timeSeriesData}\n\`\`\`${footer}`;
  }

  formatDatasetCatalog(datasets, includeSample) {
    const header = `## PopHIVE Dataset Catalog

**Available Datasets:** ${Object.keys(datasets).length}

`;

    const catalog = Object.entries(datasets).map(([name, info]) => {
      const metadata = info.metadata;
      const dataCount = info.data?.length || 0;
      const errorInfo = info.error ? `\n⚠️ **Error:** ${info.error}` : '';
      
      let entry = `### ${metadata?.name || name}
**ID:** \`${name}\`
**Description:** ${metadata?.description || 'No description available'}
**Source:** ${metadata?.source || 'Unknown'}
**Update Frequency:** ${metadata?.update_frequency || 'Unknown'}
**Geographic Level:** ${metadata?.geographic_level || 'Unknown'}
**Time Range:** ${metadata?.time_range || 'Unknown'}
**Key Metrics:** ${metadata?.key_metrics?.join(', ') || 'Unknown'}
**Data Quality:** ${metadata?.data_quality || 'Unknown'}
**Records Available:** ${dataCount}${errorInfo}`;

      if (includeSample && info.data && info.data.length > 0) {
        const sample = JSON.stringify(info.data[0], null, 2);
        entry += `\n\n**Sample Record:**\n\`\`\`json\n${sample}\n\`\`\``;
      }

      return entry;
    }).join('\n\n---\n\n');

    return header + catalog;
  }

  formatSearchResults(query, searchResults, geography) {
    const header = `## Search Results for "${query}"

**Geographic Filter:** ${geography || 'All locations'}
**Datasets Searched:** ${searchResults.length}
**Total Matches Found:** ${searchResults.reduce((sum, result) => sum + result.total_matches, 0)}

`;

    if (searchResults.length === 0) {
      return header + 'No matches found. Try different search terms or check dataset availability.';
    }

    const results = searchResults.map(result => {
      const matches = result.matches.slice(0, 3).map(match => 
        JSON.stringify(match, null, 2)
      ).join('\n\n');

      const moreInfo = result.total_matches > 3 ? 
        `\n*... and ${result.total_matches - 3} more matches*` : '';

      return `### ${result.dataset}
**Matches:** ${result.total_matches}

\`\`\`json
${matches}
\`\`\`${moreInfo}`;
    }).join('\n\n---\n\n');

    return header + results;
  }
}
