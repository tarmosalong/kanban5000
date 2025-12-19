import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        // Core framework - no dependencies on app code
        { type: 'core', pattern: 'src/core/*', capture: ['layer'] },
        
        // Infrastructure - depends only on core
        { type: 'infra', pattern: 'src/infra/*', capture: ['layer'] },
        
        // Feature modules - each module is isolated
        { type: 'module', pattern: 'src/modules/*', capture: ['module'] },
        
        // Module internals
        { type: 'controller', pattern: 'src/modules/*/**.controller.ts' },
        { type: 'service', pattern: 'src/modules/*/**.service.ts' },
        { type: 'repository', pattern: 'src/modules/*/**.repository.ts' },
        { type: 'routes', pattern: 'src/modules/*/**.routes.ts' },
        { type: 'types', pattern: 'src/modules/*/**.types.ts' },
        { type: 'middleware', pattern: 'src/modules/*/**.middleware.ts' },
        
        // Entry point
        { type: 'entry', pattern: 'src/index.ts' },
      ],
    },
    rules: {
      // ============================================
      // MODULARITY RULES (Spring Modulith style)
      // ============================================
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            // Entry point can import anything
            { from: 'entry', allow: ['core', 'infra', 'module'] },

            // Core has NO dependencies (pure framework code)
            { from: 'core', allow: [] },

            // Infra depends only on core
            { from: 'infra', allow: ['core'] },

            // Modules depend on core, infra, and shared types
            { from: 'module', allow: ['core', 'infra'] },
            { from: 'controller', allow: ['core', 'infra', 'service', 'types'] },
            { from: 'service', allow: ['core', 'infra', 'repository', 'types'] },
            { from: 'repository', allow: ['core', 'infra', 'types'] },
            { from: 'routes', allow: ['core', 'controller', 'middleware', 'types'] },
            { from: 'types', allow: ['core'] },
            { from: 'middleware', allow: ['core', 'infra', 'service', 'types'] },
          ],
        },
      ],

      // ============================================
      // CROSS-MODULE BOUNDARY RULES
      // ============================================
      'boundaries/entry-point': [
        'error',
        {
          default: 'disallow',
          rules: [
            // Modules can only be accessed through their index.ts (barrel exports)
            {
              target: 'module',
              allow: 'index.ts',
            },
          ],
        },
      ],

      // Prevent circular dependencies between modules
      'boundaries/no-private': [
        'error',
        {
          allowUncles: false,
        },
      ],

      // ============================================
      // STANDARD TYPESCRIPT RULES
      // ============================================
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.js'],
  }
);
