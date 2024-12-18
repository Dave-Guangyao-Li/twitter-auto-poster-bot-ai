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

const TOPIC_CATEGORIES = [
  "Frontend",
  "UX/UI",
  "JavaScript",
  "Python",
  "Backend",
  "Agentic System",
  "Database",
  "Generative AI",
  "Large Language Models",
  "Cloud Computing",
  "DevOps",
  "Machine Learning",
  "Cybersecurity",
  "Mobile Development",
  "Data Science",
  "Blockchain",
  "Artificial Intelligence",
  "Fitness",
  "Personal Development",
  "Productivity",
  "Leadership",
  "Creativity",
  "Motivation",
  "Relationships",
  "Health",
  "Mental Health",
  "Entrepreneurship",
  "ReactJS",
];

function generateDynamicPrompt(topicCategory) {
  return `
Generate a thread about ${topicCategory}.

Guidelines:
- Choose ONE specific, innovative subtopic within ${topicCategory}
- Provide deep, actionable insights
- Be creative and forward-looking

Structural:
- Start with a clear and concise topic
- Follow the thread with a sequence of 3-5 tweets


`;
}

const TOPIC_CONFIGS = TOPIC_CATEGORIES.map(category => ({
  name: category,
  promptGenerator: () => generateDynamicPrompt(category)
}));

let lastSelectedTopicIndex = -1;

function selectTopicWithVariety() {
  const availableTopics = TOPIC_CONFIGS.length;

  // If only one topic exists, return it
  if (availableTopics === 1) return TOPIC_CONFIGS[0];

  let selectedIndex;
  do {
    // Truly random selection
    selectedIndex = Math.floor(Math.random() * availableTopics);
  } while (selectedIndex === lastSelectedTopicIndex && availableTopics > 1);

  lastSelectedTopicIndex = selectedIndex;
  return TOPIC_CONFIGS[selectedIndex];
}

function splitLongTweet(tweet) {
  // If tweet is short enough, return as is
  if (tweet.length <= 280) return [tweet];

  // Split intelligently by sentences
  const sentences = tweet.match(/[^.!?]+[.!?]+/g) || [tweet];
  const tweets = [];
  let currentTweet = '';

  sentences.forEach(sentence => {
    // If adding this sentence would exceed 280, start a new tweet
    if ((currentTweet + sentence).length > 280) {
      tweets.push(currentTweet.trim());
      currentTweet = sentence;
    } else {
      currentTweet += sentence;
    }
  });

  // Add the last tweet
  if (currentTweet.trim()) {
    tweets.push(currentTweet.trim());
  }

  return tweets;
}

async function run(testMode = false) {
  // Select topic dynamically
  const selectedTopic = selectTopicWithVariety();
  console.log(`Selected Topic: ${selectedTopic.name}`);

  // Generate dynamic prompt
  const dynamicPrompt = selectedTopic.promptGenerator();

  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig,
  });

  try {
    const result = await model.generateContent(dynamicPrompt);
    const response = await result.response;
    const fullText = response.text();

    // Process tweets
    const rawTweets = fullText.split('\n')
      .filter(tweet => tweet.trim().length > 0 &&
        !tweet.match(/^(Tweet \d+|Guidelines|Structural|Recommendations)/i))
      .map(tweet => tweet.replace(/\*+/g, '')); // Remove redundant asterisks

    // Flatten tweets that might be longer than 280 characters
    const processedTweets = rawTweets.flatMap(splitLongTweet);

    // Logging for debugging
    console.log(`Generated ${processedTweets.length} tweets`);

    // Log tweets or send as a thread based on mode
    if (testMode) {
      console.log("🧪 Test Mode - Generated Tweets:");
      processedTweets.forEach((tweet, index) => {
        console.log(`Tweet ${index + 1} (${tweet.length} chars):`);
        console.log(tweet);
        console.log('---');
      });
      return processedTweets;
    } else {
      // Send as a thread
      await sendThreadTweet(processedTweets);
      console.log("Tweets sent successfully to X/Twitter");
    }
  } catch (error) {
    console.error("Error generating or sending tweets:", error);
    throw error;
  }
}

// Ensure the script works both as a module and when run directly
if (require.main === module) {
  (async () => {
    try {
      // Run in production mode when executed directly
      await run(false);
    } catch (error) {
      console.error("Script execution failed:", error);
      process.exit(1);
    }
  })();
}
