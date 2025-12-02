'use client';

import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { itemsApi } from '@/lib/api';
import styles from './page.module.css';
import Countdown from '@/components/Countdown';

interface Image {
  data: string;
  format: string;
  order: number;
}

interface Item {
  id: number;
  name: string;
  description: string;
  images: Image[];
  thumbnail: string;
  starting_price: string;
  current_price: string;
  seller_username: string;
  seller_id: number;
  current_bidder_username: string | null;
  is_active: boolean;
  end_time: string;
  created_at: string;
  bid_history: Array<{
    username: string;
    amount: string;
    timestamp: string;
  }>;
  auction_status: string;
  remaining_time: string;
  auction_type: string;
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

// Helper function to format timestamp
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid' | 'unknown'>('unknown');

  // Bidding states
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState(false);

  // Bid history display state
  const [showAllBids, setShowAllBids] = useState(false);

  // Fetch item data
  const fetchItem = async () => {
    try {
      const data = await itemsApi.getItem(parseInt(resolvedParams.id));
      setItem(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item');
      setLoading(false);
    }
  };

  // Check if user has paid for this item
  const checkPaymentStatus = async () => {
    const base = (process.env.NEXT_PUBLIC_API_BASE ?? '/api').replace(/\/$/, '');
    //process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE!;
    if (!user) return;

    try {
      const response = await fetch(
        `${base}/payments/my-won-items/`,
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
        const unpaidItem = data.unpaid_items?.find(
          (unpaid: any) => unpaid.item_id === parseInt(resolvedParams.id)
        );

        if (paidItem) {
          setPaymentStatus('paid');
        } else if (unpaidItem) {
          setPaymentStatus('unpaid');
        } else {
          setPaymentStatus('unknown');
        }
      }
    } catch (err) {
      console.error('Failed to check payment status:', err);
      setPaymentStatus('unknown');
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchItem();
      checkPaymentStatus();
    }
  }, [resolvedParams.id, authLoading, user]);

