  import type { Config } from "prettier";
 

const config: Config = {
    trailingComma: "all",
    tabWidth: 4,
    printWidth: 120,
    endOfLine: "lf",
    plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
