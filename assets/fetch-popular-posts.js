const fs = require("fs");
const { BetaAnalyticsDataClient } = require("@google-analytics/data");

const propertyId = process.env.GA_PROPERTY_ID;

const client = new BetaAnalyticsDataClient({
  keyFilename: "ga4-key.json"
});

// Extract post ID only for "real" posts (skip archive paths)
function extractPostIdFromPath(path) {
  // Match /posts/YYYY/MM/slug/
  const match = path.match(/^\/posts\/(\d{4})\/(\d{2})\/[^\/]+\/$/);
  return match ? match[1] : null;
}

async function run() {
  const [response] = await client.runReport({
  property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "365daysAgo", endDate: "today" }],
  dimensions: [{ name: "pagePath" }],
  metrics: [{ name: "screenPageViews" }],
  orderBys: [
    {
      metric: { metricName: "screenPageViews" },
      desc: true
    }
  ],
  limit: 10
});

  const results = [];

  for (const row of response.rows) {
    const path = row.dimensionValues[0].value;

    // Only consider "real post" pages
    if (!path.startsWith("/posts/")) continue;
    if (!/^\/posts\/\d{4}\/\d{2}\/[^\/]+\/$/.test(path)) continue;

    const postId = extractPostIdFromPath(path);
    if (postId) {
      results.push({ path, postId });
    }

    // Stop after 5 posts
    if (results.length >= 5) break;
  }

  fs.mkdirSync("data", { recursive: true });

  fs.writeFileSync(
    "data/popular-posts.json",
    JSON.stringify(results, null, 2)
  );

  console.log("Popular posts updated:", results);
}

run();
