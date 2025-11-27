'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import styles from './password-reset.module.css';

export default function PasswordResetPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Determine if identifier is email or username
      const isEmail = identifier.includes('@');
      const payload = isEmail 
        ? { email: identifier }
        : { username: identifier };

      await apiClient.post('auth/password-reset/', payload);
      setSuccess(true);
      setIdentifier('');
    } catch (err: any) {
      setError(err.detail || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Reset your password</h2>
          <p className={styles.subtitle}>
            Enter your email or username and we'll send you a reset link
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {success && (
            <div className={styles.successMessage}>
              <p className={styles.successText}>
                If an account exists with that email/username, you will receive a password reset link shortly.
                Check your console for the reset link (development mode).
              </p>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="identifier" className={styles.label}>
              Email or Username
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or username"
              className={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Sending...' : 'Send reset link'}
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
