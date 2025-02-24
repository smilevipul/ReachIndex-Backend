require("dotenv").config();
const Imap = require("imap");
const { simpleParser } = require("mailparser");
const { MongoClient } = require("mongodb");

const { indexEmail } = require("./elasticsearch");

const { categorizeEmail } = require("./aiCategorization");
const { sendSlackNotification, triggerWebhook } = require("./notifications");

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

// Connect to MongoDB
async function connectDB() {
  await mongoClient.connect();
  db = mongoClient.db("emaildb");
  console.log("Connected to MongoDB");
}

const imapConfig = {
  user: process.env.IMAP_USER,
  password: process.env.IMAP_PASSWORD,
  host: process.env.IMAP_HOST,
  port: process.env.IMAP_PORT,
  tls: true,
};

function openInbox(imap) {
  return new Promise((resolve, reject) => {
    imap.openBox("INBOX", false, (err, box) => {
      if (err) reject(err);
      resolve(box);
    });
  });
}

async function processEmail(email) {
  const emailData = {
    from: email.from?.value[0]?.address || "",
    subject: email.subject || "",
    body: email.text || email.html || "",
    date: email.date || new Date(),
  };
  
  await db.collection("emails").insertOne(emailData);
  console.log("Stored email:", emailData.subject);
}

function startIMAP() {
  const imap = new Imap(imapConfig);

  imap.once("ready", async () => {
    console.log("IMAP Connected");
    await openInbox(imap);

    imap.on("mail", (numNewMsgs) => {
      console.log(`New Email Received: ${numNewMsgs}`);

      imap.search(["UNSEEN"], (err, results) => {
        if (err || !results.length) return;

        const fetch = imap.fetch(results, { bodies: "" });
        fetch.on("message", (msg) => {
          let emailData = "";
          msg.on("body", (stream) => {
            stream.on("data", (chunk) => {
              emailData += chunk.toString();
            });
          });

          msg.on("end", async () => {
            const parsed = await simpleParser(emailData);
            await processEmail(parsed);
          });
        });

        fetch.on("end", () => {
          console.log("Email fetch complete.");
        });
      });
    });

    imap.on("error", (err) => {
      console.error("IMAP Error:", err);
    });

    imap.on("end", () => {
      console.log("IMAP Connection Ended. Reconnecting...");
      setTimeout(startIMAP, 5000);
    });

    imap.idle();
  });

  imap.connect();
}

(async () => {
  await connectDB();
  startIMAP();
})();


async function processEmail(email) {

    const category = await categorizeEmail(email.subject, email.body);

    const emailData = {
        from: email.from?.value[0]?.address || "",
        subject: email.subject || "",
        body: email.text || email.html || "",
        date: email.date || new Date(),
        category: category,
      };
    
  
      await db.collection("emails").insertOne(emailData);
      await indexEmail(emailData);
    
      console.log(`Stored email: ${emailData.subject} | Category: ${category}`);
    
      // Send Slack notification & trigger webhook if categorized as "Interested"
      if (category === "Interested") {
        await sendSlackNotification(emailData);
        await triggerWebhook(emailData);
      }
}