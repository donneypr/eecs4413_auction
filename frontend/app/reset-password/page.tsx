'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import styles from './reset-password.module.css';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!uid || !token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [uid, token]);

  const getPasswordStrength = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const passwordStrength = getPasswordStrength(formData.new_password);
  const isPasswordValid = Object.values(passwordStrength).every(Boolean);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setValidationError('Password does not meet requirements');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setValidationError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.post('auth/password-reset-confirm/', {
        uid,
        token,
        new_password: formData.new_password,
      });
      
      router.push('/login?password_reset=true');
    } catch (err: any) {
      setError(err.detail || 'Failed to reset password. The link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Set new password</h2>
          <p className={styles.subtitle}>
            Enter your new password below
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.errorMessage}>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="new_password" className={styles.label}>
              New Password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                value={formData.new_password}
                onChange={handleChange}
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => setTimeout(() => setShowPasswordRequirements(false), 200)}
                className={styles.input}
              />
              {showPasswordRequirements && (
                <div className={styles.passwordRequirements}>
                  <div className={styles.requirementTitle}>Password must contain:</div>
                  <div className={`${styles.requirement} ${passwordStrength.minLength ? styles.met : ''}`}>
                    <span className={styles.checkmark}>{passwordStrength.minLength ? '✓' : '○'}</span>
                    At least 8 characters
                  </div>
                  <div className={`${styles.requirement} ${passwordStrength.hasUppercase ? styles.met : ''}`}>
                    <span className={styles.checkmark}>{passwordStrength.hasUppercase ? '✓' : '○'}</span>
                    One uppercase letter
                  </div>
                  <div className={`${styles.requirement} ${passwordStrength.hasNumber ? styles.met : ''}`}>
                    <span className={styles.checkmark}>{passwordStrength.hasNumber ? '✓' : '○'}</span>
                    At least 1 number
                  </div>
                  <div className={`${styles.requirement} ${passwordStrength.hasSpecialChar ? styles.met : ''}`}>
                    <span className={styles.checkmark}>{passwordStrength.hasSpecialChar ? '✓' : '○'}</span>
                    At least 1 special character (!@#$%^&*)
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirm_password" className={styles.label}>
              Confirm Password
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              value={formData.confirm_password}
              onChange={handleChange}
              className={styles.input}
            />
            {validationError && (
              <p className={styles.fieldError}>{validationError}</p>
            )}
          </div>

          <button type="submit" disabled={loading || !uid || !token} className={styles.submitButton}>
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="/login" className={styles.link}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
