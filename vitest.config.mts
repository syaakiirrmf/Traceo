import { defineConfig } from 'vitest/config'

// NOTE: `import.meta.dirname` replaces deprecated `__dirname` (Vite warning).

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx', 'app/**/*.test.ts', 'app/**/*.test.tsx'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': import.meta.dirname,
      // Stub server-only dalam test runtime (package sebenar throw).
      'server-only': `${import.meta.dirname}/test/stubs/server-only.ts`,
    },
  },
})
