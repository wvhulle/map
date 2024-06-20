import path from 'path'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [viteTsconfigPaths()],

	test: {
		coverage: {
			provider: 'istanbul', // or 'c8'
			reporter: ['text', 'json', 'html', 'lcov']
		},
		globals: true,
		hookTimeout: 10000,
		include: ['lib/**/*.spec.ts', 'lib/**/*.test.ts'],

		testTimeout: 10000
	}
})
