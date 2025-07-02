export class PromptTemplates {
  constructor() {
    this.templates = {
      'immunization_gaps': this.immunizationGapsPrompt,
      'respiratory_surge_detection': this.respiratorySurgePrompt,
      'chronic_disease_trends': this.chronicDiseaseTrendsPrompt,
      'multi_source_analysis': this.multiSourceAnalysisPrompt
    };
  }

  async getPrompt(name, args) {
    const template = this.templates[name];
    if (!template) {
      throw new Error(`Unknown prompt template: ${name}`);
    }

    return await template.call(this, args);
  }

  async immunizationGapsPrompt(args) {
    const { state, vaccine_type, demographic_focus } = args;
    
    const stateFilter = state ? ` in ${state}` : ' nationally';
    const vaccineFilter = vaccine_type ? ` for ${vaccine_type}` : ' across all vaccines';
    const demographicFilter = demographic_focus ? ` by ${demographic_focus}` : ' across demographic groups';

    const prompt = `# Immunization Coverage Gap Analysis

Analyze vaccination coverage gaps${stateFilter}${vaccineFilter}${demographicFilter} using PopHIVE data.

## Analysis Framework

**Primary Questions:**
1. What are the current vaccination coverage rates and how do they compare to national targets?
2. Which demographic groups show the largest coverage gaps?
3. What trends are evident over time?
4. How do coverage rates vary by insurance status and urbanicity?

**Data Sources to Use:**
- CDC National Immunization Survey (NIS) data for gold-standard coverage rates
- Epic Cosmos immunization data for demographic breakdowns
- Compare household survey data (NIS) with electronic health record data (Epic)

**Key Metrics to Examine:**
- Coverage rates by vaccine type and age group
- Disparities by insurance type (Private, Medicaid, Uninsured)
- Urban vs rural coverage differences
- State-level variations and rankings

**Analysis Steps:**
1. Get current coverage rates using the filter_data tool
2. Compare states using the compare_states tool if analyzing multiple states
3. Examine trends over time using time_series_analysis
4. Search for specific demographic patterns using search_health_data

**Interpretation Guidelines:**
- Healthy People 2030 targets: ≥90% for most childhood vaccines
- Consider confidence intervals and sample sizes from NIS data
- Look for systematic disparities that suggest policy interventions
- Identify states or groups that could benefit from targeted programs

Please provide a comprehensive analysis with specific recommendations for addressing identified gaps.`;

    return {
      description: `Analyze vaccination coverage gaps${stateFilter}${vaccineFilter}${demographicFilter}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: prompt
          }
        }
      ]
    };
  }

  async respiratorySurgePrompt(args) {
    const { region, virus_type, time_period } = args;
    
    const regionFilter = region ? ` in ${region}` : ' nationally';
    const virusFilter = virus_type && virus_type !== 'all' ? ` for ${virus_type}` : ' for respiratory viruses';
    const timeFilter = time_period ? ` during ${time_period}` : ' in recent periods';

    const prompt = `# Respiratory Disease Surge Detection and Analysis

Detect and analyze respiratory disease activity${regionFilter}${virusFilter}${timeFilter} using multi-source PopHIVE surveillance data.

## Analysis Framework

**Primary Questions:**
1. Are we currently experiencing a surge in respiratory disease activity?
2. Which viruses are driving increased activity?
3. How does current activity compare to historical patterns?
4. What early warning signals are present across different data sources?

**Multi-Source Data Integration:**
- **Emergency Department Visits**: Real-time healthcare utilization (Epic Cosmos, CDC NSSP)
- **Laboratory Data**: Test positivity rates (CDC NREVSS)
- **Wastewater Surveillance**: Environmental viral levels (CDC NWWS)
- **Search Trends**: Population behavior and symptom searches (Google Trends)

**Key Indicators to Monitor:**
- ED visit rates per 100,000 population
- Week-over-week percent changes
- Laboratory test positivity rates
- Wastewater viral concentrations
- Search volume for respiratory symptoms

**Analysis Steps:**
1. Get current respiratory disease activity using filter_data for recent weeks
2. Compare current levels to historical baselines using time_series_analysis
3. Examine geographic patterns using compare_states if analyzing multiple regions
4. Cross-validate signals across data sources using search_health_data

**Surge Detection Criteria:**
- **Moderate Activity**: 10-25% increase over baseline
- **High Activity**: 25-50% increase over baseline  
- **Very High Activity**: >50% increase over baseline
- **Sustained Surge**: Elevated activity for 2+ consecutive weeks

**Early Warning Signals:**
- Wastewater levels often lead clinical indicators by 3-7 days
- Search trends may precede healthcare utilization by 1-2 weeks
- Laboratory positivity rates confirm active transmission

**Interpretation Guidelines:**
- Consider seasonal patterns (RSV peaks fall/winter, Influenza winter)
- Account for testing patterns and healthcare-seeking behavior
- Look for concordance across multiple data sources
- Consider geographic spread patterns

Please provide a comprehensive surge assessment with risk level determination and recommended monitoring actions.`;

    return {
      description: `Detect and analyze respiratory disease surges${regionFilter}${virusFilter}${timeFilter}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: prompt
          }
        }
      ]
    };
  }

  async chronicDiseaseTrendsPrompt(args) {
    const { condition, demographic_focus, comparison_states } = args;
    
    const conditionFilter = condition === 'both' ? ' for obesity and diabetes' : ` for ${condition}`;
    const demographicFilter = demographic_focus ? ` with focus on ${demographic_focus}` : ' across demographic groups';
    const stateFilter = comparison_states ? ` comparing ${comparison_states}` : ' across states';

    const prompt = `# Chronic Disease Prevalence Trends Analysis

Analyze chronic disease prevalence trends${conditionFilter}${demographicFilter}${stateFilter} using Epic Cosmos EHR data.

## Analysis Framework

**Primary Questions:**
1. What are the current prevalence rates and how are they changing over time?
2. Which demographic groups and geographic areas show the highest burden?
3. Are there concerning trends that warrant public health intervention?
4. How do prevalence rates compare to national health objectives?

**Data Source:**
- Epic Cosmos EHR Network: Clinical measurements from large healthcare systems
- Real-world data from routine clinical care
- State-level aggregation with demographic breakdowns

**Key Metrics:**
- **Obesity**: BMI ≥30 kg/m² prevalence rates
- **Diabetes**: HbA1c ≥7% prevalence rates (indicating poor glycemic control)
- Age-stratified rates (18-64 years, 65+ years)
- Geographic variations by state

**Analysis Steps:**
1. Get current prevalence rates using filter_data for recent data
2. Examine trends over time using time_series_analysis
3. Compare states using compare_states tool for geographic patterns
4. Search for specific demographic patterns using search_health_data

**National Health Objectives (Healthy People 2030):**
- **Obesity**: Reduce adult obesity prevalence to 36.0%
- **Diabetes**: Increase proportion of adults with diabetes who have good glycemic control

**Risk Factors and Correlations:**
- Obesity and diabetes are closely linked conditions
- Higher prevalence in certain age groups and geographic regions
- Social determinants of health influence prevalence patterns

**Trend Analysis Focus:**
- **Temporal Trends**: Are rates increasing, stable, or decreasing?
- **Geographic Patterns**: Which states have highest/lowest rates?
- **Demographic Disparities**: Age-related differences in prevalence
- **Correlation Analysis**: Relationship between obesity and diabetes rates

**Interpretation Guidelines:**
- Consider clinical measurement bias (EHR data represents healthcare-engaged population)
- Look for sustained trends over multiple time periods
- Identify states with concerning upward trends
- Consider policy implications for prevention and management programs

**Public Health Implications:**
- High prevalence areas may need targeted interventions
- Trends inform resource allocation and program planning
- Early identification of emerging hotspots enables proactive response

Please provide a comprehensive analysis with trend assessment, geographic risk mapping, and public health recommendations.`;

    return {
      description: `Analyze chronic disease prevalence trends${conditionFilter}${demographicFilter}${stateFilter}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: prompt
          }
        }
      ]
    };
  }

  async multiSourceAnalysisPrompt(args) {
    const { health_topic, geographic_focus, time_range } = args;
    
    const topicFilter = health_topic ? ` focused on ${health_topic}` : '';
    const geoFilter = geographic_focus ? ` in ${geographic_focus}` : ' nationally';
    const timeFilter = time_range ? ` during ${time_range}` : ' across available time periods';

    const prompt = `# Multi-Source Public Health Analysis

Conduct a comprehensive public health analysis${topicFilter}${geoFilter}${timeFilter} integrating multiple PopHIVE data sources.

## Analysis Framework

**Objective:**
Provide a holistic view of public health trends by combining surveillance data from multiple sources to identify patterns, correlations, and actionable insights.

**Available Data Sources:**
1. **CDC National Immunization Survey (NIS)**: Gold-standard vaccination coverage
2. **Epic Cosmos EHR Data**: Real-world clinical data on immunizations, ED visits, chronic diseases
3. **CDC Laboratory Surveillance (NREVSS)**: Respiratory virus test positivity
4. **CDC Wastewater Surveillance (NWWS)**: Environmental viral monitoring
5. **Google Health Trends**: Population behavior and symptom searches
6. **CDC Emergency Department Surveillance**: Healthcare utilization patterns

**Cross-Source Analysis Opportunities:**

### Respiratory Disease Surveillance
- **Correlation Analysis**: Compare wastewater levels, ED visits, lab positivity, and search trends
- **Lead-Lag Relationships**: Identify which indicators provide earliest warning
- **Geographic Concordance**: Validate signals across different surveillance systems

### Vaccination and Disease Prevention
- **Coverage vs Outcomes**: Correlate immunization rates with disease incidence
- **Equity Analysis**: Compare vaccination coverage across demographic groups
- **Effectiveness Assessment**: Link vaccination data with breakthrough infections

### Chronic Disease Burden
- **Comorbidity Patterns**: Analyze relationships between obesity, diabetes, and other conditions
- **Healthcare Utilization**: Connect chronic disease prevalence with ED visit patterns
- **Geographic Clustering**: Identify areas with multiple health challenges

**Analysis Steps:**
1. **Data Inventory**: Use get_available_datasets to catalog all available data
2. **Temporal Alignment**: Synchronize data across sources using time_series_analysis
3. **Geographic Harmonization**: Standardize geographic units using compare_states
4. **Pattern Detection**: Use search_health_data to identify cross-cutting themes
5. **Correlation Analysis**: Examine relationships between different health indicators

**Key Questions to Address:**
- What are the primary public health challenges in the focus area?
- How do different surveillance systems complement each other?
- Where are the data gaps and how can they be addressed?
- What early warning capabilities exist across the surveillance network?
- Which populations or areas need targeted interventions?

**Methodological Considerations:**
- **Data Quality**: Account for different collection methods and biases
- **Temporal Resolution**: Align weekly, monthly, and annual data appropriately
- **Geographic Scale**: Consider state vs county vs regional variations
- **Population Denominators**: Ensure appropriate rate calculations

**Synthesis Framework:**
1. **Current Situation Assessment**: What is the current health status?
2. **Trend Analysis**: How are key indicators changing over time?
3. **Risk Stratification**: Which areas/populations are highest risk?
4. **Early Warning Capacity**: How well can we detect emerging threats?
5. **Intervention Opportunities**: Where can public health action have the greatest impact?

**Deliverables:**
- Integrated health status dashboard
- Risk assessment and priority ranking
- Surveillance system performance evaluation
- Recommendations for enhanced monitoring and intervention

Please provide a comprehensive multi-source analysis that demonstrates the value of integrated surveillance and identifies specific opportunities for public health action.`;

    return {
      description: `Comprehensive multi-source public health analysis${topicFilter}${geoFilter}${timeFilter}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: prompt
          }
        }
      ]
    };
  }
}
