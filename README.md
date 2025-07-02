# PopHIVE MCP Server

A Model Context Protocol (MCP) server that provides access to PopHIVE (Population Health Information Visual Explorer) public health data from Yale School of Public Health. This server exposes comprehensive health surveillance data including immunizations, respiratory diseases, and chronic diseases through standardized MCP tools, resources, and prompts.

## Overview

PopHIVE aggregates near real-time health data from multiple authoritative sources:
- **CDC National Immunization Survey (NIS)**: Gold-standard vaccination coverage data
- **Epic Cosmos EHR Network**: Real-world clinical data from electronic health records
- **CDC Laboratory Surveillance (NREVSS)**: Respiratory virus test positivity rates
- **CDC Wastewater Surveillance (NWWS)**: Environmental viral monitoring
- **Google Health Trends**: Population behavior and symptom search patterns

## Features

### 🔧 MCP Tools
- **filter_data**: Filter datasets by state, date range, demographics, and conditions
- **compare_states**: Compare health metrics across multiple states with statistical analysis
- **time_series_analysis**: Analyze trends over time with aggregation options
- **get_available_datasets**: Comprehensive catalog of all available datasets
- **search_health_data**: Search across datasets for specific conditions or keywords

### 📊 MCP Resources
- **dataset://immunizations_nis**: CDC National Immunization Survey data
- **dataset://immunizations_epic**: Epic Cosmos immunization data by demographics
- **dataset://respiratory_ed**: Emergency department visits for respiratory viruses
- **dataset://respiratory_lab**: Laboratory test positivity rates
- **dataset://respiratory_wastewater**: Wastewater viral surveillance data
- **dataset://respiratory_trends**: Google search trends for respiratory symptoms
- **dataset://chronic_obesity**: Obesity prevalence by state and age group
- **dataset://chronic_diabetes**: Diabetes prevalence and glycemic control data

### 💡 MCP Prompts
- **immunization_gaps**: Analyze vaccination coverage gaps by demographics
- **respiratory_surge_detection**: Detect and analyze respiratory disease surges
- **chronic_disease_trends**: Analyze chronic disease prevalence trends
- **multi_source_analysis**: Comprehensive analysis integrating multiple data sources

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd pophive-mcp-server
npm install
```

2. **Configure environment (optional):**
```bash
# Create .env file for custom configuration
echo "DATA_CACHE_DIR=./data" > .env
echo "UPDATE_FREQUENCY=daily" >> .env
```

3. **Test the server:**
```bash
npm test
```

4. **Start the server:**
```bash
npm start
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_CACHE_DIR` | `./data` | Directory for cached data files |
| `UPDATE_FREQUENCY` | `daily` | Data refresh frequency (`hourly`, `daily`, `weekly`) |
| `NODE_ENV` | `development` | Environment mode |

### MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "pophive": {
      "command": "node",
      "args": ["server/index.js"],
      "cwd": "/path/to/pophive-mcp-server"
    }
  }
}
```

## Usage Examples

### Basic Data Filtering

```javascript
// Filter immunization data for California
{
  "tool": "filter_data",
  "arguments": {
    "dataset": "immunizations_nis",
    "state": "CA",
    "vaccine": "MMR"
  }
}
```

### State Comparison

```javascript
// Compare obesity rates across states
{
  "tool": "compare_states",
  "arguments": {
    "dataset": "chronic_obesity",
    "states": ["CA", "TX", "FL", "NY"],
    "metric": "prevalence_rate",
    "time_period": "latest"
  }
}
```

### Time Series Analysis

```javascript
// Analyze respiratory disease trends
{
  "tool": "time_series_analysis",
  "arguments": {
    "dataset": "respiratory_ed",
    "metric": "ed_visits_per_100k",
    "geography": "US",
    "aggregation": "weekly"
  }
}
```

### Using Prompts

```javascript
// Generate immunization gap analysis
{
  "prompt": "immunization_gaps",
  "arguments": {
    "state": "Texas",
    "demographic_focus": "insurance"
  }
}
```

## Data Sources & Quality

### Immunization Data
- **NIS Data**: Household survey, gold standard for coverage rates
- **Epic Cosmos**: EHR data with demographic breakdowns
- **Update Frequency**: Annual (NIS), Monthly (Epic)
- **Geographic Level**: State
- **Quality**: High confidence, large sample sizes

