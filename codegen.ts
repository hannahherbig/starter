import type { CodegenConfig } from '@graphql-codegen/cli'
import { ENDPOINT, HEADERS } from './src/config'

const config: CodegenConfig = {
  overwrite: true,
  schema: { [ENDPOINT]: { headers: HEADERS } },
  documents: 'src/**/*.ts',
  generates: {
    'src/gql/': {
      preset: 'client',
      plugins: [],
    },
  },
}

export default config
