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
Generate an engaging, original thread about ${topicCategory}.

Core Guidelines:
- Choose a specific, non-obvious aspect of ${topicCategory}
- Create 3-5 connected tweets that tell a compelling story
- Each tweet should spark curiosity and drive engagement
- Keep each tweet under 280 characters
- Add 1-2 relevant hashtags naturally within or at the end

Writing Style:
- Avoid cliché openings ("Ever notice...", "What if...", "Here's why...")
- Skip formulaic endings ("So next time...", "Remember to...")
- Write naturally, as if explaining to a colleague
- Vary sentence structure and rhythm
- Use concrete examples and metaphors organically
- Keep technical depth while staying conversational

Narrative Techniques:
- Open with a bold statement, insight, or observation
- Build tension or curiosity through the thread
- End with insight that feels earned, not prescriptive
- Connect ideas smoothly without forced transitions
- Mix technical depth with relatable context

Anti-Patterns to Avoid:
- No rhetorical questions as openers
- Avoid "Ever feel like..." or similar starts
- Skip predictable "So next time..." conclusions
- Don't use numbered tweet formats (1/4, etc.)
- Avoid overused transition phrases

Remember: Write with authenticity and insight. Make each tweet feel fresh and original, as if part of a natural conversation among experts.
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
    generationConfig: {
      maxOutputTokens: 400,
      temperature: 0.95,    // Even more creativity
      topP: 0.97,          // Broader vocabulary
      topK: 60,            // More word choices
      candidateCount: 2,    // Generate multiple options
    },
  });

  try {
    const result = await model.generateContent(dynamicPrompt);
    const response = await result.response;
    const fullText = response.text();

    // Process tweets
    let processedTweets = fullText.split('\n')
      .filter(tweet => tweet.trim().length > 0 &&
        !tweet.match(/^(Tweet \d+|Guidelines|Style|Structural|Recommendations|Structure|\d+\.|Remember:)/i))
      .map(tweet => {
        // Clean up the tweet
        let cleaned = tweet
          .replace(/\*+/g, '')  // Remove asterisks
          .replace(/^\d+\/\d+\s+/, '')  // Remove tweet numbering
          .replace(/^Tweet \d+:\s*/i, '')  // Remove "Tweet X:" format
          .replace(/^The future of\s+/i, '')  // Remove "The future of" starts
          .trim();

        // Ensure no more than 2 hashtags per tweet
        const hashtags = cleaned.match(/#\w+/g) || [];
        if (hashtags.length > 2) {
          // Remove all hashtags first
          cleaned = cleaned.replace(/#\w+/g, '').trim();
          // Add back only the first two hashtags at the end
          cleaned = cleaned + ' ' + hashtags.slice(0, 2).join(' ');
        }

        return cleaned.trim();
      })
      .filter(tweet => tweet.length <= 280 && tweet.length > 0);  // Only keep valid tweets

    // Ensure we have at least 3 tweets but no more than 5
    if (processedTweets.length < 3) {
      console.log("Generated thread too short, retrying...");
      return run(testMode);
    }

    // Take first 5 tweets if we have more
    processedTweets = processedTweets.slice(0, 5);

    // Logging for debugging
    console.log(`Generated ${processedTweets.length} tweets`);

    if (testMode) {
      console.log("🧪 Test Mode - Generated Tweets:");
      processedTweets.forEach((tweet, index) => {
        console.log(`Tweet ${index + 1} (${tweet.length} chars):`);
        console.log(tweet);
        console.log('---');
      });
      return processedTweets;
    } else {
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
