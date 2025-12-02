'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { userApi, itemsApi } from '@/lib/api';
import { useAuth } from '@/app/contexts/AuthContext';

interface AuctionItem {
  id: number;
  name: string;
  description: string;
  starting_price: string;
  current_price: string;
  seller_username: string;
  current_bidder_username: string | null;
  is_active: boolean;
  images: Array<{
    data: string;
    format: string;
    order: number;
  }>;
  thumbnail: string;
}

interface BidItem extends AuctionItem {
  remaining_time: string;
  bid_amount?: string;
}


export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'items' | 'bids' | 'wins'>('items');
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [username]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsData, bidsData] = await Promise.all([
        userApi.getItems(username),
        userApi.getBids(username),
      ]);
      setItems(itemsData);
      setBids(bidsData as BidItem[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await itemsApi.deleteItem(itemId);
      setItems((prev) => prev.filter((it) => it.id !== itemId));
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const ItemCard = ({ item, isBid = false }: { item: AuctionItem | BidItem; isBid?: boolean }) => {
    return (
      <div className={styles.itemCard}>
        <Link href={`/items/${item.id}`}>
          <div className={styles.itemImage}>
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.name}
                className={styles.itemImageImg}
              />
            ) : (
              <div className={styles.loadingText}>No image</div>
            )}
            <span
              className={`${styles.statusBadge} ${
                item.is_active ? styles.statusActive : styles.statusEnded
              }`}
            >
              {item.is_active ? 'Active' : 'Ended'}
            </span>
          </div>
        </Link>

        <div className={styles.itemContent}>
          <Link href={`/items/${item.id}`}>
            <h3 className={styles.itemName}>{item.name}</h3>
          </Link>

          <div className={styles.priceSection}>
            <span className={styles.priceLabel}>Price:</span>
            <span className={styles.price}>
              ${parseFloat(item.current_price).toFixed(2)}
            </span>
          </div>

          {isBid && 'remaining_time' in item && (
            <div className={styles.timeSection}>
              <span className={styles.timeLabel}>Time Left:</span>
              <span className={styles.timeValue}>{item.remaining_time}</span>
            </div>
          )}

          {!isBid && (
            <div className={styles.actions}>
              <button
                onClick={() => setEditingId(item.id)}
                className={styles.editButton}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(item.id)}
                className={styles.deleteButton}
                aria-label="Delete item"
                title="Delete item"
              >
                🗑
              </button>
            </div>
          )}

        </div>
      </div>
    );
  };

  if (!username || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingText}>Loading profile...</div>
        </div>
      </div>
    );
  }

  const wins = bids.filter(
    (bid) => !bid.is_active && bid.current_bidder_username === username
  );

  const isOwnProfile = user?.username === username;

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        <div className={styles.header}>
          <h1 className={styles.title}>{username}'s Profile</h1>
          <p className={styles.subtitle}>View your items and bids</p>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        {/* Tabs with Create Button */}
        <div className={styles.tabsWrapper}>
          <div className={styles.tabsContainer}>
            <button
              onClick={() => setActiveTab('items')}
              className={`${styles.tab} ${activeTab === 'items' ? styles.active : ''}`}
            >
              My Items ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('bids')}
              className={`${styles.tab} ${activeTab === 'bids' ? styles.active : ''}`}
            >
              My Bids ({bids.length})
            </button>
            <button
              onClick={() => setActiveTab('wins')}
              className={`${styles.tab} ${activeTab === 'wins' ? styles.active : ''}`}
            >
              My Wins ({wins.length})
            </button>
          </div>
          
          {isOwnProfile && (
            <button
              onClick={() => setShowCreateModal(true)}
              className={styles.createButton}
            >
              + Create Item
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === 'items' && (
          <div>
            {items.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>You haven't listed any items yet.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} isBid={false} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bids' && (
          <div>
            {bids.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>You haven't placed any bids yet.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {bids.map((bid) => (
                  <ItemCard key={bid.id} item={bid} isBid={true} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'wins' && (
          <div>
            {wins.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>You haven't won any items yet.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {wins.map((bid) => (
                  <ItemCard key={bid.id} item={bid} isBid={true} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId !== null && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2 className={styles.modalTitle}>Delete Item?</h2>
              <p className={styles.confirmMessage}>
                Are you sure you want to delete this item? <br />
                Note: You can't delete items that have bids
              </p>
              <p className={styles.confirmWarning}>
                This action cannot be undone.
              </p>
              <div className={styles.confirmButtons}>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className={styles.confirmCancel}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteItem(deleteConfirmId)}
                  className={styles.confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingId !== null && (
          <EditItemModal
            itemId={editingId}
            onClose={() => setEditingId(null)}
            onSuccess={() => {
              setEditingId(null);
              fetchData();
            }}
          />
        )}

        {/* Create Item Modal */}
        {showCreateModal && (
          <CreateItemModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchData();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Create Item Modal Component
function CreateItemModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [endTime, setEndTime] = useState('');
  const [auctionType, setAuctionType] = useState<'FORWARD' | 'DUTCH'>('FORWARD');
  const [dutchPercentage, setDutchPercentage] = useState('');
  const [dutchInterval, setDutchInterval] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    const remaining = 5 - images.length;
    const filesToProcess = files.slice(0, remaining);

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) continue;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setImageError(null);

    try {
      // Validation
      if (!name.trim()) throw new Error('Title is required');
      if (!description.trim()) throw new Error('Description is required');
      if (!startingPrice || parseFloat(startingPrice) <= 0) {
        throw new Error('Starting price must be greater than 0');
      }
      if (!endTime) throw new Error('End time is required');
      
      const endDate = new Date(endTime);
      if (endDate <= new Date()) {
        throw new Error('End time must be in the future');
      }

      if (auctionType === 'DUTCH') {
        if (!dutchPercentage || parseFloat(dutchPercentage) <= 0) {
          throw new Error('Decrease percentage is required for Dutch auctions');
        }
        if (!dutchInterval || parseInt(dutchInterval) <= 0) {
          throw new Error('Decrease interval is required for Dutch auctions');
        }
      }

      // NEW: require at least one image
      if (images.length === 0) {
        setImageError('Please upload at least one image');
        setSaving(false);
        return;
      }

      // Format payload
      const payload: any = {
        name: name.trim(),
        description: description.trim(),
        starting_price: parseFloat(startingPrice),
        auction_type: auctionType,
        end_time: endDate.toISOString(),
        images_data: images.map(img => img.split(',')[1]), // Remove data:image/... prefix
      };

      if (auctionType === 'DUTCH') {
        payload.dutch_decrease_percentage = parseFloat(dutchPercentage);
        payload.dutch_decrease_interval = parseInt(dutchInterval);
      }

      await itemsApi.createItem(payload);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create item');
      setSaving(false);
    }
  };


  // Local (browser) time, not UTC
  const now = new Date();
  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16); // "YYYY-MM-DDTHH:MM"

  const minDateTime = localISO; // allow any time from "now" in local timezone


  const startingPriceNumber = parseFloat(startingPrice || '0') || 0;
  const percentageNumber = parseFloat(dutchPercentage || '0') || 0;
  const decreaseAmount =
    startingPriceNumber > 0 && percentageNumber > 0
      ? (startingPriceNumber * percentageNumber) / 100
      : 0;

  return (
    <div className={styles.modal}>
      <div className={styles.createModalContent}>
        <h2 className={styles.modalTitle}>Create New Auction</h2>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Title *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="Enter item name"
              required
            />
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              rows={4}
              placeholder="Describe your item"
              required
            />
          </div>

          {/* Starting Price */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Starting Price ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              className={styles.input}
              placeholder="0.00"
              required
            />
          </div>

          {/* End Time */}
          <div className={styles.formGroup}>
            <label className={styles.label}>End Time *</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={minDateTime}
              className={styles.input}
              required
            />
          </div>

          {/* Auction Type */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Auction Type *</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="auctionType"
                  value="FORWARD"
                  checked={auctionType === 'FORWARD'}
                  onChange={() => setAuctionType('FORWARD')}
                  className={styles.radioInput}
                />
                <span>Forward Auction</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="auctionType"
                  value="DUTCH"
                  checked={auctionType === 'DUTCH'}
                  onChange={() => setAuctionType('DUTCH')}
                  className={styles.radioInput}
                />
                <span>Dutch Auction</span>
              </label>
            </div>
          </div>

          {/* Dutch Auction Fields */}
          {auctionType === 'DUTCH' && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Decrease Percentage (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="99"
                  value={dutchPercentage}
                  onChange={(e) => setDutchPercentage(e.target.value)}
                  className={styles.input}
                  placeholder="e.g., 5"
                  required
                />
                <p className={styles.calculationHint}>
                  Price decreases by this percentage each interval
                  {startingPriceNumber > 0 && percentageNumber > 0 && (
                    <> — {percentageNumber}% = ${decreaseAmount.toFixed(2)}</>
                  )}
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Decrease Interval *</label>
                <input
                  type="number"
                  min="1"
                  value={dutchInterval}
                  onChange={(e) => setDutchInterval(e.target.value)}
                  className={styles.input}
                  placeholder="e.g., 60"
                  required
                />
                <p className={styles.calculationHint}>
                  How often the price decreases (in seconds)
                </p>
              </div>
            </>
          )}

          {/* Image Upload */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Images ({images.length}/5)
            </label>
            
            {images.length < 5 && (
              <div
                className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.dropZoneContent}>
                  <div className={styles.uploadIcon}>📁</div>
                  <p>Drag & drop images here</p>
                  <p className={styles.dropZoneOr}>or</p>
                  <button
                    type="button"
                    className={styles.uploadButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Choose Files
                  </button>
                  <p style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.7 }}>
                    Max 5 images (JPG, PNG)
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />

            {/* Image Preview */}
            {images.length > 0 && (
              <div className={styles.imagePreviewContainer}>
                {images.map((img, idx) => (
                  <div key={idx} className={styles.imagePreviewItem}>
                    <img src={img} alt={`Preview ${idx + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className={styles.removeImageButton}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imageError && (
              <p className={styles.fieldError}>{imageError}</p>
            )}

          </div>

          {/* Submit Buttons */}
          <div className={styles.modalButtons}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// [Rest of EditItemModal component stays the same as before]
function EditItemModal({
  itemId,
  onClose,
  onSuccess,
}: {
  itemId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [item, setItem] = useState<AuctionItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<
    Array<{ data: string; format: string; order: number }>
  >([]);
  const [imageOrder, setImageOrder] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await itemsApi.getItem(itemId);
        setItem(data);
        setName(data.name);
        setDescription(data.description);
        const sortedImages = data.images.sort(
          (a: any, b: any) => a.order - b.order
        );
        setImages(sortedImages);
        setImageOrder(sortedImages.map((_: any, i: number) => i));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load item');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

  const handleReorderImage = (fromIndex: number, toIndex: number) => {
    const newOrder = [...imageOrder];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setImageOrder(newOrder);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: any = { name, description };
      if (
        JSON.stringify(imageOrder) !==
        JSON.stringify(images.map((_, i) => i))
      ) {
        payload.image_order = imageOrder;
      }
      await itemsApi.editItem(itemId, payload);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <div className={styles.loadingText}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <p className={styles.errorMessage}>Item not found.</p>
          <div className={styles.modalButtons}>
            <button onClick={onClose} className={styles.cancelButton}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Edit Item</h2>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.formGroup}>
          <label className={styles.label}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={styles.textarea}
          />
        </div>

        {images.length > 1 && (
          <div className={styles.imageReorderSection}>
            <label className={styles.imageReorderTitle}>Reorder Images</label>
            <div className={styles.imageReorderContainer}>
              {imageOrder.map((originalIndex, newIndex) => (
                <div
                  key={newIndex}
                  draggable
                  onDragStart={() => setDraggedIndex(newIndex)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedIndex !== null && draggedIndex !== newIndex) {
                      handleReorderImage(draggedIndex, newIndex);
                      setDraggedIndex(null);
                    }
                  }}
                  className={`${styles.draggableImage} ${
                    draggedIndex === newIndex ? styles.dragging : ''
                  }`}
                >
                  <img
                    src={`data:image/${images[originalIndex].format};base64,${images[originalIndex].data}`}
                    alt={`Image ${newIndex + 1}`}
                  />
                  <span className={styles.imageNumber}>{newIndex + 1}</span>
                </div>
              ))}
            </div>
            <p className={styles.dragHint}>Drag to reorder images</p>
          </div>
        )}

        <div className={styles.modalButtons}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
