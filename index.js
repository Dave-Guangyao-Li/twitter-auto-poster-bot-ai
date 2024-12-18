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

async function sendThreadTweet(tweetTexts) {
  try {
    let previousTweetId = null;
    for (const [index, text] of tweetTexts.entries()) {
      const tweetOptions = index > 0 ? { reply: { in_reply_to_tweet_id: previousTweetId } } : {};
      const tweet = await twitterClient.v2.tweet(text, tweetOptions);
      previousTweetId = tweet.data.id;
    }
    console.log("Thread sent successfully!");
  } catch (error) {
    console.error("Error sending thread:", error);
  }
}

async function run() {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    generationConfig,
  });

  const prompt = `
Advanced Technical Discourse Generator:

Focus Areas (CHOOSE ONE):
1. Frontend Engineering Paradigms
2. Generative AI & Large Language Models
3. Modern JavaScript/React Best Practices
4. Python Advanced Techniques

Technical Discourse Requirements:
- Provide deep, nuanced technical insights
- Demonstrate advanced understanding
- Avoid surface-level explanations
- Target senior developers and tech enthusiasts

Structural Guidelines:
- Generate content that can be naturally split into a thread
- First tweet: Provocative thesis or core concept
- Subsequent tweets: Detailed exploration, code snippets, or critical analysis
- Maintain technical depth and precision
- No casual language or unnecessary emojis

Tone:
- Authoritative
- Analytical
- Intellectually rigorous
- Precise technical communication

Specific Constraints:
- Maximum 280 characters per tweet
- Prioritize technical accuracy
- Include potential code patterns or architectural insights
- Highlight emerging trends or critical considerations

Example Approach:
"Exploring the architectural evolution of React state management: From Redux to React Query - a paradigm shift in data synchronization strategies."

Desired Outcome:
A technically sophisticated, multi-tweet exploration of a cutting-edge software engineering concept.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const fullText = response.text();

  // Split text into thread-friendly tweets
  const tweets = fullText.split('\n\n')
    .filter(tweet => tweet.trim().length > 0)
    .map(tweet => tweet.length > 280
      ? tweet.substring(0, 277) + '...'
      : tweet
    )
    .slice(0, 5);  // Limit to 5 tweets max

  // Send as a thread
  await sendThreadTweet(tweets);
}

run();
