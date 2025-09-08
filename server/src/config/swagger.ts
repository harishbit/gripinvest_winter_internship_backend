import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Grip Invest API',
      version: '1.0.0',
      description: 'Backend API for Grip Invest Platform - Investment Management System',
      contact: {
        name: 'Grip Invest Team',
        email: 'support@gripinvest.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server'
      },
      {
        url: 'https://api.gripinvest.com/api',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Products',
        description: 'Investment products management'
      },
      {
        name: 'Investments',
        description: 'User investments and portfolio management'
      },
      {
        name: 'Logs',
        description: 'System logs and analytics (Admin only)'
      },
      {
        name: 'System',
        description: 'System health and monitoring endpoints'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            riskAppetite: {
              type: 'string',
              enum: ['low', 'moderate', 'high'],
              description: 'User risk tolerance level'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            }
          }
        },
        InvestmentProduct: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Product unique identifier'
            },
            name: {
              type: 'string',
              description: 'Product name'
            },
            investmentType: {
              type: 'string',
              enum: ['bond', 'fd', 'mf', 'etf', 'other'],
              description: 'Type of investment product'
            },
            tenureMonths: {
              type: 'integer',
              description: 'Investment tenure in months'
            },
            annualYield: {
              type: 'number',
              format: 'decimal',
              description: 'Expected annual yield percentage'
            },
            riskLevel: {
              type: 'string',
              enum: ['low', 'moderate', 'high'],
              description: 'Risk level of the product'
            },
            minInvestment: {
              type: 'number',
              format: 'decimal',
              description: 'Minimum investment amount'
            },
            maxInvestment: {
              type: 'number',
              format: 'decimal',
              description: 'Maximum investment amount'
            },
            description: {
              type: 'string',
              description: 'Product description'
            }
          }
        },
        Investment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Investment unique identifier'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User ID who made the investment'
            },
            productId: {
              type: 'string',
              format: 'uuid',
              description: 'Product ID of the investment'
            },
            amount: {
              type: 'number',
              format: 'decimal',
              description: 'Investment amount'
            },
            investedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Investment creation timestamp'
            },
            status: {
              type: 'string',
              enum: ['active', 'matured', 'cancelled'],
              description: 'Investment status'
            },
            expectedReturn: {
              type: 'number',
              format: 'decimal',
              description: 'Expected return amount'
            },
            maturityDate: {
              type: 'string',
              format: 'date-time',
              description: 'Investment maturity date'
            }
          }
        },
        TransactionLog: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Log entry unique identifier'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User ID (if authenticated)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email (if available)'
            },
            endpoint: {
              type: 'string',
              description: 'API endpoint accessed'
            },
            httpMethod: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE'],
              description: 'HTTP method used'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP response status code'
            },
            errorMessage: {
              type: 'string',
              description: 'Error message (if any)'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Log entry timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Detailed error information'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            token: {
              type: 'string',
              description: 'JWT authentication token'
            }
          }
        },
        PortfolioSummary: {
          type: 'object',
          properties: {
            totalInvested: {
              type: 'number',
              format: 'decimal',
              description: 'Total amount invested'
            },
            totalExpectedReturn: {
              type: 'number',
              format: 'decimal',
              description: 'Total expected returns'
            },
            activeInvestmentsCount: {
              type: 'integer',
              description: 'Number of active investments'
            },
            averageYield: {
              type: 'number',
              format: 'decimal',
              description: 'Average yield percentage'
            },
            riskDistribution: {
              type: 'object',
              additionalProperties: {
                type: 'number'
              },
              description: 'Risk distribution breakdown'
            },
            typeDistribution: {
              type: 'object',
              additionalProperties: {
                type: 'number'
              },
              description: 'Investment type distribution'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts'], // Path to the API route files
};

const specs = swaggerJSDoc(options);

export { specs, swaggerUi };
