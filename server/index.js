#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { DataLoader } from './utils/data-loader.js';
import { ImmunizationsScraper } from './scrapers/immunizations.js';
import { RespiratoryScraper } from './scrapers/respiratory.js';
import { ChronicDiseasesScraper } from './scrapers/chronic-diseases.js';
import { AnalysisTools } from './tools/analysis-tools.js';
import { PromptTemplates } from './prompts/prompt-templates.js';

class PopHIVEMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'pophive-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {}
        },
      }
    );

    // Initialize components
    this.dataLoader = new DataLoader();
    this.analysisTools = new AnalysisTools(this.dataLoader);
    this.promptTemplates = new PromptTemplates();
    
    // Initialize scrapers
    const dataDir = process.env.DATA_CACHE_DIR || './data';
    this.immunizationsScraper = new ImmunizationsScraper(dataDir);
    this.respiratoryScraper = new RespiratoryScraper(dataDir);
    this.chronicDiseasesScraper = new ChronicDiseasesScraper(dataDir);

    this.setupHandlers();
    this.initializeData();
  }

  async initializeData() {
    try {
      console.error('Initializing PopHIVE data...');
      
      // Check if we need to refresh data based on update frequency
      const updateFreq = process.env.UPDATE_FREQUENCY || 'daily';
      const shouldUpdate = await this.dataLoader.shouldUpdateData(updateFreq);
      
      if (shouldUpdate) {
        console.error('Refreshing data from PopHIVE...');
        await Promise.all([
          this.immunizationsScraper.scrapeAll(),
          this.respiratoryScraper.scrapeAll(),
          this.chronicDiseasesScraper.scrapeAll()
        ]);
        console.error('Data refresh complete');
      } else {
        console.error('Using cached data');
      }
    } catch (error) {
      console.error('Error initializing data:', error.message);
      // Continue with cached data if available
    }
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'filter_data',
          description: 'Filter PopHIVE datasets by various criteria (state, date range, demographics)',
          inputSchema: {
            type: 'object',
            properties: {
              dataset: {
                type: 'string',
                enum: ['immunizations_nis', 'immunizations_epic', 'respiratory_ed', 'respiratory_lab', 'respiratory_wastewater', 'respiratory_trends', 'chronic_obesity', 'chronic_diabetes'],
                description: 'Dataset to filter'
              },
              state: {
                type: 'string',
                description: 'State code (e.g., CA, TX, NY) or state name'
              },
              start_date: {
                type: 'string',
                format: 'date',
                description: 'Start date for filtering (YYYY-MM-DD)'
              },
              end_date: {
                type: 'string', 
                format: 'date',
                description: 'End date for filtering (YYYY-MM-DD)'
              },
              age_group: {
                type: 'string',
                description: 'Age group to filter by (e.g., "0-2 years", "18-64", "65+")'
              },
              condition: {
                type: 'string',
                description: 'Health condition or metric to filter by'
              }
            },
            required: ['dataset']
          }
        },
        {
          name: 'compare_states',
          description: 'Compare health metrics across multiple states',
          inputSchema: {
            type: 'object',
            properties: {
              dataset: { 
                type: 'string',
                enum: ['immunizations_nis', 'immunizations_epic', 'respiratory_ed', 'respiratory_lab', 'respiratory_wastewater', 'respiratory_trends', 'chronic_obesity', 'chronic_diabetes'],
                description: 'Dataset to analyze'
              },
              states: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of state codes or names to compare',
                minItems: 2
              },
              metric: { 
                type: 'string', 
                description: 'Specific metric to compare (e.g., "vaccination_rate", "ed_visits", "positivity_rate")'
              },
              time_period: {
                type: 'string',
                description: 'Time period for comparison (e.g., "latest", "2024", "last_6_months")'
              }
            },
            required: ['dataset', 'states', 'metric']
          }
        },
        {
          name: 'time_series_analysis',
          description: 'Analyze trends over time for specific health metrics',
          inputSchema: {
            type: 'object',
            properties: {
              dataset: { 
                type: 'string',
                enum: ['immunizations_nis', 'immunizations_epic', 'respiratory_ed', 'respiratory_lab', 'respiratory_wastewater', 'respiratory_trends', 'chronic_obesity', 'chronic_diabetes']
              },
              metric: { type: 'string', description: 'Metric to analyze over time' },
              geography: { type: 'string', description: 'Geographic focus (state, region, or "national")' },
              start_date: { type: 'string', format: 'date' },
              end_date: { type: 'string', format: 'date' },
              aggregation: {
                type: 'string',
                enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
                default: 'monthly'
              }
            },
            required: ['dataset', 'metric']
          }
        },
        {
          name: 'get_available_datasets',
          description: 'Get comprehensive information about all available PopHIVE datasets',
          inputSchema: {
            type: 'object',
            properties: {
              include_sample: {
                type: 'boolean',
                description: 'Include sample data for each dataset',
                default: false
              }
            }
          }
        },
        {
          name: 'search_health_data',
          description: 'Search across all datasets for specific health conditions, metrics, or keywords',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (health condition, metric name, or keyword)'
              },
              datasets: {
                type: 'array',
                items: { type: 'string' },
                description: 'Specific datasets to search (if empty, searches all)'
              },
              geography: {
                type: 'string',
                description: 'Geographic filter for search results'
              }
            },
            required: ['query']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'filter_data':
            return await this.analysisTools.filterData(args);
          case 'compare_states':
            return await this.analysisTools.compareStates(args);
          case 'time_series_analysis':
            return await this.analysisTools.timeSeriesAnalysis(args);
          case 'get_available_datasets':
            return await this.analysisTools.getAvailableDatasets(args);
          case 'search_health_data':
            return await this.analysisTools.searchHealthData(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error in tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: 'immunization_gaps',
          description: 'Analyze vaccination coverage gaps by demographic factors',
          arguments: [
            {
              name: 'state',
              description: 'State to analyze (optional, defaults to national)',
              required: false
            },
            {
              name: 'vaccine_type',
              description: 'Specific vaccine to focus on (optional)',
              required: false
            },
            {
              name: 'demographic_focus',
              description: 'Demographic dimension to analyze (e.g., "insurance", "urbanicity", "age")',
              required: false
            }
          ]
        },
        {
          name: 'respiratory_surge_detection',
          description: 'Identify and analyze respiratory disease surges',
          arguments: [
            {
              name: 'region',
              description: 'Geographic region to analyze',
              required: true
            },
            {
              name: 'virus_type',
              description: 'Virus to focus on (COVID, RSV, Influenza, or "all")',
              required: false
            },
            {
              name: 'time_period',
              description: 'Time period to analyze (e.g., "last_4_weeks", "winter_2024")',
              required: false
            }
          ]
        },
        {
          name: 'chronic_disease_trends',
          description: 'Analyze chronic disease prevalence trends and patterns',
          arguments: [
            {
              name: 'condition',
              description: 'Condition to analyze ("obesity", "diabetes", or "both")',
              required: true
            },
            {
              name: 'demographic_focus',
              description: 'Demographic dimension (e.g., "age", "state", "trends")',
              required: false
            },
            {
              name: 'comparison_states',
              description: 'Specific states to compare (comma-separated)',
              required: false
            }
          ]
        },
        {
          name: 'multi_source_analysis',
          description: 'Comprehensive analysis using multiple data sources',
          arguments: [
            {
              name: 'health_topic',
              description: 'Health topic to analyze (e.g., "respiratory_viruses", "vaccination_equity")',
              required: true
            },
            {
              name: 'geographic_focus',
              description: 'Geographic focus for analysis',
              required: false
            },
            {
              name: 'time_range',
              description: 'Time range for analysis',
              required: false
            }
          ]
        }
      ]
    }));

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        return await this.promptTemplates.getPrompt(name, args || {});
      } catch (error) {
        console.error(`Error generating prompt ${name}:`, error);
        return {
          description: `Error generating prompt: ${error.message}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Error: Could not generate prompt "${name}". ${error.message}`
              }
            }
          ]
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'dataset://immunizations_nis',
          name: 'CDC National Immunization Survey Data',
          description: 'Household survey data on childhood vaccination coverage rates',
          mimeType: 'application/json'
        },
        {
          uri: 'dataset://immunizations_epic',
          name: 'Epic Cosmos Immunization Data',
          description: 'EHR-based immunization data by insurance status and urbanicity',
          mimeType: 'application/json'
        },
        {
          uri: 'dataset://respiratory_ed',
          name: 'Emergency Department Visits',
          description: 'ED visits for respiratory viruses (RSV, COVID-19, Influenza)',
          mimeType: 'application/json'
        },
        {
          uri: 'dataset://respiratory_lab',
          name: 'Laboratory Test Positivity',
          description: 'Lab test positivity rates from CDC NREVSS',
          mimeType: 'application/json'
        },
        {
          uri: 'dataset://respiratory_wastewater',
          name: 'Wastewater Surveillance',
          description: 'Viral levels in wastewater from CDC NWWS',
          mimeType: 'application/json'
        },
        {
          uri: 'dataset://respiratory_trends',
          name: 'Google Health Trends',
          description: 'Search trends for respiratory symptoms',
          mimeType: 'application/json'
        },
        {
          uri: 'dataset://chronic_obesity',
          name: 'Obesity Prevalence',
          description: 'BMI ≥30 prevalence by state and age group',
          mimeType: 'application/json'
        },
        {
          uri: 'dataset://chronic_diabetes',
          name: 'Diabetes Prevalence',
          description: 'HbA1c ≥7% prevalence by state and age group',
          mimeType: 'application/json'
        }
      ]
    }));

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      try {
        const datasetName = uri.replace('dataset://', '');
        const data = await this.dataLoader.loadDataset(datasetName);
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error(`Error reading resource ${uri}:`, error);
        throw new Error(`Could not read resource ${uri}: ${error.message}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('PopHIVE MCP Server running on stdio');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Shutting down PopHIVE MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Shutting down PopHIVE MCP Server...');
  process.exit(0);
});

// Start the server
const server = new PopHIVEMCPServer();
server.run().catch((error) => {
  console.error('Failed to start PopHIVE MCP Server:', error);
  process.exit(1);
});