  // Handle bid submission
  const handlePlaceBid = async () => {
    const base = (process.env.NEXT_PUBLIC_API_BASE ?? '/api').replace(/\/$/, '');
    //process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE!;
    // For Dutch auctions, use current price. For Forward auctions, use user input
    const isDutch = item?.auction_type === 'DUTCH';
    const finalBidAmount = isDutch
      ? parseFloat(item!.current_price)
      : parseFloat(bidAmount);

    if (!isDutch && !bidAmount && finalBidAmount === 0) {
      setBidError('Please enter a valid bid amount');
      return;
    }

    setBidding(true);
    setBidError(null);
    setBidSuccess(false);

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(
        `${base}/items/${item?.id}/bid/`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken || '',
          },
          body: JSON.stringify({ bid_amount: finalBidAmount }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setBidError(data.error || 'Failed to place bid');
        if (data.minimum_bid) {
          setBidError(
            `${data.error}. Minimum bid: $${data.minimum_bid.toFixed(2)}`
          );
        }
        setBidding(false);
        return;
      }

      // Success! Update item with new data
      setBidSuccess(true);
      setBidAmount('');
      setItem(data.item);

      // Clear success message after 3 seconds
      setTimeout(() => setBidSuccess(false), 3000);
    } catch (err) {
      setBidError(err instanceof Error ? err.message : 'Failed to place bid');
    } finally {
      setBidding(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.loadingText}>Loading item...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>{error || 'Item not found'}</p>
      </div>
    );
  }

  const sortedImages = item.images.sort((a, b) => a.order - b.order);
  const currentImage = sortedImages[currentImageIndex];

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === sortedImages.length - 1 ? 0 : prev + 1
    );
  };

  // Check if user can bid
  const canBid =
    user &&
    item.is_active &&
    user.id !== item.seller_id;

  const isAuctionEnded =
    !item.is_active || new Date(item.end_time) < new Date();

  const isDutchAuction = item.auction_type === 'DUTCH';

  // Dutch auction ends immediately after first bid
  const isDutchEnded =
    isDutchAuction && item.current_bidder_username !== null;

  // Check if current user is the winner
  const isWinner =
    !!user &&
    item.current_bidder_username === user.username &&
    isAuctionEnded;

  // Reverse bid history to show latest first
  const reversedBidHistory = [...item.bid_history].reverse();
  const displayedBids = showAllBids
    ? reversedBidHistory
    : reversedBidHistory.slice(0, 5);
  const hasMoreBids = item.bid_history.length > 5;

  return (
    <div className={styles.maxWidth}>
      <h1 className={styles.title}>{item.name}</h1>

      {/* Left Section - Images & Description */}
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.leftSection}>
            {/* Carousel */}
            {sortedImages.length > 0 ? (
              <div className={styles.carousel}>
                {/* Main Image */}
                <img
                  src={`data:image/${currentImage.format};base64,${currentImage.data}`}
                  alt={item.name}
                  className={styles.mainImage}
                  onClick={() => setShowImageModal(true)}
                />

                {/* Arrows */}
                {sortedImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className={`${styles.arrow} ${styles.arrowLeft}`}
                    >
                      ‹
                    </button>
                    <button
                      onClick={handleNextImage}
                      className={`${styles.arrow} ${styles.arrowRight}`}
                    >
                      ›
                    </button>
                  </>
                )}

                {/* Counter */}
                <div className={styles.imageCounter}>
                  {currentImageIndex + 1} / {sortedImages.length}
                </div>

                {/* Thumbnails */}
                {sortedImages.length > 1 && (
                  <div className={styles.thumbnailStrip}>
                    {sortedImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={`data:image/${img.format};base64,${img.data}`}
                        alt={`Thumbnail ${idx + 1}`}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`${styles.thumbnail} ${
                          idx === currentImageIndex ? styles.active : ''
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.carousel}>
                No images available
              </div>
            )}

            {/* Description */}
            <div className={styles.descriptionSection}>
              <h2 className={styles.descriptionTitle}>Description</h2>
              <p>{item.description}</p>
            </div>
          </div>

          {/* Right Section - Item Info */}
          <div className={styles.infoCard}>
            <div className={styles.priceDisplay}>
              ${parseFloat(item.current_price).toFixed(2)}
            </div>

            {/* Status */}
            <div
              className={`${styles.statusBadge} ${
                isAuctionEnded || isDutchEnded
                  ? styles.statusEnded
                  : styles.statusActive
              }`}
            >
              {isAuctionEnded || isDutchEnded ? 'ENDED' : item.auction_status}
            </div>

            {/* Info Table */}
            <div className={styles.infoTable}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Auction Type</span>
                <span className={styles.infoValue}>
                  {isDutchAuction ? 'Dutch' : 'Forward'}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Starting Price</span>
                <span className={styles.infoValue}>
                  ${parseFloat(item.starting_price).toFixed(2)}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Seller</span>
                <span className={styles.infoValue}>{item.seller_username}</span>
              </div>

              {item.current_bidder_username && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>
                    {isAuctionEnded || isDutchEnded ? 'Winner' : 'Current Bidder'}
                  </span>
                  <span className={styles.infoValue}>
                    {item.current_bidder_username}
                  </span>
                </div>
              )}

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Time Remaining</span>
                <span
                  className={`${styles.infoValue} ${
                    isAuctionEnded || isDutchEnded
                      ? styles.infoTimeEnded
                      : styles.infoTime
                  }`}
                >
                  {isAuctionEnded || isDutchEnded ? (
                    'Auction Ended'
                  ) : (
                    <Countdown endTime={item.end_time} />
                  )}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Created At</span>
                <span className={styles.infoValue}>
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Ends At</span>
                <span className={styles.infoValue}>
                  {new Date(item.end_time).toLocaleDateString()}
                </span>
              </div>

              {item.bid_history.length > 0 && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Total Bids</span>
                  <span className={styles.infoValue}>{item.bid_history.length}</span>
                </div>
              )}
            </div>

            {/* Bid Button with Auth Check */}
            {!isAuctionEnded && !isDutchEnded ? (
              <div className={styles.bidSection}>
                <button
                  className={styles.placeBidButton}
                  disabled={!user || user.id === item.seller_id || bidding}
                  onClick={handlePlaceBid}
                  style={{
                    opacity: !user || user.id === item.seller_id ? 0.5 : 1,
                    cursor:
                      !user || user.id === item.seller_id
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  {bidding
                    ? 'Placing Bid...'
                    : isDutchAuction
                    ? `Buy Now for $${parseFloat(item.current_price).toFixed(2)}`
                    : 'Place Bid'}
                </button>

                {/* Warning message for non-authenticated users */}
                {!user && (
                  <p className={styles.authWarning}>
                    You must be logged in to place a bid
                  </p>
                )}

                {/* Warning for seller */}
                {user && user.id === item.seller_id && (
                  <p className={styles.authWarning}>
                    You cannot bid on your own item
                  </p>
                )}

                {/* Bid input field - only show for FORWARD auctions */}
                {canBid && !isDutchAuction && (
                  <div className={styles.bidInputContainer}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter bid amount"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className={styles.bidInput}
                      disabled={bidding}
                    />
                  </div>
                )}

                {/* Dutch auction info */}
                {canBid && isDutchAuction && (
                  <p className={styles.dutchInfo}>
                    Click the button above to purchase at the current price
                  </p>
                )}

                {/* Error and success messages */}
                {bidError && <p className={styles.bidError}>{bidError}</p>}
                {bidSuccess && (
                  <p className={styles.bidSuccess}>
                    {isDutchAuction
                      ? 'Purchase successful!'
                      : 'Bid placed successfully!'}
                  </p>
                )}
              </div>
            ) : null}

            {/* Show Auction Ended button and Pay Now for winner */}
            {isAuctionEnded || isDutchEnded ? (
              <div className={styles.bidSection}>
                <button
                  className={styles.placeBidButton}
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  Auction Ended
                </button>

                {/* Show Pay Now button only for the winner */}
                {isWinner && paymentStatus === 'unpaid' && (
                  <button
                    className={styles.payNowButton}
                    onClick={() => router.push(`/payment/${item.id}`)}
                  >
                    💳 Pay Now
                  </button>
                )}

                {/* Show Already Paid button if already paid */}
                {isWinner && paymentStatus === 'paid' && (
                  <>
                    <button
                      className={styles.placeBidButton}
                      disabled
                      style={{
                        background: 'var(--color-text-secondary)',
                        opacity: 1,
                        cursor: 'default',
                      }}
                    >
                      ✓ Already Paid
                    </button>

                    <button
                      className={styles.payNowButton}
                      onClick={() => router.push(`/receipts/${item.id}`)}
                    >
                      📄 Show Receipt
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Bid History - Only show for Forward auctions */}
      {!isDutchAuction && item.bid_history.length > 0 && (
        <div className={styles.container}>
          <div className={styles.bidHistoryCard}>
            <h2 className={styles.bidHistoryTitle}>Bid History</h2>

            <div className={styles.bidHistoryList}>
              {displayedBids.map((bid, idx) => {
                // Calculate the actual bid number (reverse index)
                const bidNumber = item.bid_history.length - (showAllBids ? idx : idx);

                return (
                  <div key={idx} className={styles.bidItem}>
                    <span className={styles.bidHistoryText}>
                      ${parseFloat(bid.amount).toFixed(2)} - {bid.username} - Bid{' '}
                      {bidNumber} - {formatTimestamp(bid.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Show more / Show less button */}
            {hasMoreBids && (
              <div className={styles.showMoreContainer}>
                <span
                  className={styles.showMoreText}
                  onClick={() => setShowAllBids(!showAllBids)}
                >
                  {showAllBids ? 'Show less...' : 'Show more...'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {showImageModal && currentImage && (
        <div
          className={styles.modal}
          onClick={() => setShowImageModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`data:image/${currentImage.format};base64,${currentImage.data}`}
              alt={item.name}
              className={styles.modalImage}
            />
            <button
              onClick={() => setShowImageModal(false)}
              className={styles.modalClose}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
