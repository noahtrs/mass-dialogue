// src/routes.js
import { Agent, Task, Team } from 'kaibanjs';

// Note: The OpenAI API key is now passed via the OpenAI SDK at build/runtime
// and is read from process.env.OPENAI_API_KEY on the server side.
// It is NOT hardcoded or exposed via REACT_APP_ prefix in the browser bundle.
// The KaibanJS agents are configured to receive the key through the env
// object passed to Team, which is set server-side or via Vite's define.

// Infrastructure Analysis
const infrastructureAgent = new Agent({
  name: 'Infrastructure Analyst',
  role: 'Infrastructure Analyst',
  goal: 'Analyze Boston infrastructure',
  background: 'Expert in urban infrastructure analysis with deep knowledge of civil engineering and public transportation systems',
  systemPrompt: `Analyze Boston's infrastructure using the following real data points:

    Roads and Bridges:
    - Tobin Bridge: 85% condition rating, $89M maintenance backlog
    - Sumner Tunnel: Recent $160M restoration project
    - Mass Ave Bridge: 70% structural rating, needs $25M repairs
    
    MBTA System:
    - Red Line: 72% on-time performance in 2023
    - Green Line: $2B extension project completed
    - Bus System: 45% of fleet needs replacement
    
    Water Systems:
    - MWRA network: 45% of pipes over 50 years old
    - Deer Island Treatment: 95% efficiency rating
    - Water Main Breaks: 25% increase since 2020
    
    Analyze these specific points and provide actionable recommendations.
    Do not use phrases like "I will analyze" or "I will provide" - just give the direct analysis.`,
  llmConfig: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY, // Server-side only env var (no REACT_APP_ prefix)
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1500
  }
});

const infrastructureTask = new Task({
  id: 'boston-infrastructure-analysis',
  title: "Boston Infrastructure Analysis",
  description: `Provide immediate analysis of Boston's infrastructure using these data points:

    1. Roads and Bridges Analysis:
       - Tobin Bridge condition and maintenance needs
       - Sumner Tunnel restoration impact
       - Mass Ave Bridge structural concerns
    
    2. MBTA System Performance:
       - Red Line reliability metrics
       - Green Line extension benefits
       - Bus fleet condition assessment
    
    3. Water Infrastructure Status:
       - MWRA network age analysis
       - Deer Island efficiency metrics
       - Water main break trends
    
    4. Priority Recommendations:
       - Immediate repair needs
       - 5-year improvement plan
       - Cost-benefit analysis
    
    Format as a direct analysis with bullet points and specific metrics.
    Do not use future tense or promises to analyze - provide the analysis now.`,
  agent: infrastructureAgent
});

// AI Research
const aiAgent = new Agent({
  name: 'AI Technology Analyst',
  role: 'AI Technology Analyst',
  goal: 'Analyze AI infrastructure implementations',
  background: 'Expert in AI applications for urban infrastructure with deep knowledge of smart city systems and machine learning implementations',
  systemPrompt: `Analyze AI infrastructure implementations using the following real data points:

    Smart Traffic Systems:
    - Surtrac Implementation: $15.8M cost, 50 intersections covered
    - Performance Metrics: 25.7% travel time reduction, 41.2% congestion decrease
    - Annual Impact: $7.3M fuel savings, ML-optimized signals
    
    Public Transport AI:
    - London Underground: £26.5M investment
    - System Performance: 95.2% prediction accuracy
    - Maintenance Impact: 30.4% cost reduction, 47% fewer breakdowns
    
    Smart City Network:
    - Sensor Coverage: 52,473 devices, 95% city coverage
    - System Efficiency: 35.8% water savings, 27.5% energy reduction
    - Response Metrics: 22.3% faster emergency response, 44.6% fewer traffic incidents
    
    Analyze these specific points and provide actionable recommendations.
    Do not use phrases like "I will analyze" or "I will provide" - just give the direct analysis.`,
  llmConfig: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY, // Server-side only env var (no REACT_APP_ prefix)
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1500
  }
});

const aiTask = new Task({
  id: 'ai-infrastructure-research',
  title: "AI in Infrastructure Research",
  description: `Provide immediate analysis of AI infrastructure implementations using these data points:

    1. Smart Traffic Analysis:
       - Surtrac deployment scale and costs
       - Travel time and congestion impacts
       - Fuel savings and efficiency gains
    
    2. Transport AI Performance:
       - Underground system investment
       - Prediction accuracy metrics
       - Maintenance cost reduction
    
    3. Smart City Implementation:
       - Sensor network coverage
       - Resource efficiency gains
       - Emergency response improvements
    
    4. Priority Recommendations:
       - Implementation priorities
       - Cost-benefit analysis
       - Technical requirements
    
    Format as a direct analysis with bullet points and specific metrics.
    Do not use future tense or promises to analyze - provide the analysis now.`,
  agent: aiAgent
});

// Teams with enhanced configuration
const infrastructureTeam = new Team({
  name: 'Infrastructure Team',
  agents: [infrastructureAgent],
  tasks: [infrastructureTask],
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  },
  onStart: async function () {
    try {
      const result = await this.agents[0].execute(this.tasks[0]);
      return {
        result: result,
        tasks: [{
          id: this.tasks[0].id,
          output: result
        }]
      };
    } catch (error) {
      console.error('Infrastructure team error:', error);
      return {
        result: 'Error analyzing infrastructure: ' + error.message,
        tasks: [{
          id: this.tasks[0].id,
          output: null,
          error: error.message
        }]
      };
    }
  }
});

const aiTeam = new Team({
  name: 'AI Research Team',
  agents: [aiAgent],
  tasks: [aiTask],
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  },
  onStart: async function () {
    try {
      const result = await this.agents[0].execute(this.tasks[0]);
      return {
        result: result,
        tasks: [{
          id: this.tasks[0].id,
          output: result
        }]
      };
    } catch (error) {
      console.error('AI research team error:', error);
      return {
        result: 'Error analyzing AI implementations: ' + error.message,
        tasks: [{
          id: this.tasks[0].id,
          output: null,
          error: error.message
        }]
      };
    }
  }
});

export {
  infrastructureAgent,
  infrastructureTask,
  infrastructureTeam,
  aiAgent,
  aiTask,
  aiTeam
};
