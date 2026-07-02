import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
    ...nextCoreWebVitals,
    ...nextTypescript,
    {
        // Generated / build output — none of it is hand-authored source, so keep
        // it out of linting (matches the gitignored set).
        ignores: [
            "node_modules/**",
            ".next/**",
            ".open-next/**",
            ".wrangler/**",
            "ds-bundle/**",
            ".ds-sync/**",
            "out/**",
            "build/**",
            "src/generated/**",
            "next-env.d.ts",
            "cloudflare-env.d.ts",
        ],
    },
];

export default eslintConfig;
