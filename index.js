// By VishwaGauravIn (https://itsvg.in)

const GenAI = require("@google/generative-ai");
const { TwitterApi } = require("twitter-api-v2");
const SECRETS = require("./SECRETS");

const twitterClient = new TwitterApi({
  appKey: SECRETS.APP_KEY,
  appSecret: SECRETS.APP_SECRET,
  accessToken: SECRETS.ACCESS_TOKEN,
  accessSecret: SECRETS.ACCESS_SECRET,
});

const generationConfig = {
  maxOutputTokens: 400,
};
const genAI = new GenAI.GoogleGenerativeAI(SECRETS.GEMINI_API_KEY);

async function run() {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    generationConfig,
  });

  // Write your prompt here
  const prompt = `
  Generate a tweet under 280 characters that covers one of the following technical topics:
  - AI concepts, trends, or advice
  - General computer science knowledge or programming wisdom
  - JavaScript tips, Python tricks, or debugging advice
  - Frontend development topics (React, CSS, Next.js, etc.)
  - Development pitfalls and how to avoid them
  - Productivity tips for developers or coding advice
  
  The tweet should:
  1. Be concise, clear, and engaging.
  2. Include unique insights, tips, or solutions.
  3. Avoid vagueness and generic statements.
  4. Use plain text with occasional emojis for emphasis (but no hashtags or links).
  
  Write it in an informal, friendly, and encouraging tone suitable for developers of all levels.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  sendTweet(text);
}

run();

async function sendTweet(tweetText) {
  try {
    await twitterClient.v2.tweet(tweetText);
    console.log("Tweet sent successfully!");
  } catch (error) {
    console.error("Error sending tweet:", error);
  }
}
