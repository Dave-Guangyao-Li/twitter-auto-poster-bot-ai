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
  Generate a unique, engaging tweet about software development, focusing on:
  
  Constraints:
  - Maximum 280 characters
  - Avoid starting with "Remember" or repeating previous tweet structures
  - Use a fresh, dynamic perspective
  - Include a thought-provoking insight or unexpected angle
  
  Possible Approaches (Choose ONE):
  1. A counterintuitive debugging tip
  2. A metaphorical explanation of a complex tech concept
   3. A personal growth lesson from a coding challenge
  4. An unexpected connection between coding and life
  5. A provocative question about software development
  
  Tone:
  - Authentic
  - Slightly witty
  - Professionally conversational
  - Avoid clichés
  
  Goal: Spark curiosity, provoke thought, or offer a unique perspective on tech and development.
  
  Example Styles (But Don't Copy):
  - "What if bugs are actually... opportunities in disguise? 🐞🚀"
  - "Code is poetry written in logic. Some lines sing, some whisper. 💻✨"
  
  Bonus: Subtle emoji use is encouraged, but don't overdo it.
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
