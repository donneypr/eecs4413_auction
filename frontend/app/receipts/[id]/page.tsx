'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useAuth } from 'app/contexts/AuthContext';
import { itemsApi } from '@/lib/api';
import styles from './page.module.css';

interface Item {
  id: number;
  name: string;
  description: string;
  current_price: string;
  current_bidder_username: string | null;
  seller_username: string;
  images?: Array<{ data: string; format: string; order: number }>;
  thumbnail?: string;
  end_time?: string;
}

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user, loading: authLoading } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await itemsApi.getItem(parseInt(resolvedParams.id));
        setItem(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load receipt details');
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchItem();
    }
  }, [resolvedParams.id, authLoading]);

  if (loading || authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>Loading receipt...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>{error || 'Receipt not found'}</p>
          <Link href="/items" className={styles.backLink}>
            ← Back to Items
          </Link>
        </div>
      </div>
    );
  }

  if (!user || item.current_bidder_username !== user.username) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>❌ You are not authorized to view this receipt.</p>
          <Link href="/items" className={styles.backLink}>
            ← Back to Items
          </Link>
        </div>
      </div>
    );
  }

  const itemPrice = parseFloat(item.current_price);
  const EXPEDITED_COST = 20.0;
  const shippingCost = EXPEDITED_COST; // Default to expedited for receipt demo
  const tax = itemPrice * 0.1; // 10% tax
  const totalAmount = itemPrice + shippingCost + tax;

  const mainImage = item.images && item.images.length > 0 
    ? item.images.sort((a, b) => a.order - b.order)[0]
    : null;

  const receiptNumber = `REC-${item.id}-${Date.now().toString().slice(-6)}`;
  const orderDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={styles.container}>
      <div className={styles.receiptCard}>
        {/* Header */}
        <div className={styles.receiptHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.receiptTitle}>✓ ORDER CONFIRMED</h1>
            <p className={styles.receiptNumber}>Receipt #{receiptNumber}</p>
            <p className={styles.orderDate}>{orderDate}</p>
          </div>
          <div className={styles.statusBadge}>
            <span className={styles.badgeIcon}>✓</span>
            <span className={styles.badgeText}>Paid</span>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className={styles.contentGrid}>
          {/* Left: Item Details */}
          <div className={styles.itemSection}>
            <h2 className={styles.sectionTitle}>Item Details</h2>
            
            {mainImage && (
              <div className={styles.itemImage}>
                <img 
                  src={`data:image/${mainImage.format};base64,${mainImage.data}`}
                  alt={item.name}
                />
              </div>
            )}

            <div className={styles.itemInfo}>
              <h3 className={styles.itemName}>{item.name}</h3>
              <p className={styles.itemDescription}>{item.description}</p>
            </div>

            <div className={styles.descriptionBox}>
              <h3 className={styles.boxTitle}>Detailed Item Description</h3>
              <p className={styles.boxContent}>{item.description}</p>
            </div>

            <Link href={`/items/${item.id}`} className={styles.viewItemLink}>
              View Full Listing →
            </Link>
          </div>

          {/* Right: Order Summary & Info */}
          <div className={styles.summarySection}>
            {/* Pricing Summary */}
            <div className={styles.summaryBox}>
              <h2 className={styles.sectionTitle}>Order Summary</h2>
              
              <div className={styles.summaryRow}>
                <span className={styles.label}>Item Price</span>
                <span className={styles.value}>${itemPrice.toFixed(2)}</span>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.label}>Shipping (Expedited)</span>
                <span className={styles.value}>${shippingCost.toFixed(2)}</span>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.label}>Tax (10%)</span>
                <span className={styles.value}>${tax.toFixed(2)}</span>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.summaryRow + ' ' + styles.totalRow}>
                <span className={styles.totalLabel}>Total Paid</span>
                <span className={styles.totalValue}>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Buyer Information */}
            <div className={styles.infoBox}>
              <h3 className={styles.boxTitle}>Buyer Information</h3>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Username</span>
                <span className={styles.infoValue}>{user.username}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{user.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Name</span>
                <span className={styles.infoValue}>{user.first_name} {user.last_name}</span>
              </div>
            </div>

            {/* Seller Information */}
            <div className={styles.infoBox}>
              <h3 className={styles.boxTitle}>Seller Information</h3>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Seller</span>
                <Link href={`/profile/${item.seller_username}`} className={styles.sellerLink}>
                  {item.seller_username}
                </Link>
              </div>
            </div>

            {/* Shipping Details */}
            <div className={styles.infoBox}>
              <h3 className={styles.boxTitle}>Shipping Details</h3>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Method</span>
                <span className={styles.infoValue}>🚀 Expedited</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Delivery</span>
                <span className={styles.infoValue}>1-2 Business Days</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Status</span>
                <span className={styles.infoValue}>🔄 Processing</span>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button className={styles.printButton} onClick={() => window.print()}>
                🖨️ Print Receipt
              </button>
              <Link href="/items" className={styles.continueButton}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.receiptFooter}>
          <p className={styles.footerText}>
            Thank you for your purchase! Your order has been confirmed and is being prepared for shipment.
          </p>
          <p className={styles.footerText}>
            Need help? <Link href="/support" className={styles.footerLink}>Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
