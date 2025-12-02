'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { itemsApi } from '@/lib/api';
import styles from './page.module.css';

interface Item {
  id: number;
  name: string;
  current_price: string;
  current_bidder_username: string | null;
  seller_username: string;
  is_active: boolean;
}

// Helper function to get CSRF token from cookies
function getCsrfToken(): string | null {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Shipping state
  const [shippingOption, setShippingOption] = useState<'regular' | 'expedited'>('regular');
  const EXPEDITED_COST = 20.00;

  // Payment form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);

  // Check if user has already paid
  const checkPaymentStatus = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/payments/my-won-items/`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Check if this item is in paid items
        const paidItem = data.paid_items?.find(
          (paid: any) => paid.item_id === parseInt(resolvedParams.id)
        );

        if (paidItem) {
          // User has already paid, redirect to receipt
          router.push(`/receipts/${resolvedParams.id}`);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to check payment status:', err);
    }
  };

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await itemsApi.getItem(parseInt(resolvedParams.id));
        setItem(data);
        setLoading(false);

        // Check payment status after item is loaded
        await checkPaymentStatus();
      } catch (err) {
        setError('Failed to load item details');
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchItem();
    }
  }, [resolvedParams.id, authLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setProcessing(true);
  setError(null);

  try {
    const csrfToken = getCsrfToken();

    // Minimal payload – no card / shipping validation
    const payload = {};

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/payments/${item?.id}/pay/`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      router.push(`/receipts/${item?.id}`);
    } else {
      // Show raw backend error so we see if anything else is required
      const text = await response.text();
      setError(text || 'Payment processing failed');
      setProcessing(false);
    }
  } catch (err: any) {
    setError(`Network error: ${err.message}`);
    setProcessing(false);
  }
};

  if (loading || authLoading) {
    return (
      <div className={styles.container}>
        <p>Loading payment details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error || 'Item not found'}</p>
      </div>
    );
  }

  // Check if user is the winner
  if (!user || item.current_bidder_username !== user.username) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>❌ You are not authorized to pay for this item.</p>
      </div>
    );
  }

  // Calculate total
  const itemPrice = parseFloat(item.current_price);
  const shippingCost = shippingOption === 'expedited' ? EXPEDITED_COST : 0;
  const totalAmount = itemPrice + shippingCost;

  return (
    <div className={styles.container}>
      <div className={styles.paymentCard}>
        <h1 className={styles.title}>💳 Payment</h1>

        <div className={styles.orderSummary}>
          <h2>Order Summary</h2>

          <div className={styles.summaryRow}>
            <span>Item:</span>
            <span className={styles.itemName}>{item.name}</span>
          </div>

          <div className={styles.summaryRow}>
            <span>Seller:</span>
            <span>{item.seller_username}</span>
          </div>

          <div className={styles.summaryRow}>
            <span>Winning Bid:</span>
            <span className={styles.amount}>${itemPrice.toFixed(2)}</span>
          </div>

          {shippingOption === 'expedited' && (
            <div className={styles.summaryRow}>
              <span>Expedited Shipping:</span>
              <span className={styles.amount}>+${EXPEDITED_COST.toFixed(2)}</span>
            </div>
          )}

          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>Total:</span>
            <span className={styles.totalAmount}>${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping Options */}
        <div className={styles.shippingSection}>
          <h2>Shipping Options</h2>

          <label className={styles.shippingOption}>
            <input
              type="radio"
              name="shipping"
              value="regular"
              checked={shippingOption === 'regular'}
              onChange={() => setShippingOption('regular')}
              className={styles.radioInput}
            />
            <div className={styles.shippingDetails}>
              <div className={styles.shippingTitle}>
                📦 Regular Shipping <span className={styles.badge}>FREE</span>
              </div>
              <div className={styles.shippingDesc}>Delivery in 5-7 business days</div>
            </div>
          </label>

          <label className={styles.shippingOption}>
            <input
              type="radio"
              name="shipping"
              value="expedited"
              checked={shippingOption === 'expedited'}
              onChange={() => setShippingOption('expedited')}
              className={styles.radioInput}
            />
            <div className={styles.shippingDetails}>
              <div className={styles.shippingTitle}>
                🚀 Expedited Shipping <span className={styles.badgeBlue}>+${EXPEDITED_COST.toFixed(2)}</span>
              </div>
              <div className={styles.shippingDesc}>Delivery in 1-2 business days</div>
            </div>
          </label>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <h2>Payment Information</h2>

          <div className={styles.formGroup}>
            <label htmlFor="cardNumber">Card Number</label>
            <input
              id="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim())}
              maxLength={19}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cardName">Cardholder Name</label>
            <input
              id="cardName"
              type="text"
              placeholder="John Doe"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="expiryDate">Expiry Date</label>
              <input
                id="expiryDate"
                type="text"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2, 4);
                  }
                  setExpiryDate(value);
                }}
                maxLength={5}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cvv">CVV</label>
              <input
                id="cvv"
                type="text"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                maxLength={4}
                required
                className={styles.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={processing}
            className={styles.submitButton}
          >
            {processing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/items/${item.id}`)}
            className={styles.cancelButton}
            disabled={processing}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
