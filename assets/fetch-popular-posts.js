const fs = require("fs");
const { BetaAnalyticsDataClient } = require("@google-analytics/data");

const propertyId = process.env.GA_PROPERTY_ID;

const client = new BetaAnalyticsDataClient({
  keyFilename: "ga4-key.json"
});

function extractPostIdFromPath(path) {
  const match = path.match(/\/posts\/(\d+)\/|\/posts\/.*\/index\.html/);
  return match ? match[1] || path : null;
}

async function run() {
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
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

  response.rows.forEach(row => {
    const path = row.dimensionValues[0].value;

    if (!path.includes("/posts/")) return;

    const postId = extractPostIdFromPath(path);

    if (postId) {
      results.push({
        path,
        postId
      });
    }
  });

  fs.mkdirSync("data", { recursive: true });

  fs.writeFileSync(
    "data/popular-posts.json",
    JSON.stringify(results, null, 2)
  );

  console.log("Popular posts updated");
}

run();
