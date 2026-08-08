import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

// Two projects: API-route/domain tests run under Node (Next route handlers
// use the Web Fetch API via Node/undici globals — Request/Response/Headers
// — not jsdom), component tests run under jsdom. Jest's `projects` entries
// don't inherit config from a parent, so each is wrapped through
// next/jest's createJestConfig() individually (SWC transform, .env
// loading, CSS/image mocking) rather than sharing one wrapped object.
export default async () => {
  const nodeProject = await createJestConfig({
    displayName: "node",
    testEnvironment: "node",
    testMatch: [
      "<rootDir>/src/domain/**/*.test.ts",
      "<rootDir>/src/application/**/*.test.ts",
      "<rootDir>/src/infrastructure/**/*.test.ts",
      "<rootDir>/app/api/**/*.test.ts",
    ],
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/src/$1",
    },
  })();

  const jsdomProject = await createJestConfig({
    displayName: "jsdom",
    testEnvironment: "jsdom",
    testMatch: [
      "<rootDir>/src/presentation/**/*.test.ts",
      "<rootDir>/src/presentation/**/*.test.tsx",
    ],
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/src/$1",
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  })();

  // next-intl/use-intl ship pure ESM in node_modules. next/jest only lets
  // custom config APPEND to its default transformIgnorePatterns (see its
  // source), so a project-level `transformIgnorePatterns` override above
  // can't un-ignore anything the default pattern already ignores — it has
  // to be replaced outright here, after createJestConfig() has resolved.
  jsdomProject.transformIgnorePatterns = [
    "/node_modules/(?!(next-intl|use-intl|@formatjs|intl-messageformat)/)",
  ];

  return {
    coverageProvider: "v8" as const,
    projects: [nodeProject, jsdomProject],
  };
};
