'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import Link from 'next/link';
import styles from './login.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
  if (searchParams.get('registered') === 'true') {
    setSuccessMessage('Account created successfully! Please sign in.');
  }
  if (searchParams.get('password_reset') === 'true') {
    setSuccessMessage('Password reset successfully! Please sign in with your new password.');
  }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.login(formData);
      router.push('/');
    } catch (error: any) {
      setError(error.error || 'Invalid username/email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Sign in to your account</h2>
          <p className={styles.subtitle}>
            Or{' '}
            <Link href="/signup" className={styles.link}>
              create a new account
            </Link>
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {successMessage && (
            <div className={styles.successMessage}>
              <p className={styles.successText}>{successMessage}</p>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          <div className={styles.formGroup}>
            <div>
              <label htmlFor="username" className={styles.label}>
                Username or Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username or email"
                className={styles.input}
              />
            </div>

            <div>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.forgotPassword}>
            <Link href="/password-reset" className={styles.link}>
              Forgot your password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
