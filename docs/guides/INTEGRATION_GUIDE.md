# Equihome Fund Simulation Engine - Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [Integration Architecture](#integration-architecture)
3. [Traffic Light System Integration](#traffic-light-system-integration)
4. [Portfolio Management System Integration](#portfolio-management-system-integration)
5. [Underwriting System Integration](#underwriting-system-integration)
6. [Authentication and Authorization](#authentication-and-authorization)
7. [Data Synchronization](#data-synchronization)
8. [Error Handling](#error-handling)
9. [Implementation Examples](#implementation-examples)

## Overview

The Equihome Fund Simulation Engine is designed to integrate with other systems in the Equihome ecosystem, particularly the Traffic Light System, Portfolio Management System (PMS), and Underwriting System. This guide provides detailed information on how to implement these integrations.

## Integration Architecture

The simulation engine uses a combination of REST APIs, WebSockets, and message queues for integration:

```
┌─────────────────────────────────────────────────────────────────┐
│                 Equihome Platform Ecosystem                     │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Traffic     │  │ Portfolio   │  │ Underwriting           │  │
│  │ Light       │◄─┼─►Management │◄─┼─►System                │  │
│  │ System      │  │ System      │  │                        │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬───────────┘  │
│         │                │                      │              │
│         ▼                ▼                      ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Integration Bus / Message Queue         │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                 Simulation Engine                                │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐   │
│  │ External Data       │  │ WebSocket                       │   │
│  │ Integration Layer   │  │ Server                          │   │
│  └─────────┬───────────┘  └─────────────────┬───────────────┘   │
│            │                                │                    │
│            ▼                                ▼                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Core Simulation Engine                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Traffic Light System Integration

The Traffic Light System provides property zone classifications (green, orange, red) based on risk assessment.

### Data Flow

1. **Simulation Engine to Traffic Light System**:
   - Request zone classifications for specific properties
   - Request market risk indicators for regions
   - Send portfolio allocation recommendations

2. **Traffic Light System to Simulation Engine**:
   - Provide zone classifications for properties
   - Provide market risk indicators
   - Provide appreciation rate forecasts by zone

### API Endpoints

#### Get Zone Classifications

```
GET /api/traffic-light/zones?properties=property_id1,property_id2
```

Response:

```json
{
  "zones": {
    "property_id1": "green",
    "property_id2": "orange"
  }
}
```

#### Get Market Risk Indicators

```
GET /api/traffic-light/market-risk?regions=region_id1,region_id2
```

Response:

```json
{
  "market_risk": {
    "region_id1": {
      "risk_level": "low",
      "risk_score": 2.3,
      "appreciation_forecast": 0.05
    },
    "region_id2": {
      "risk_level": "medium",
      "risk_score": 5.7,
      "appreciation_forecast": 0.03
    }
  }
}
```

#### Send Portfolio Allocation Recommendations

```
POST /api/traffic-light/recommendations
```

Request:

```json
{
  "portfolio_id": "portfolio_456",
  "recommendations": {
    "green_zone_allocation": 0.7,
    "orange_zone_allocation": 0.25,
    "red_zone_allocation": 0.05,
    "region_allocations": {
      "region_id1": 0.4,
      "region_id2": 0.6
    }
  }
}
```

### WebSocket Events

#### Zone Classification Updates

```json
{
  "event": "zone_classification_updated",
  "data": {
    "property_id": "property_id1",
    "old_zone": "green",
    "new_zone": "orange",
    "reason": "Market conditions deteriorated"
  }
}
```

#### Market Risk Updates

```json
{
  "event": "market_risk_updated",
  "data": {
    "region_id": "region_id1",
    "old_risk_level": "low",
    "new_risk_level": "medium",
    "risk_score": 4.2,
    "appreciation_forecast": 0.04
  }
}
```

## Portfolio Management System Integration

The Portfolio Management System manages the current portfolio composition and performance metrics.

### Data Flow

1. **Simulation Engine to PMS**:
   - Request current portfolio composition
   - Request performance metrics
   - Send optimization recommendations
   - Send rebalancing suggestions

2. **PMS to Simulation Engine**:
   - Provide current portfolio composition
   - Provide performance metrics
   - Notify of portfolio changes

### API Endpoints

#### Get Portfolio Composition

```
GET /api/pms/portfolios/{portfolio_id}/composition
```

Response:

```json
{
  "portfolio_id": "portfolio_456",
  "loans": [
    {
      "id": "loan_1",
      "loan_amount": 250000,
      "property_value": 500000,
      "ltv": 0.5,
      "zone": "green",
      "appreciation_rate": 0.05,
      "origination_year": 0,
      "exit_year": 5
    }
    // More loans...
  ],
  "metrics": {
    "total_initial_value": 200000000,
    "total_loan_amount": 100000000,
    "average_ltv": 0.5,
    "weighted_appreciation_rate": 0.04
  }
}
```

#### Get Performance Metrics

```
GET /api/pms/portfolios/{portfolio_id}/metrics
```

Response:

```json
{
  "portfolio_id": "portfolio_456",
  "metrics": {
    "irr": 0.12,
    "equity_multiple": 2.1,
    "roi": 1.1,
    "sharpe_ratio": 1.5,
    "sortino_ratio": 2.2,
    "var_95": 0.08
  },
  "historical_performance": [
    {
      "date": "2023-01-01",
      "nav": 100000000,
      "distributions": 0,
      "contributions": 100000000
    },
    {
      "date": "2023-02-01",
      "nav": 101000000,
      "distributions": 0,
      "contributions": 0
    }
    // More periods...
  ]
}
```

#### Send Optimization Recommendations

```
POST /api/pms/portfolios/{portfolio_id}/recommendations
```

Request:

```json
{
  "optimization_id": "optimization_123",
  "recommendations": {
    "target_allocation": {
      "green": 0.7,
      "orange": 0.25,
      "red": 0.05
    },
    "expected_metrics": {
      "irr": 0.14,
      "equity_multiple": 2.3,
      "roi": 1.3,
      "sharpe_ratio": 1.8
    },
    "actions": [
      {
        "action_type": "increase_allocation",
        "zone": "green",
        "amount": 10000000
      },
      {
        "action_type": "decrease_allocation",
        "zone": "orange",
        "amount": 5000000
      },
      {
        "action_type": "decrease_allocation",
        "zone": "red",
        "amount": 5000000
      }
    ]
  }
}
```

### WebSocket Events

#### Portfolio Updated

```json
{
  "event": "portfolio_updated",
  "data": {
    "portfolio_id": "portfolio_456",
    "update_type": "loan_added",
    "loan": {
      "id": "loan_10",
      "loan_amount": 300000,
      "property_value": 600000,
      "ltv": 0.5,
      "zone": "green"
    }
  }
}
```

#### Performance Metrics Updated

```json
{
  "event": "metrics_updated",
  "data": {
    "portfolio_id": "portfolio_456",
    "metrics": {
      "irr": 0.13,
      "equity_multiple": 2.2,
      "roi": 1.2
    }
  }
}
```

## Underwriting System Integration

The Underwriting System evaluates loan applications and makes lending decisions.

### Data Flow

1. **Simulation Engine to Underwriting System**:
   - Send risk assessments
   - Send optimal loan characteristics
   - Send portfolio impact analysis

2. **Underwriting System to Simulation Engine**:
   - Provide loan parameters
   - Request portfolio impact analysis
   - Notify of new loan approvals

### API Endpoints

#### Get Loan Parameters

```
GET /api/underwriting/loans/{loan_id}/parameters
```

Response:

```json
{
  "loan_id": "loan_1",
  "property_value": 500000,
  "requested_loan_amount": 250000,
  "requested_ltv": 0.5,
  "property_zone": "green",
  "property_region": "region_id1",
  "borrower_credit_score": 750,
  "property_type": "single_family"
}
```

#### Send Portfolio Impact Analysis

```
POST /api/underwriting/loans/{loan_id}/portfolio-impact
```

Request:

```json
{
  "analysis_id": "analysis_123",
  "portfolio_id": "portfolio_456",
  "impact": {
    "portfolio_metrics_before": {
      "irr": 0.12,
      "equity_multiple": 2.1,
      "roi": 1.1,
      "sharpe_ratio": 1.5
    },
    "portfolio_metrics_after": {
      "irr": 0.125,
      "equity_multiple": 2.15,
      "roi": 1.15,
      "sharpe_ratio": 1.55
    },
    "risk_impact": {
      "var_change": 0.002,
      "concentration_risk_change": -0.01,
      "diversification_benefit": 0.005
    },
    "recommendation": {
      "approve": true,
      "recommended_loan_amount": 250000,
      "recommended_ltv": 0.5,
      "confidence_score": 0.85
    }
  }
}
```

### WebSocket Events

#### Loan Application Submitted

```json
{
  "event": "loan_application_submitted",
  "data": {
    "loan_id": "loan_1",
    "property_value": 500000,
    "requested_loan_amount": 250000,
    "property_zone": "green"
  }
}
```

#### Loan Approved

```json
{
  "event": "loan_approved",
  "data": {
    "loan_id": "loan_1",
    "approved_loan_amount": 250000,
    "approved_ltv": 0.5,
    "terms": {
      "interest_rate": 0.05,
      "term": 10,
      "origination_fee": 7500
    }
  }
}
```

## Authentication and Authorization

All integrations use OAuth 2.0 for authentication and authorization:

1. **Client Credentials Flow**:
   - Used for server-to-server communication
   - Obtain access token using client ID and secret
   - Include token in Authorization header

2. **Scopes**:
   - `traffic-light:read` - Read access to Traffic Light System
   - `traffic-light:write` - Write access to Traffic Light System
   - `pms:read` - Read access to Portfolio Management System
   - `pms:write` - Write access to Portfolio Management System
   - `underwriting:read` - Read access to Underwriting System
   - `underwriting:write` - Write access to Underwriting System

### Example: Obtaining Access Token

```
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=your_client_id&
client_secret=your_client_secret&
scope=traffic-light:read pms:read
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "traffic-light:read pms:read"
}
```

## Data Synchronization

Data synchronization between systems follows these patterns:

1. **Real-time Updates**:
   - WebSocket events for immediate notifications
   - Event-driven architecture for real-time processing

2. **Batch Synchronization**:
   - Scheduled jobs for large data transfers
   - Incremental updates based on timestamps

3. **Change Data Capture**:
   - Track changes in source systems
   - Propagate only changed data to target systems

### Synchronization Strategy

1. **Initial Load**:
   - Full data load during system initialization
   - Establish baseline for incremental updates

2. **Incremental Updates**:
   - Real-time events for critical changes
   - Periodic polling for non-critical updates
   - Conflict resolution for concurrent modifications

3. **Reconciliation**:
   - Daily reconciliation process
   - Detect and resolve data inconsistencies

## Error Handling

Integration error handling follows these principles:

1. **Retry Logic**:
   - Exponential backoff for transient errors
   - Circuit breaker pattern for persistent failures

2. **Error Logging**:
   - Detailed error logging with context
   - Correlation IDs across systems

3. **Fallback Mechanisms**:
   - Graceful degradation when integrations fail
   - Cached data as fallback

4. **Monitoring and Alerting**:
   - Real-time monitoring of integration health
   - Alerts for critical failures

### Error Response Format

```json
{
  "error": {
    "code": "integration_error",
    "message": "Failed to retrieve data from Traffic Light System",
    "details": {
      "service": "traffic-light",
      "endpoint": "/api/traffic-light/zones",
      "status_code": 503,
      "retry_after": 60
    },
    "correlation_id": "corr_123456"
  }
}
```

## Implementation Examples

### Traffic Light System Integration Example

```javascript
// traffic-light-integration.js

const axios = require('axios');
const WebSocket = require('ws');
const { getAccessToken } = require('./auth-service');

class TrafficLightIntegration {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.wsUrl = config.wsUrl;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.eventHandlers = new Map();
    this.ws = null;
  }
  
  async initialize() {
    await this.connectWebSocket();
  }
  
  async getZoneClassifications(propertyIds) {
    try {
      const token = await getAccessToken(this.clientId, this.clientSecret, 'traffic-light:read');
      
      const response = await axios.get(`${this.baseUrl}/api/traffic-light/zones`, {
        params: {
          properties: propertyIds.join(',')
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data.zones;
    } catch (error) {
      console.error('Error getting zone classifications:', error);
      throw new Error('Failed to retrieve zone classifications');
    }
  }
  
  async getMarketRiskIndicators(regionIds) {
    try {
      const token = await getAccessToken(this.clientId, this.clientSecret, 'traffic-light:read');
      
      const response = await axios.get(`${this.baseUrl}/api/traffic-light/market-risk`, {
        params: {
          regions: regionIds.join(',')
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data.market_risk;
    } catch (error) {
      console.error('Error getting market risk indicators:', error);
      throw new Error('Failed to retrieve market risk indicators');
    }
  }
  
  async sendPortfolioAllocationRecommendations(portfolioId, recommendations) {
    try {
      const token = await getAccessToken(this.clientId, this.clientSecret, 'traffic-light:write');
      
      const response = await axios.post(`${this.baseUrl}/api/traffic-light/recommendations`, {
        portfolio_id: portfolioId,
        recommendations
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending portfolio allocation recommendations:', error);
      throw new Error('Failed to send portfolio allocation recommendations');
    }
  }
  
  async connectWebSocket() {
    try {
      const token = await getAccessToken(this.clientId, this.clientSecret, 'traffic-light:read');
      
      this.ws = new WebSocket(`${this.wsUrl}?token=${token}`);
      
      this.ws.on('open', () => {
        console.log('Connected to Traffic Light WebSocket');
        this.ws.send(JSON.stringify({
          event: 'subscribe',
          data: {
            channel: 'zone_updates'
          }
        }));
      });
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          
          if (this.eventHandlers.has(message.event)) {
            const handlers = this.eventHandlers.get(message.event);
            handlers.forEach(handler => handler(message.data));
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
      
      this.ws.on('close', () => {
        console.log('Disconnected from Traffic Light WebSocket');
        // Reconnect after delay
        setTimeout(() => this.connectWebSocket(), 5000);
      });
      
      this.ws.on('error', (error) => {
        console.error('Traffic Light WebSocket error:', error);
        this.ws.close();
      });
    } catch (error) {
      console.error('Error connecting to Traffic Light WebSocket:', error);
      // Retry after delay
      setTimeout(() => this.connectWebSocket(), 5000);
    }
  }
  
  onEvent(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    
    this.eventHandlers.get(eventName).add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventName);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }
  
  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

module.exports = TrafficLightIntegration;
```

### Usage Example

```javascript
const TrafficLightIntegration = require('./traffic-light-integration');

async function main() {
  const trafficLightIntegration = new TrafficLightIntegration({
    baseUrl: 'https://traffic-light.equihome.com',
    wsUrl: 'wss://traffic-light.equihome.com/ws',
    clientId: 'your_client_id',
    clientSecret: 'your_client_secret'
  });
  
  await trafficLightIntegration.initialize();
  
  // Subscribe to zone classification updates
  trafficLightIntegration.onEvent('zone_classification_updated', (data) => {
    console.log('Zone classification updated:', data);
    // Update local data and trigger simulation if needed
  });
  
  // Get zone classifications
  const propertyIds = ['property_id1', 'property_id2'];
  const zones = await trafficLightIntegration.getZoneClassifications(propertyIds);
  console.log('Zone classifications:', zones);
  
  // Get market risk indicators
  const regionIds = ['region_id1', 'region_id2'];
  const marketRisk = await trafficLightIntegration.getMarketRiskIndicators(regionIds);
  console.log('Market risk indicators:', marketRisk);
  
  // Send portfolio allocation recommendations
  const portfolioId = 'portfolio_456';
  const recommendations = {
    green_zone_allocation: 0.7,
    orange_zone_allocation: 0.25,
    red_zone_allocation: 0.05,
    region_allocations: {
      region_id1: 0.4,
      region_id2: 0.6
    }
  };
  
  const result = await trafficLightIntegration.sendPortfolioAllocationRecommendations(
    portfolioId,
    recommendations
  );
  console.log('Recommendations sent:', result);
}

main().catch(console.error);
```
