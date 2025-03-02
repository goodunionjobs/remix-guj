import type { KnipConfig } from 'knip'

export default {
	entry: ['server/index.js', 'app/**/*.test.ts', 'app/**/*.test.tsx'],
	ignore: ['types/**/*.d.ts'],
	remix: { config: 'remix.config.mjs' },
	rules: {
		binaries: 'error',
		classMembers: 'error',
		dependencies: 'error',
		devDependencies: 'error',
		duplicates: 'error',
		enumMembers: 'error',
		exports: 'error',
		files: 'error',
		nsExports: 'error',
		nsTypes: 'error',
		types: 'error',
		unlisted: 'error',
		unresolved: 'error',
	},
} satisfies KnipConfig
