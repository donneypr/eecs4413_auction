'use client';

import { useState, useEffect, use } from 'react';

import styles from './page.module.css';

import { itemsApi } from '@/lib/api';
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
  current_bidder_username: string | null;
  is_active: boolean;
  end_time: string;
  created_at: string;
  bid_history: Array<{ bidder: string; amount: string; timestamp: string }>;
  auction_status: string;
  remaining_time: string;
}

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
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

    fetchItem();
  }, [resolvedParams.id]);

  if (loading) {
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
    setCurrentImageIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

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
                    <button onClick={handlePrevImage} className={`${styles.arrow} ${styles.arrowLeft}`}>
                      ‹
                    </button>
                    <button onClick={handleNextImage} className={`${styles.arrow} ${styles.arrowRight}`}>
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
                        className={`${styles.thumbnail} ${idx === currentImageIndex ? styles.active : ''}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.carousel}>No images available</div>
            )}

            {/* Description */}
            <div className={styles.descriptionSection}>
              <h2 className={styles.descriptionTitle}>Description</h2>
              <p>{item.description}</p>
            </div>
          </div>

          {/* Right Section - Item Info */}
          <div className={styles.infoCard}>
            <div className={styles.priceDisplay}>${parseFloat(item.current_price).toFixed(2)}</div>

            {/* Status */}
            <div className={styles.statusBadge}>{item.auction_status}</div>

            {/* Info Table */}
            <div className={styles.infoTable}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Starting Price:</span>
                <span className={styles.infoValue}>${parseFloat(item.starting_price).toFixed(2)}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Seller:</span>
                <span className={styles.infoValue}>{item.seller_username}</span>
              </div>

              {item.current_bidder_username && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Current Bidder:</span>
                  <span className={styles.infoValue}>{item.current_bidder_username}</span>
                </div>
              )}

              <div className={styles.infoRow}>
  <span className={styles.infoLabel}>Time Remaining:</span>
  <span className={`${styles.infoValue} ${styles.infoTime}`}>
    <Countdown endTime={item.end_time} />
  </span>
</div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Created At:</span>
                <span className={styles.infoValue}>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Ends At:</span>
                <span className={styles.infoValue}>{new Date(item.end_time).toLocaleDateString()}</span>
              </div>

              {item.bid_history.length > 0 && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Total Bids:</span>
                  <span className={styles.infoValue}>{item.bid_history.length}</span>
                </div>
              )}
            </div>

            {/* Bid Button */}
            {item.is_active && (
              <button className={styles.placeBidButton}>Place Bid</button>
            )}
          </div>
        </div>
      </div>

      {/* Bid History */}
      {item.bid_history.length > 0 && (
        <div className={styles.container}>
          <div className={styles.bidHistoryCard}>
            <h2 className={styles.bidHistoryTitle}>Bid History</h2>
            <div className={styles.bidHistoryList}>
              {item.bid_history.map((bid, idx) => (
                <div key={idx} className={styles.bidItem}>
                  <span className={styles.bidderName}>{bid.bidder}</span>
                  <span className={styles.bidAmount}>${bid.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {showImageModal && currentImage && (
        <div className={styles.modal} onClick={() => setShowImageModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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