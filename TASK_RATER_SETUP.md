# Hugging Face Task Rater Setup

## 🚀 Quick Start

### 1. Get Your Free Hugging Face Token

1. Go to [Hugging Face](https://huggingface.co/)
2. Create a free account (no credit card required)
3. Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
4. Click "New token"
5. Give it a name (e.g., "ACME Task Rater")
6. Select "Read" permissions
7. Copy the generated token

### 2. Configure Environment Variables

1. Create a `.env` file in your project root:
```bash
REACT_APP_HF_TOKEN=your_actual_token_here
```

2. Replace `your_actual_token_here` with your actual Hugging Face token

### 3. Restart Your App

```bash
npm start
```

## 🎯 How It Works

The Task Rater uses Hugging Face's free inference API to:

- **Analyze task descriptions** for long-term value and impact
- **Rate tasks 1-10** based on productivity principles
- **Provide explanations** for each rating
- **Offer insights** on task prioritization

## 🔧 Features

- ✅ **Free API** - No credit card required
- ✅ **Instant ratings** - Get AI feedback in seconds
- ✅ **Smart parsing** - Extracts ratings and explanations automatically
- ✅ **Visual feedback** - Color-coded ratings and insights
- ✅ **Mobile responsive** - Works on all devices

## 📱 Usage

1. Navigate to **TASK RATER** in the main menu
2. Enter your task description
3. Click **RATE TASK**
4. Get instant AI rating and explanation
5. Use insights to prioritize your work

## 🎨 Rating System

- **8-10: HIGH VALUE** 🟢 - Focus on these tasks
- **6-7: MEDIUM VALUE** 🟠 - Good for steady progress
- **4-5: LOW-MEDIUM VALUE** 🟡 - Consider effort vs. impact
- **1-3: LOW VALUE** 🔴 - Reconsider or delegate

## 🚨 Troubleshooting

### "Token not configured" error
- Make sure you created a `.env` file
- Verify the token is correct
- Restart your app after adding the token

### "Failed to rate task" error
- Check your internet connection
- Verify your Hugging Face token is valid
- Try again in a few minutes

### Slow responses
- Hugging Face free tier has rate limits
- Wait a few seconds between requests
- Consider upgrading for faster responses

## 🔒 Security Notes

- **Never commit your .env file** to version control
- **Keep your token private** - don't share it publicly
- **Use environment variables** for production deployments

## 🌟 Pro Tips

1. **Be specific** - "Read 30 pages of business book" vs "Read book"
2. **Consider context** - Mention your goals and timeline
3. **Use ratings** to prioritize your daily tasks
4. **Combine with ACME scoring** for comprehensive task evaluation

## 📚 Learn More

- [Hugging Face Documentation](https://huggingface.co/docs)
- [Free Inference API](https://huggingface.co/inference-api)
- [Model Hub](https://huggingface.co/models)

---

**Note:** This integration uses Hugging Face's free tier. For production use or higher rate limits, consider their paid plans.
