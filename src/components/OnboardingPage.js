import React, { useState, useRef } from 'react';
import { completeOnboarding } from '../lib/completeOnboarding';
import { auth } from '../lib/firebase';
import './OnboardingPage.css';

const OnboardingPage = ({ onComplete }) => {

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    realName: '',
    birthdate: '',
    handle: '',
    photoFile: null,
    idFile: null,
    idName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();
  const idFileInputRef = useRef();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image must be smaller than 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        photoFile: file
      }));
      setError('');
    }
  };

  const handleIdFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file for ID');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for ID
        setError('ID image must be smaller than 10MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        idFile: file
      }));
      setError('');
    }
  };

  const handleNext = () => {
    if (step === 1 && (!formData.email || !formData.password || !formData.confirmPassword)) {
      setError('Please fill in all account fields');
      return;
    }
    if (step === 1 && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (step === 1 && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (step === 2 && !formData.realName.trim()) {
      setError('Please enter your real name');
      return;
    }
    if (step === 3 && !formData.birthdate) {
      setError('Please select your birthdate');
      return;
    }
    if (step === 4 && !formData.photoFile) {
      setError('Please select a profile photo');
      return;
    }
    if (step === 5 && !formData.idFile) {
      setError('Please upload your ID');
      return;
    }
    if (step === 5 && !formData.idName.trim()) {
      setError('Please enter the name on your ID');
      return;
    }
    if (step === 5 && formData.idName.trim().toLowerCase() !== formData.realName.trim().toLowerCase()) {
      setError('The name on your ID must match your real name exactly');
      return;
    }
    
    setError('');
    if (step < 6) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();               // ✅ don't let the browser navigate
    if (isLoading) return;
    
    // basic validation so we fail fast with a visible message
    if (!formData.email?.trim()) throw new Error("Enter your email address.");
    if (!formData.password?.trim()) throw new Error("Enter your password.");
    if (formData.password !== formData.confirmPassword) throw new Error("Passwords do not match.");
    if (formData.password.length < 6) throw new Error("Password must be at least 6 characters.");
    if (!formData.realName?.trim()) throw new Error("Enter your real name.");
    if (!formData.birthdate) throw new Error("Enter your birthdate.");
    if (!(formData.photoFile instanceof File)) throw new Error("Choose a profile photo (file).");
    if (!formData.idFile) throw new Error("Please upload your ID.");
    if (!formData.idName?.trim()) throw new Error("Please enter the name on your ID.");
    if (formData.idName.trim().toLowerCase() !== formData.realName.trim().toLowerCase()) {
      throw new Error("The name on your ID must match your real name exactly");
    }

    // Age validation (must be 13 or older)
    const birthDate = new Date(formData.birthdate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 13) {
      throw new Error("You must be at least 13 years old to use this service.");
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Starting onboarding with:', { 
        email: formData.email,
        realName: formData.realName.trim(),
        birthdate: formData.birthdate,
        hasPhoto: !!formData.photoFile,
        hasId: !!formData.idFile
      });

      // Call the onComplete function passed from parent
      await onComplete({
        email: formData.email,
        password: formData.password,
        realName: formData.realName.trim(),
        birthdateISO: formData.birthdate,
        profilePhotoFile: formData.photoFile,
        username: formData.handle.trim() || undefined,
        idFile: formData.idFile
      });

      // ^ If onComplete resolves, App.js will re-render with hasCompletedOnboarding=true
      console.log('Onboarding completed successfully');
      
    } catch (error) {
      console.error('Onboarding failed:', error);
      setError(error?.message || "Failed to complete onboarding.");
    } finally {
      setIsLoading(false);              // ✅ never leave the button stuck
    }
  };

  const renderStep1 = () => (
    <div className="onboarding-step">
      <h2>Create Your Account</h2>
      <p>Set up your email and password for secure access.</p>
      
      <div className="form-group">
        <label htmlFor="email">Email Address *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Enter your email address"
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password *</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Create a strong password"
          className="form-input"
          required
        />
        <small>Must be at least 6 characters</small>
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password *</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="Confirm your password"
          className="form-input"
          required
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="onboarding-step">
      <h2>What's your real name?</h2>
      <p>We require real names for accountability and community building.</p>
      
      <div className="form-group">
        <label htmlFor="realName">Real Name *</label>
        <input
          type="text"
          id="realName"
          name="realName"
          value={formData.realName}
          onChange={handleInputChange}
          placeholder="Enter your full real name"
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="handle">Username (Optional)</label>
        <input
          type="text"
          id="handle"
          name="handle"
          value={formData.handle}
          onChange={handleInputChange}
          placeholder="Choose a unique username"
          className="form-input"
        />
        <small>Leave blank to use a generated one</small>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="onboarding-step">
      <h2>When were you born?</h2>
      <p>This helps us ensure age-appropriate content and features.</p>
      
      <div className="form-group">
        <label htmlFor="birthdate">Birthdate *</label>
        <input
          type="date"
          id="birthdate"
          name="birthdate"
          value={formData.birthdate}
          onChange={handleInputChange}
          className="form-input"
          required
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="onboarding-step">
      <h2>Add a profile photo</h2>
      <p>Upload a clear photo of yourself for your profile.</p>
      
      <div className="form-group">
        <label htmlFor="photo">Profile Photo *</label>
        <div className="photo-upload">
          <input
            type="file"
            id="photo"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="file-input"
            required
          />
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="upload-btn"
          >
            {formData.photoFile ? 'Change Photo' : 'Select Photo'}
          </button>
        </div>
        
        {formData.photoFile && (
          <div className="photo-preview">
            <img
              src={URL.createObjectURL(formData.photoFile)}
              alt="Profile preview"
              className="preview-image"
            />
            <p className="file-info">
              {formData.photoFile.name} ({(formData.photoFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="onboarding-step">
      <h2>ID Verification Required</h2>
      <p>Upload a government-issued ID to verify your identity. The name on your ID must match your real name exactly.</p>
      
      <div className="form-group">
        <label htmlFor="idName">Name on ID *</label>
        <input
          type="text"
          id="idName"
          name="idName"
          value={formData.idName}
          onChange={handleInputChange}
          placeholder="Enter the exact name as shown on your ID"
          className="form-input"
          required
        />
        <small>This must match your real name exactly</small>
      </div>

      <div className="form-group">
        <label htmlFor="idFile">Government ID *</label>
        <div className="photo-upload">
          <input
            type="file"
            id="idFile"
            ref={idFileInputRef}
            onChange={handleIdFileSelect}
            accept="image/*"
            className="file-input"
            required
          />
          <button
            type="button"
            onClick={() => idFileInputRef.current.click()}
            className="upload-btn"
          >
            {formData.idFile ? 'Change ID' : 'Upload ID'}
          </button>
        </div>
        
        {formData.idFile && (
          <div className="photo-preview">
            <img
              src={URL.createObjectURL(formData.idFile)}
              alt="ID preview"
              className="preview-image"
            />
            <p className="file-info">
              {formData.idFile.name} ({(formData.idFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}
      </div>

      <div className="verification-notice">
        <h3>Important Verification Notes</h3>
        <ul>
          <li>Only government-issued IDs are accepted (driver's license, passport, etc.)</li>
          <li>The name on your ID must match your real name exactly</li>
          <li>Your ID will be securely stored and only used for verification</li>
          <li>No anonymous accounts are allowed - real identity verification is required</li>
        </ul>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="onboarding-step">
      <h2>Review & Complete</h2>
      <p>Please confirm your details before completing onboarding.</p>
      
      <div className="review-section">
        <h3>Account Information</h3>
        <div className="review-item">
          <strong>Email:</strong> {formData.email}
        </div>
        <div className="review-item">
          <strong>Name:</strong> {formData.realName}
        </div>
        <div className="review-item">
          <strong>Birthdate:</strong> {formData.birthdate}
        </div>
        <div className="review-item">
          <strong>Username:</strong> {formData.handle || 'Will be generated'}
        </div>
        <div className="review-item">
          <strong>Photo:</strong> {formData.photoFile ? formData.photoFile.name : 'Not selected'}
        </div>
        <div className="review-item">
          <strong>ID Verification:</strong> {formData.idFile ? `${formData.idFile.name} - ${formData.idName}` : 'Not uploaded'}
        </div>
      </div>

      <div className="verification-notice">
        <h3>Important Notes</h3>
        <ul>
          <li>Your real name will be visible to other users</li>
          <li>Profile photos are public by default</li>
          <li>Birthdate is used for age verification only</li>
          <li>ID verification is required - no anonymous accounts allowed</li>
          <li>Your ID will be securely stored for verification purposes only</li>
        </ul>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return renderStep1(); // Account Setup (Email + Password)
      case 2: return renderStep2(); // Personal Information (Real Name + Username)
      case 3: return renderStep3(); // Birthdate
      case 4: return renderStep4(); // Profile Photo
      case 5: return renderStep5(); // ID Verification
      case 6: return renderStep6(); // Review & Complete
      default: return renderStep1();
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Account Setup';
      case 2: return 'Personal Information';
      case 3: return 'Birthdate';
      case 4: return 'Profile Photo';
      case 5: return 'ID Verification';
      case 6: return 'Review & Complete';
      default: return 'Onboarding';
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-header">
        <h1>Welcome to ACME</h1>
        <p>Complete your profile to get started</p>
      </div>

              <div className="onboarding-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(step / 6) * 100}%` }}
            ></div>
          </div>
          <div className="step-indicator">
            Step {step} of 6: {getStepTitle()}
          </div>
        </div>

      <div className="onboarding-content">
        {renderStep()}
        
        {error && (
          <div className="error-message" style={{color: 'tomato', marginTop: '1rem', padding: '0.5rem', border: '1px solid tomato', borderRadius: '4px', backgroundColor: 'rgba(255, 99, 71, 0.1)'}}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="onboarding-actions">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Back
            </button>
          )}
          
          {step < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary"
              disabled={isLoading}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Completing...' : 'Complete Onboarding'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
