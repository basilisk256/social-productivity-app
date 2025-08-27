# ACME - Social Productivity App

A "wins network" that rewards choosing high-leverage, virtuous tasks and faithful builds.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser to:** `http://localhost:3000`

## 🧪 Testing the Core Features

### 1. **Task Creation & Completion**
- Go through onboarding to create your account
- Click "NEW TASK" on the dashboard
- Type a task description (e.g., "Read 30 pages of a book")
- Click "ANALYZE TASK" to get AI suggestions
- Click "CREATE TASK" to save it
- **Check the checkbox** to complete the task and earn points!

### 2. **Build Creation**
- Click "NEW" in the Builds section
- Fill in build name and rule
- Choose build type (Daily, Achievement, Progress)
- Set proof requirements and visibility
- Click "CREATE BUILD" to save

### 3. **Achievement Tracking**
- Navigate to "ACHIEVEMENTS" tab
- See your weekly/monthly progress
- Unlock badges as you complete tasks

### 4. **Leaderboards**
- Check "LEADERBOARDS" to see rankings
- View weekly scores and build counts

## 🔧 Current Features

✅ **Working:**
- User onboarding with Rule of Life weights
- Task creation with AI tiering
- **Notion-style checkbox completion**
- Build creation and management
- Achievement system
- Weekly/monthly scoring
- Profile pictures (auto-generated)
- Leaderboards

🔄 **In Development:**
- Subtasks system
- Email verification
- ID verification for real names
- Build sharing/joining/watching

## 🎯 How Points Work

- **Task Value Score (TVS)** = Tier × Multipliers × Bucket Weight
- **Tiers:** Micro(1), Routine(2), Project Step(5), Milestone(13), Breakthrough(34)
- **Multipliers:** Friction, Dependency, Public Commitment, Rarity, Courage, Integrity
- **Buckets:** Worship, Vocation, Household, Mind, Body, Fellowship

## 🐛 Debug Mode

The app currently logs to console:
- Task creation details
- Task completion events
- Build creation details
- localStorage updates

Open browser DevTools (F12) to see the logs.

## 🎨 Design

- **Theme:** Clean, industrial, red & white
- **Typography:** All caps, monospace fonts
- **Style:** Tom Sachs/NASA aesthetic
- **Task UI:** Notion-style checkboxes

## 📱 Responsive

Works on desktop, tablet, and mobile devices.

---

**Note:** This is a demo version using localStorage. In production, this would connect to a real backend with user authentication and data persistence.