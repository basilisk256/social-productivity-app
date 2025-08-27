import React, { useState, useEffect } from 'react';
import './CompletionAnimation.css';

const CompletionAnimation = ({ isVisible, onAnimationComplete }) => {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Start animation sequence
      setShowText(true);
      
      // Hide text after 0.8 seconds
      const textTimer = setTimeout(() => {
        setShowText(false);
      }, 800);
      
      // Complete animation after 1.3 seconds (0.8 + 0.5)
      const animationTimer = setTimeout(() => {
        onAnimationComplete();
      }, 1300);
      
      return () => {
        clearTimeout(textTimer);
        clearTimeout(animationTimer);
      };
    }
  }, [isVisible, onAnimationComplete]);

  if (!isVisible) return null;

  return (
    <div className="completion-animation">
      <div className="completion-flash">
        {showText && (
          <div className="completion-text">
            <h1>Task Completed!</h1>
            <p>Great job! Keep up the momentum!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletionAnimation;
