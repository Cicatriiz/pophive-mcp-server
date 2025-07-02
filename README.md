# PopHIVE MCP Server

A Model Context Protocol (MCP) server that provides access to PopHIVE (Population Health Information Visual Explorer) public health data from Yale School of Public Health. This server exposes comprehensive health surveillance data including immunizations, respiratory diseases, and chronic diseases through standardized MCP tools, resources, and prompts.

**🎯 Production-Ready**: All critical bugs fixed, enhanced error handling, and comprehensive dataset metadata included.

**📦 Desktop Extension Ready**: Fully compliant with Anthropic's Desktop Extension (DXT) specification for one-click installation in Claude Desktop and other MCP-enabled applications.


## What is PopHIVE? 

PopHIVE (Population Health Information Visual Explorer) is Yale's comprehensive platform that aggregates near real-time public health data from authoritative sources including CDC surveillance systems, Epic Cosmos EHR networks, and Google Health Trends. It's an invaluable resource for epidemiologists, researchers, and public health professionals.

👉 Explore PopHIVE: [](https://www.pophive.org/)<https://www.pophive.org/>


## Recent Improvements

### ✅ Critical Bug Fixes (v1.0.0)
- **Fixed Geography Filter Bug**: The "national" geography filter now works correctly and returns proper results
- **Enhanced Search Algorithm**: Search now includes both field names and values for comprehensive matching
- **Improved Error Handling**: Added descriptive error messages with specific suggestions when searches return no results
- **Enhanced Dataset Metadata**: Added geographic granularity, date ranges, key metrics, and data quality indicators

### 🔧 Technical Improvements
- **Better Geography Handling**: Supports "national", "US", and state-level filtering with proper normalization
- **Comprehensive Error Messages**: Context-aware suggestions based on search terms and geography filters
- **Dataset Capability Documentation**: Clear indication of which datasets support state vs national analysis
- **Production-Ready Error Handling**: Graceful handling of edge cases with helpful user guidance

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

### Option 1: Desktop Extension (Recommended)

**For Claude Desktop users:**
1. Download the `.dxt` file from the releases page
2. Double-click the file to open with Claude Desktop
3. Click "Install" in the installation dialog
4. Configure any required settings (update frequency, cache size)
5. The extension will be automatically available in Claude Desktop

**For other MCP-enabled applications:**
- Use the same `.dxt` file with any application supporting Desktop Extensions
- Follow your application's extension installation process

### Option 2: Manual Installation

**Prerequisites:**
- Node.js 18+ 
- npm or yarn

**Setup:**

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

### Option 3: Build Your Own Extension

**Create a Desktop Extension from source:**

1. **Install DXT CLI tools:**
```bash
npm install -g @anthropic-ai/dxt
```

2. **Clone and prepare:**
```bash
git clone <repository-url>
cd pophive-mcp-server
npm install
```

3. **Package as extension:**
```bash
dxt pack
```

4. **Install the generated `.dxt` file** in Claude Desktop or other MCP applications

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

## Dataset Selection Guide

Choose the right dataset for your analysis:

| Dataset | Geographic Level | Best Use Cases | Date Range | Update Frequency | Key Limitations |
|---------|------------------|----------------|------------|------------------|-----------------|
| `immunizations_nis` | National + State | National vaccination trends, state comparisons | 2019-2024 | Annual | Survey data, limited demographics |
| `immunizations_epic` | National + State | Real-world vaccination patterns, insurance analysis | 2020-2024 | Monthly | EHR network bias |
| `respiratory_ed` | National + State | Emergency department surveillance, outbreak detection | 2020-2024 | Weekly | Healthcare utilization only |
| `respiratory_lab` | National only | Clinical test positivity, laboratory surveillance | 2020-2024 | Weekly | National aggregates only |
| `respiratory_wastewater` | Regional | Environmental surveillance, early warning | 2022-2024 | Weekly | Limited geographic coverage |
| `respiratory_trends` | National + State | Population behavior, symptom searches | 2020-2024 | Weekly | Behavioral proxy, not clinical |
| `chronic_obesity` | National + State | Obesity prevalence, chronic disease tracking | 2020-2024 | Quarterly | Clinical populations only |
| `chronic_diabetes` | National + State | Diabetes management, glycemic control | 2020-2024 | Quarterly | Clinical populations only |

### Quick Dataset Selection

**For national trends:** Use `immunizations_nis`, `respiratory_lab`, or any dataset with `geography="national"`

**For state comparisons:** Use `respiratory_ed`, `chronic_obesity`, `chronic_diabetes`, or `immunizations_nis`

**For real-time surveillance:** Use `respiratory_ed`, `respiratory_wastewater`, or `respiratory_trends`

**For clinical outcomes:** Use `immunizations_epic`, `chronic_obesity`, or `chronic_diabetes`

## Usage Examples

### Basic Data Filtering

```javascript
// ✅ WORKING: Filter immunization data for California
{
  "tool": "filter_data",
  "arguments": {
    "dataset": "immunizations_nis",
    "state": "CA"
  }
}

// ✅ WORKING: Filter national immunization data
{
  "tool": "filter_data",
  "arguments": {
    "dataset": "immunizations_nis",
    "state": "US"
  }
}

// ❌ AVOID: This will return 0 results
{
  "tool": "filter_data",
  "arguments": {
    "dataset": "respiratory_lab",
    "state": "CA"  // respiratory_lab only has national data
  }
}
```

### State Comparison

```javascript
// ✅ WORKING: Compare obesity rates across states
{
  "tool": "compare_states",
  "arguments": {
    "dataset": "chronic_obesity",
    "states": ["CA", "TX", "FL", "NY"],
    "metric": "prevalence_rate",
    "time_period": "latest"
  }
}

// ✅ WORKING: Compare vaccination coverage
{
  "tool": "compare_states",
  "arguments": {
    "dataset": "immunizations_nis",
    "states": ["California", "Texas", "New York"],  // Full names work too
    "metric": "coverage_rate"
  }
}
```

### Time Series Analysis

```javascript
// ✅ WORKING: Analyze national respiratory trends
{
  "tool": "time_series_analysis",
  "arguments": {
    "dataset": "respiratory_ed",
    "metric": "ed_visits_per_100k",
    "geography": "national",  // Use "national" for US-level data
    "aggregation": "weekly"
  }
}

// ✅ WORKING: Analyze state-level trends
{
  "tool": "time_series_analysis",
  "arguments": {
    "dataset": "respiratory_ed",
    "metric": "ed_visits_per_100k",
    "geography": "CA",
    "start_date": "2024-01-01",
    "end_date": "2024-12-01"
  }
}
```

### Search Health Data

```javascript
// ✅ WORKING: Search with national geography
{
  "tool": "search_health_data",
  "arguments": {
    "query": "RSV",
    "geography": "national"  // Fixed: Use "national" instead of "US"
  }
}

// ✅ WORKING: Search specific datasets
{
  "tool": "search_health_data",
  "arguments": {
    "query": "vaccination coverage",
    "datasets": ["immunizations_nis", "immunizations_epic"]
  }
}
```

### Using Prompts

```javascript
// ✅ WORKING: Generate immunization gap analysis
{
  "prompt": "immunization_gaps",
  "arguments": {
    "state": "Texas",
    "demographic_focus": "insurance"
  }
}

// ✅ WORKING: Detect respiratory surges
{
  "prompt": "respiratory_surge_detection",
  "arguments": {
    "region": "California",
    "virus_type": "RSV",
    "time_period": "last_4_weeks"
  }
}
```

## Common Issues & Solutions

### Issue: "No data found" or 0 results

**Cause:** Geographic mismatch or dataset limitations

**Solutions:**
1. **Check dataset capabilities:** Use `get_available_datasets` to see supported geographies
2. **Use correct geography values:**
   - For national data: `"geography": "national"` (not "US")
   - For states: Use state codes ("CA") or full names ("California")
3. **Try alternative datasets:** Some datasets only support national-level analysis

```javascript
// ❌ Problem: Wrong geography for national data
{
  "tool": "search_health_data",
  "arguments": {
    "query": "influenza",
    "geography": "US"  // Should be "national"
  }
}

// ✅ Solution: Use correct geography
{
  "tool": "search_health_data",
  "arguments": {
    "query": "influenza",
    "geography": "national"
  }
}
```

### Issue: Empty results for state-level queries

**Cause:** Dataset only contains national-level data

**Solutions:**
1. **Check dataset metadata** first using `get_available_datasets`
2. **Use state-capable datasets:** `respiratory_ed`, `chronic_obesity`, `chronic_diabetes`, `immunizations_nis`
3. **Switch to national analysis** for datasets like `respiratory_lab`

### Issue: Metric not found

**Cause:** Incorrect metric name or dataset mismatch

**Solutions:**
1. **Use dataset-appropriate metrics:**
   - Immunizations: `coverage_rate`, `sample_size`
   - Respiratory: `ed_visits_per_100k`, `positivity_rate`
   - Chronic: `prevalence_rate`, `patient_count`
2. **Check sample data** using `get_available_datasets` with `include_sample: true`

## Working Parameter Combinations

### Immunization Analysis
```javascript
// National vaccination trends
{
  "tool": "time_series_analysis",
  "arguments": {
    "dataset": "immunizations_nis",
    "metric": "coverage_rate",
    "geography": "national"
  }
}

// State vaccination comparison
{
  "tool": "compare_states",
  "arguments": {
    "dataset": "immunizations_nis",
    "states": ["CA", "TX", "NY", "FL"],
    "metric": "coverage_rate"
  }
}
```

### Respiratory Surveillance
```javascript
// Emergency department trends
{
  "tool": "filter_data",
  "arguments": {
    "dataset": "respiratory_ed",
    "state": "CA",
    "condition": "RSV"
  }
}

// National lab surveillance
{
  "tool": "time_series_analysis",
  "arguments": {
    "dataset": "respiratory_lab",
    "metric": "positivity_rate",
    "geography": "national"
  }
}
```

### Chronic Disease Analysis
```javascript
// Obesity prevalence by state
{
  "tool": "filter_data",
  "arguments": {
    "dataset": "chronic_obesity",
    "state": "TX",
    "age_group": "18-64"
  }
}

// Diabetes trends
{
  "tool": "time_series_analysis",
  "arguments": {
    "dataset": "chronic_diabetes",
    "metric": "prevalence_rate",
    "geography": "CA"
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
