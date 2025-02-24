const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

async function connectDB() {
  await mongoClient.connect();
  db = mongoClient.db("emaildb");
  console.log("Connected to MongoDB");
}
connectDB();

app.get("/api/emails", async (req, res) => {
  const emails = await db.collection("emails").find().sort({ date: -1 }).toArray();
  res.json(emails);
});

app.listen(5000, () => console.log("Server running on port 5000"));
