import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({
    // Uncomment to enable R2 cache,
    // It should be imported as:
    // `import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";`
    // See https://opennext.js.org/cloudflare/caching for more details
    // incrementalCache: r2IncrementalCache,
});

// Minify the server bundle so the Worker stays under Cloudflare's size limit
// (3 MiB gzipped on the free plan).
// config.default.minify = true;

export default config;
