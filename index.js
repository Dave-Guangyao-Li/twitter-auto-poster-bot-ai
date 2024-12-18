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

async function run(testMode = false) {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig,
  });

  const prompt = `
Advanced Technical Discourse Generator - Multi-Shot Approach

Objective: Create a technically sophisticated, multi-tweet thread exploring a cutting-edge software engineering concept.

Thread Structure Guidelines:
1. Thread Opener (Tweet 1):
   - Provocative thesis or core concept
   - Capture attention with a bold technical insight
   - Set the stage for deeper exploration

2. Subsequent Tweets:
   - Each tweet should focus on a specific subtopic
   - Provide concrete technical insights
   - Use precise, jargon-appropriate language
   - Avoid redundant headers or numbering

Focus Areas (CHOOSE ONE):
1. Frontend Engineering Best Practices
2. Generative AI & Large Language Models concepts and trends
3. Modern JavaScript/React features
4. Python Advanced Techniques

Specific Requirements:
- Maximum 280 characters per tweet
- Technical depth over breadth
- No redundant headers like "Tweet 1:" or "Tweet 2:"
- Maintain a cohesive narrative across tweets
- Target senior developers and tech enthusiasts

Tone:
- Authoritative
- Analytical
- Intellectually rigorous
- Precise technical communication

Subtopic Exploration Strategy:
- 1: Overarching concept
- 2: Technical mechanism
- 3: Implementation insights
- 4: Advanced implications
- 5: Future trends or critical analysis

Example Thread Structure (DO NOT COPY):
1: "Reactive programming paradigms are transforming how we conceptualize state management in modern web applications."
2: "Key mechanism: Unidirectional data flow ensures predictable state transitions and simplifies complex UI interactions."
3: "Implementation: Leverage RxJS observables to create composable, declarative data streams that react to user events."
4: "Advanced pattern: Combine reactive streams with memoization to optimize performance in real-time data synchronization."
5: "Future outlook: Reactive programming will be integral to building scalable, responsive, and maintainable frontend architectures."

Desired Outcome:
Generate a technically precise, engaging thread that provides deep insights into a sophisticated software engineering concept.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const fullText = response.text();

  // Split text into thread-friendly tweets
  const tweets = fullText.split('\n')
    .filter(tweet => tweet.trim().length > 0 && !tweet.startsWith('Tweet '))
    .map(tweet => tweet.length > 280
      ? tweet.substring(0, 277) + '...'
      : tweet
    )
  // .slice(0, 5);  // Limit to 5 tweets max

  // Log tweets or send as a thread based on mode
  if (testMode) {
    console.log("🧪 Test Mode - Generated Tweets:");
    tweets.forEach((tweet, index) => {
      console.log(`Tweet ${index + 1} (${tweet.length} chars):`);
      console.log(tweet);
      console.log('---');
    });
    return tweets;
  } else {
    // Send as a thread
    await sendThreadTweet(tweets);
  }
}

// Allow local testing
if (require.main === module) {
  (async () => {
    await run(true);  // Run in test mode
  })();
}
