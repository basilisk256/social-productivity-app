import React, { useState } from 'react';
import { HfInference } from '@huggingface/inference';
import './TaskRater.css';

const TaskRater = () => {
  const [taskInput, setTaskInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(null);
  const [error, setError] = useState('');

  // Initialize Hugging Face Inference
  const hf = new HfInference(process.env.REACT_APP_HF_TOKEN);

  const rateTask = async () => {
    if (!taskInput.trim()) {
      setError('Please enter a task to rate');
      return;
    }

    if (!process.env.REACT_APP_HF_TOKEN || process.env.REACT_APP_HF_TOKEN === 'your_hf_token_here') {
      setError('Hugging Face token not configured. Please add your token to .env file.');
      return;
    }

    setIsLoading(true);
    setError('');
    setRating(null);

    try {
      // Use a text generation model for task rating
      const prompt = `Rate this task 1-10 for long-term value and impact, then provide a brief explanation (max 100 words):

Task: "${taskInput}"

Please respond in this exact format:
Rating: [1-10]
Explanation: [your explanation]`;

      const response = await hf.textGeneration({
        model: 'gpt2', // Using GPT-2 as it's available in free tier
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
          do_sample: true,
          return_full_text: false
        }
      });

      const generatedText = response.generated_text;
      console.log('Raw API response:', generatedText);
      
      // Parse the response to extract rating and explanation
      const ratingMatch = generatedText.match(/Rating:\s*(\d+)/);
      const explanationMatch = generatedText.match(/Explanation:\s*(.+)/);
      
      if (ratingMatch && explanationMatch) {
        const score = parseInt(ratingMatch[1]);
        if (score >= 1 && score <= 10) {
          setRating({
            score: score,
            explanation: explanationMatch[1].trim()
          });
        } else {
          throw new Error('Invalid rating score received');
        }
      } else {
        // Fallback: try to extract just the rating number
        const numberMatch = generatedText.match(/(\d+)/);
        if (numberMatch) {
          const score = parseInt(numberMatch[1]);
          if (score >= 1 && score <= 10) {
            setRating({
              score: score,
              explanation: generatedText.trim()
            });
          } else {
            throw new Error('Invalid rating score in fallback parsing');
          }
        } else {
          // Last resort: show the raw response
          setRating({
            score: 'N/A',
            explanation: `Raw response: ${generatedText.trim()}`
          });
        }
      }
    } catch (err) {
      console.error('Hugging Face API Error:', err);
      if (err.message.includes('401')) {
        setError('Invalid API token. Please check your Hugging Face token.');
      } else if (err.message.includes('429')) {
        setError('Rate limit exceeded. Please wait a moment and try again.');
      } else if (err.message.includes('500')) {
        setError('Hugging Face service temporarily unavailable. Please try again later.');
      } else {
        setError(`Failed to rate task: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingColor = (score) => {
    if (score >= 8) return '#4caf50'; // Green for high value
    if (score >= 6) return '#ff9800'; // Orange for medium value
    if (score >= 4) return '#ffc107'; // Yellow for low-medium value
    return '#f44336'; // Red for low value
  };

  const getRatingLabel = (score) => {
    if (score >= 8) return 'HIGH VALUE';
    if (score >= 6) return 'MEDIUM VALUE';
    if (score >= 4) return 'LOW-MEDIUM VALUE';
    return 'LOW VALUE';
  };

  return (
    <div className="task-rater">
      <div className="rater-header">
        <h2>AI TASK RATER</h2>
        <p>Get instant AI-powered ratings for your tasks using Hugging Face (Free Tier)</p>
      </div>

      <div className="rater-form">
        <div className="input-group">
          <textarea
            placeholder="Describe your task here... (e.g., 'Read 30 pages of a business book' or 'Organize my email inbox')"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            className="task-input"
            rows="4"
          />
        </div>

        <button 
          onClick={rateTask} 
          disabled={isLoading || !taskInput.trim()}
          className="rate-btn"
        >
          {isLoading ? 'RATING...' : 'RATE TASK'}
        </button>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

      {rating && (
        <div className="rating-result">
          <div className="rating-header">
            <h3>AI RATING</h3>
          </div>
          
          <div className="rating-score">
            <div 
              className="score-circle"
              style={{ borderColor: getRatingColor(rating.score) }}
            >
              <span className="score-number">{rating.score}</span>
              <span className="score-label">{getRatingLabel(rating.score)}</span>
            </div>
          </div>

          <div className="rating-explanation">
            <h4>EXPLANATION</h4>
            <p>{rating.explanation}</p>
          </div>

          <div className="rating-insights">
            <h4>INSIGHTS</h4>
            <div className="insights-grid">
              <div className="insight-item">
                <span className="insight-icon">🎯</span>
                <span className="insight-text">Focus on high-value tasks (7-10)</span>
              </div>
              <div className="insight-item">
                <span className="insight-icon">⚡</span>
                <span className="insight-text">Consider impact vs. effort ratio</span>
              </div>
              <div className="insight-item">
                <span className="insight-icon">🚀</span>
                <span className="insight-text">Prioritize long-term growth</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rater-tips">
        <h4>PRO TIPS</h4>
        <ul>
          <li>Be specific about what you want to accomplish</li>
          <li>Consider the time investment and expected outcomes</li>
          <li>Think about how it fits into your bigger goals</li>
          <li>Use ratings to prioritize your daily tasks</li>
        </ul>
      </div>

      <div className="api-info">
        <h4>ABOUT HUGGING FACE</h4>
        <p>This task rater uses Hugging Face's free inference API. No credit card required!</p>
        <a 
          href="https://huggingface.co/settings/tokens" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hf-link"
        >
          Get your free API token →
        </a>
      </div>
    </div>
  );
};

export default TaskRater;