### Respiratory Disease Surveillance
- **ED Visits**: Near real-time healthcare utilization
- **Lab Data**: Clinical test positivity rates
- **Wastewater**: Environmental viral monitoring (early indicator)
- **Search Trends**: Population behavior signals
- **Update Frequency**: Weekly
- **Quality**: High for clinical data, moderate for environmental/behavioral

### Chronic Disease Data
- **Source**: Epic Cosmos EHR network
- **Metrics**: Clinical measurements (BMI, HbA1c)
- **Update Frequency**: Quarterly
- **Geographic Level**: State with age stratification
- **Quality**: High - real-world clinical data

## API Reference

### Tools

#### filter_data
Filter datasets by various criteria.

**Parameters:**
- `dataset` (required): Dataset identifier
- `state` (optional): State code or name
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `age_group` (optional): Age group filter
- `condition` (optional): Condition/metric filter

#### compare_states
Compare health metrics across multiple states.

**Parameters:**
- `dataset` (required): Dataset identifier
- `states` (required): Array of state codes/names
- `metric` (required): Metric to compare
- `time_period` (optional): Time period for comparison

#### time_series_analysis
Analyze trends over time.

**Parameters:**
- `dataset` (required): Dataset identifier
- `metric` (required): Metric to analyze
- `geography` (optional): Geographic focus
- `start_date` (optional): Analysis start date
- `end_date` (optional): Analysis end date
- `aggregation` (optional): Time aggregation (`weekly`, `monthly`, `quarterly`, `yearly`)

### Resources

All resources return JSON data with standardized schemas:

```javascript
// Example immunization record
{
  "geography": "CA",
  "year": 2024,
  "vaccine": "MMR",
  "age_group": "19-35 months",
  "coverage_rate": 96.1,
  "sample_size": 1876,
  "source": "CDC NIS"
}

// Example respiratory surveillance record
{
  "geography": "US",
  "date": "2024-12-01",
  "week": "2024-48",
  "virus": "RSV",
  "ed_visits_per_100k": 3.8,
  "percent_change": 15.2,
  "source": "Epic Cosmos"
}
```

## Development

### Project Structure

```
pophive-mcp-server/
├── server/
│   ├── index.js                 # Main MCP server
│   ├── utils/
│   │   └── data-loader.js       # Data loading and caching
│   ├── tools/
│   │   └── analysis-tools.js    # MCP tool implementations
│   ├── prompts/
│   │   └── prompt-templates.js  # MCP prompt templates
│   └── scrapers/
│       ├── immunizations.js     # Immunization data scraper
│       ├── respiratory.js       # Respiratory data scraper
│       └── chronic-diseases.js  # Chronic disease data scraper
├── data/                        # Cached data files
├── package.json
├── manifest.json               # MCP server manifest
└── README.md
```

### Adding New Data Sources

1. **Create a scraper** in `server/scrapers/`
2. **Update data loader** to include new datasets
3. **Add resource mappings** in the main server
4. **Update tool logic** to handle new data types
5. **Create prompts** for new analysis types

### Testing

```bash
# Run all tests
npm test

# Test specific components
npm run test:tools
npm run test:scrapers
npm run test:integration
```

### Data Refresh

The server automatically refreshes data based on the `UPDATE_FREQUENCY` setting. Manual refresh:

```bash
npm run refresh-data
```

## Troubleshooting

### Common Issues

**Server won't start:**
- Check Node.js version (18+ required)
- Verify all dependencies installed: `npm install`
- Check for port conflicts

**No data returned:**
- Data may be initializing on first run
- Check data directory permissions
- Verify network connectivity for scraping

**MCP client connection issues:**
- Verify server path in client configuration
- Check server logs for errors
- Ensure MCP client supports stdio transport

### Logging

Server logs are written to stderr and include:
- Data scraping activities
- Tool execution results
- Error messages and stack traces

Enable verbose logging:
```bash
DEBUG=pophive:* npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

### Code Style
- Use ESLint configuration
- Follow existing patterns
- Add JSDoc comments for public APIs
- Include error handling

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: GitHub Issues
- **Documentation**: This README and inline code comments
- **Data Questions**: Refer to original PopHIVE sources

## Acknowledgments

- **Yale School of Public Health** for PopHIVE initiative
- **CDC** for surveillance data systems
- **Epic Systems** for Cosmos EHR network data
- **Model Context Protocol** community for standards
