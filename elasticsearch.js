const { Client } = require("@elastic/elasticsearch");

const esClient = new Client({ node: "http://localhost:9200" });

async function createIndex() {
  const exists = await esClient.indices.exists({ index: "emails" });
  if (!exists) {
    await esClient.indices.create({
      index: "emails",
      body: {
        mappings: {
          properties: {
            from: { type: "text" },
            subject: { type: "text" },
            body: { type: "text" },
            date: { type: "date" },
          },
        },
      },
    });
    console.log("Created Elasticsearch index.");
  }
}

async function indexEmail(email) {
  await esClient.index({
    index: "emails",
    body: email,
  });
  console.log("Indexed email:", email.subject);
}

module.exports = { esClient, createIndex, indexEmail };
