/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ============================================
    // LAYER VIOLATIONS
    // ============================================
    {
      name: 'no-core-depends-on-app',
      comment: 'Core framework cannot depend on application code',
      severity: 'error',
      from: { path: '^packages/backend/src/core' },
      to: { path: '^packages/backend/src/(modules|infra)' },
    },
    {
      name: 'no-infra-depends-on-modules',
      comment: 'Infrastructure cannot depend on feature modules',
      severity: 'error',
      from: { path: '^packages/backend/src/infra' },
      to: { path: '^packages/backend/src/modules' },
    },

    // ============================================
    // MODULE ISOLATION
    // ============================================
    {
      name: 'no-cross-module-internals',
      comment: 'Modules must import from other modules only through index.ts',
      severity: 'error',
      from: { path: '^packages/backend/src/modules/([^/]+)/' },
      to: {
        path: '^packages/backend/src/modules/([^/]+)/(?!index\\.ts)',
        pathNot: '^packages/backend/src/modules/$1/', // same module is ok
      },
    },

    // ============================================
    // LAYER DEPENDENCY DIRECTION
    // ============================================
    {
      name: 'no-repository-depends-on-service',
      comment: 'Repository cannot depend on Service (wrong direction)',
      severity: 'error',
      from: { path: '\\.repository\\.ts$' },
      to: { path: '\\.service\\.ts$' },
    },
    {
      name: 'no-repository-depends-on-controller',
      comment: 'Repository cannot depend on Controller',
      severity: 'error',
      from: { path: '\\.repository\\.ts$' },
      to: { path: '\\.controller\\.ts$' },
    },
    {
      name: 'no-service-depends-on-controller',
      comment: 'Service cannot depend on Controller (wrong direction)',
      severity: 'error',
      from: { path: '\\.service\\.ts$' },
      to: { path: '\\.controller\\.ts$' },
    },
    {
      name: 'no-service-depends-on-routes',
      comment: 'Service cannot depend on Routes',
      severity: 'error',
      from: { path: '\\.service\\.ts$' },
      to: { path: '\\.routes\\.ts$' },
    },

    // ============================================
    // FRONTEND/BACKEND ISOLATION
    // ============================================
    {
      name: 'no-frontend-imports-backend',
      comment: 'Frontend cannot import backend code directly',
      severity: 'error',
      from: { path: '^packages/frontend/' },
      to: { path: '^packages/backend/' },
    },
    {
      name: 'no-backend-imports-frontend',
      comment: 'Backend cannot import frontend code',
      severity: 'error',
      from: { path: '^packages/backend/' },
      to: { path: '^packages/frontend/' },
    },

    // ============================================
    // CIRCULAR DEPENDENCIES
    // ============================================
    {
      name: 'no-circular',
      comment: 'No circular dependencies allowed',
      severity: 'error',
      from: {},
      to: { circular: true },
    },

    // ============================================
    // ORPHAN MODULES
    // ============================================
    {
      name: 'no-orphans',
      comment: 'No orphan modules (not imported anywhere)',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$', // dot files
          '\\.d\\.ts$', // TypeScript declaration files
          '(^|/)tsconfig\\.json$',
          'index\\.ts$', // entry points
          '^packages/backend/src/index\\.ts$',
          '^packages/frontend/app/',
          '\\.routes\\.ts$', // routes are entry points
        ],
      },
      to: {},
    },
  ],

  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: [
        '\\.next/',
        'dist/',
        '\\.d\\.ts$',
        'postcss\\.config',
        'next\\.config',
        'tailwind\\.config',
        'eslint\\.config',
      ],
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.base.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/(@[^/]+/[^/]+|[^/]+)',
        theme: {
          graph: {
            splines: 'ortho',
          },
          modules: [
            {
              criteria: { source: '^packages/backend/src/core' },
              attributes: { fillcolor: '#ffcccc' },
            },
            {
              criteria: { source: '^packages/backend/src/infra' },
              attributes: { fillcolor: '#ccffcc' },
            },
            {
              criteria: { source: '^packages/backend/src/modules' },
              attributes: { fillcolor: '#ccccff' },
            },
          ],
        },
      },
    },
  },
};
