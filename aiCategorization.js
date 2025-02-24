const { OpenAI } = require("openai");

const openai = new OpenAI({ apiKey: "YOUR_OPENAI_API_KEY" });

async function categorizeEmail(subject, body) {
  const prompt = `Categorize this email into one of the labels: Interested, Meeting Booked, Not Interested, Spam, Out of Office. 
  Subject: "${subject}" 
  Body: "${body}" 
  Label:`;

  const response = await openai.completions.create({
    model: "gpt-4",
    prompt: prompt,
    max_tokens: 10,
  });

  return response.choices[0].text.trim();
}

module.exports = { categorizeEmail };
