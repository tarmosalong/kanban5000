import { writeFileSync } from 'fs';
import { z } from 'zod';

import {
  AuthController,
  AuthService,
  AuthRepository,
  JwtService,
  createAuthRoutes,
} from '../src/modules/auth/index.js';
import {
  WorkspaceController,
  WorkspaceService,
  WorkspaceRepository,
  createWorkspaceRoutes,
} from '../src/modules/workspace/index.js';
import type { RouteDefinition } from '../src/core/index.js';

// Mock dependencies for route collection
const mockDb = {} as any;
const mockJwtService = {} as any;
const mockAuthRepo = {} as any;
const mockAuthService = {} as any;
const mockWorkspaceRepo = {} as any;

// Create controllers with mock dependencies
const authController = new AuthController(mockAuthService);
const workspaceController = new WorkspaceController({} as any);

// Collect all routes
const routes: RouteDefinition[] = [
  ...createAuthRoutes(authController),
  ...createWorkspaceRoutes(workspaceController),
];

// Convert Zod schema to JSON Schema (simplified)
function zodToJsonSchema(schema: z.ZodType<any>): any {
  const def = schema._def;
  
  if (def.typeName === 'ZodString') {
    const result: any = { type: 'string' };
    if (def.checks) {
      for (const check of def.checks) {
        if (check.kind === 'uuid') result.format = 'uuid';
        if (check.kind === 'email') result.format = 'email';
        if (check.kind === 'url') result.format = 'uri';
        if (check.kind === 'min') result.minLength = check.value;
        if (check.kind === 'max') result.maxLength = check.value;
      }
    }
    return result;
  }
  
  if (def.typeName === 'ZodNumber') {
    return { type: 'number' };
  }
  
  if (def.typeName === 'ZodBoolean') {
    return { type: 'boolean' };
  }
  
  if (def.typeName === 'ZodArray') {
    return {
      type: 'array',
      items: zodToJsonSchema(def.type),
    };
  }
  
  if (def.typeName === 'ZodObject') {
    const properties: any = {};
    const required: string[] = [];
    
    for (const [key, value] of Object.entries(def.shape())) {
      properties[key] = zodToJsonSchema(value as z.ZodType<any>);
      
      // Check if required
      const valueDef = (value as any)._def;
      if (valueDef.typeName !== 'ZodOptional' && valueDef.typeName !== 'ZodNullable') {
        required.push(key);
      }
    }
    
    return {
      type: 'object',
      properties,
      ...(required.length > 0 && { required }),
    };
  }
  
  if (def.typeName === 'ZodOptional') {
    return zodToJsonSchema(def.innerType);
  }
  
  if (def.typeName === 'ZodNullable') {
    const inner = zodToJsonSchema(def.innerType);
    return { ...inner, nullable: true };
  }
  
  if (def.typeName === 'ZodEnum') {
    return {
      type: 'string',
      enum: def.values,
    };
  }
  
  if (def.typeName === 'ZodEffects') {
    return zodToJsonSchema(def.schema);
  }
  
  // Default fallback
  return {};
}

// Generate OpenAPI spec
function generateOpenApiSpec(): any {
  const spec: any = {
    openapi: '3.0.3',
    info: {
      title: 'Kanban5000 API',
      version: '0.1.0',
      description: 'A fast, minimal, developer-friendly issue tracker',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {},
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Workspaces', description: 'Workspace management' },
    ],
  };

  for (const route of routes) {
    const path = '/api' + route.path.replace(/:(\w+)/g, '{$1}');
    
    if (!spec.paths[path]) {
      spec.paths[path] = {};
    }

    const operation: any = {
      summary: route.meta?.summary || '',
      description: route.meta?.description || '',
      operationId: route.meta?.operationId || `${route.method}${route.path.replace(/[/:]/g, '_')}`,
      tags: route.meta?.tags || [],
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: route.responseSchema 
                ? { 
                    type: 'object',
                    properties: {
                      data: zodToJsonSchema(route.responseSchema),
                    },
                  }
                : { type: 'object' },
            },
          },
        },
        '400': {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string' },
                      message: { type: 'string' },
                      details: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden' },
        '404': { description: 'Not found' },
      },
    };

    // Add security for authenticated routes
    if (route.middleware?.some((m) => m.name === 'requireAuth' || m.toString().includes('requireAuth'))) {
      operation.security = [{ bearerAuth: [] }];
    }

    // Add request body
    if (route.bodySchema && ['post', 'put', 'patch'].includes(route.method)) {
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: zodToJsonSchema(route.bodySchema),
          },
        },
      };
    }

    // Add path parameters
    const pathParams = route.path.match(/:(\w+)/g);
    if (pathParams || route.querySchema) {
      operation.parameters = [];
      
      if (pathParams) {
        for (const param of pathParams) {
          const name = param.slice(1);
          operation.parameters.push({
            name,
            in: 'path',
            required: true,
            schema: { type: 'string' },
          });
        }
      }

      // Add query parameters
      if (route.querySchema) {
        const querySchema = zodToJsonSchema(route.querySchema);
        if (querySchema.properties) {
          for (const [name, schema] of Object.entries(querySchema.properties)) {
            operation.parameters.push({
              name,
              in: 'query',
              required: querySchema.required?.includes(name) || false,
              schema,
            });
          }
        }
      }
    }

    spec.paths[path][route.method] = operation;
  }

  return spec;
}

// Generate and write spec
const spec = generateOpenApiSpec();
const outputPath = new URL('../../openapi.json', import.meta.url).pathname;
writeFileSync(outputPath, JSON.stringify(spec, null, 2));
console.log(`OpenAPI spec written to ${outputPath}`);

