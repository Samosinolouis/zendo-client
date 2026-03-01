import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  generates: {
    "./src/graphql/types.ts": {
      schema: "http://localhost:4000/graphql",
      plugins: ['typescript', 'typescript-operations'],
    },
  },
};

export default config;
