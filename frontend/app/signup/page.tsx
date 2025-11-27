'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import Link from 'next/link';
import styles from './signup.module.css';
import { useLoadScript } from '@react-google-maps/api';
import AddressAutocomplete from '@/components/AddressAutocomplete';

const libraries: ("places")[] = ["places"];

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    street_name: '',
    street_number: '',
    city: '',
    country: '',
    postal_code: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any>({});
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showMaxLengthTooltip, setShowMaxLengthTooltip] = useState<string | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    version: "weekly",
  });

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const isPasswordValid = Object.values(passwordStrength).every(Boolean);

  const validateForm = () => {
    const newErrors: any = {};

    // Username validation (max 16 characters)
    if (formData.username.length > 16) {
      newErrors.username = 'Username must be 16 characters or less';
    }
    if (formData.username.length === 0) {
      newErrors.username = 'Username is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email must be valid and end with a domain (e.g., .com, .org)';
    }

    // First name validation (max 32 characters)
    if (formData.first_name.length > 32) {
      newErrors.first_name = 'First name must be 32 characters or less';
    }
    if (formData.first_name.length === 0) {
      newErrors.first_name = 'First name is required';
    }

    // Last name validation (max 32 characters)
    if (formData.last_name.length > 32) {
      newErrors.last_name = 'Last name must be 32 characters or less';
    }
    if (formData.last_name.length === 0) {
      newErrors.last_name = 'Last name is required';
    }

    // Password validation
    if (!isPasswordValid) {
      newErrors.password = 'Password does not meet requirements';
    }

    // Password matching validation
    if (formData.password !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Check character limits and show tooltip
    if (name === 'username' && value.length >= 16) {
      setShowMaxLengthTooltip('username');
      if (value.length > 16) return;
    } else if (name === 'first_name' && value.length >= 32) {
      setShowMaxLengthTooltip('first_name');
      if (value.length > 32) return;
    } else if (name === 'last_name' && value.length >= 32) {
      setShowMaxLengthTooltip('last_name');
      if (value.length > 32) return;
    } else {
      setShowMaxLengthTooltip(null);
    }
    
    setFormData({ ...formData, [name]: value });
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: null });
    }
  };

  const handleAddressSelect = (addressComponents: any) => {
    setFormData({
      ...formData,
      street_number: addressComponents.street_number || '',
      street_name: addressComponents.street_name || '',
      city: addressComponents.city || '',
      country: addressComponents.country || '',
      postal_code: addressComponents.postal_code || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await authService.signup(formData);
      router.push('/login?registered=true');
    } catch (error: any) {
      setErrors(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create your account</h2>
          <p className={styles.subtitle}>
            Already have an account?{' '}
            <Link href="/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formSections}>
            {/* Account Information */}
            <div className={styles.gridTwo}>
              <div className={styles.fieldGroup}>
                <label htmlFor="username" className={styles.label}>
                  Username *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className={styles.input}
                    maxLength={16}
                  />
                  {showMaxLengthTooltip === 'username' && (
                    <div className={styles.maxLengthTooltip}>
                      Maximum 16 characters
                    </div>
                  )}
                </div>
                {(validationErrors.username || errors.username) && (
                  <p className={styles.fieldError}>
                    {validationErrors.username || errors.username?.[0]}
                  </p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.input}
                />
                {(validationErrors.email || errors.email) && (
                  <p className={styles.fieldError}>
                    {validationErrors.email || errors.email?.[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Name */}
            <div className={styles.gridTwo}>
              <div className={styles.fieldGroup}>
                <label htmlFor="first_name" className={styles.label}>
                  First Name *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className={styles.input}
                    maxLength={32}
                  />
                  {showMaxLengthTooltip === 'first_name' && (
                    <div className={styles.maxLengthTooltip}>
                      Maximum 32 characters
                    </div>
                  )}
                </div>
                {(validationErrors.first_name || errors.first_name) && (
                  <p className={styles.fieldError}>
                    {validationErrors.first_name || errors.first_name?.[0]}
                  </p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="last_name" className={styles.label}>
                  Last Name *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className={styles.input}
                    maxLength={32}
                  />
                  {showMaxLengthTooltip === 'last_name' && (
                    <div className={styles.maxLengthTooltip}>
                      Maximum 32 characters
                    </div>
                  )}
                </div>
                {(validationErrors.last_name || errors.last_name) && (
                  <p className={styles.fieldError}>
                    {validationErrors.last_name || errors.last_name?.[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Password */}
            <div className={styles.gridTwo}>
              <div className={styles.fieldGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
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
                {(validationErrors.password || errors.password) && (
                  <p className={styles.fieldError}>
                    {validationErrors.password || errors.password?.[0]}
                  </p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="password2" className={styles.label}>
                  Confirm Password *
                </label>
                <input
                  id="password2"
                  name="password2"
                  type="password"
                  required
                  value={formData.password2}
                  onChange={handleChange}
                  className={styles.input}
                />
                {(validationErrors.password2 || errors.password2) && (
                  <p className={styles.fieldError}>
                    {validationErrors.password2 || errors.password2?.[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Address Section with Autocomplete */}
            <div className={styles.addressSection}>
              <h3 className={styles.sectionTitle}>Shipping Address</h3>
              
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Search Address
                </label>
                <AddressAutocomplete onAddressSelect={handleAddressSelect} />
                <p className={styles.helperText}>Start typing your address for suggestions</p>
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="street_number" className={styles.label}>
                    Street Number *
                  </label>
                  <input
                    id="street_number"
                    name="street_number"
                    type="text"
                    required
                    value={formData.street_number}
                    readOnly
                    className={`${styles.input} ${styles.readOnly}`}
                    placeholder="Auto-filled from search"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="street_name" className={styles.label}>
                    Street Name *
                  </label>
                  <input
                    id="street_name"
                    name="street_name"
                    type="text"
                    required
                    value={formData.street_name}
                    readOnly
                    className={`${styles.input} ${styles.readOnly}`}
                    placeholder="Auto-filled from search"
                  />
                </div>
              </div>

              <div className={styles.gridThree}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="city" className={styles.label}>
                    City *
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    readOnly
                    className={`${styles.input} ${styles.readOnly}`}
                    placeholder="Auto-filled from search"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="country" className={styles.label}>
                    Country *
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    required
                    value={formData.country}
                    readOnly
                    className={`${styles.input} ${styles.readOnly}`}
                    placeholder="Auto-filled from search"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="postal_code" className={styles.label}>
                    Postal Code *
                  </label>
                  <input
                    id="postal_code"
                    name="postal_code"
                    type="text"
                    required
                    value={formData.postal_code}
                    readOnly
                    className={`${styles.input} ${styles.readOnly}`}
                    placeholder="Auto-filled from search"
                  />
                </div>
              </div>
            </div>
          </div>

          {errors.non_field_errors && (
            <div className={styles.errorMessage}>
              <p className={styles.errorText}>{errors.non_field_errors[0]}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
      </div>
    </div>
  );
}
