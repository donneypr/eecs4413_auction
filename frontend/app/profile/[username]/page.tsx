'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { userApi, itemsApi } from '@/lib/api';
import type { AuctionItem } from '@/lib/types';

interface BidItem extends AuctionItem {
  remaining_time: string;
  bid_amount?: string;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState<'items' | 'bids'>('items');
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function fetchData(uname: string) {
    try {
      setLoading(true);
      const [itemsData, bidsData] = await Promise.all([
        userApi.getItems(uname),
        userApi.getBids(uname),
      ]);
      setItems(itemsData);
      setBids(bidsData as BidItem[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof username === 'string' && username) {
      fetchData(username);
    }
  }, [username]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDeleteItem = async (itemId: number) => {
    try {
      await itemsApi.deleteItem(itemId);
      setItems((prev) => prev.filter((it) => it.id !== itemId));
      setDeleteConfirmId(null);
      setToast({ message: 'Item deleted successfully', type: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const ItemCard = ({ item, isBid = false }: { item: AuctionItem | BidItem; isBid?: boolean }) => (
    <div className={styles.itemCard}>
      <div className={styles.itemImage}>
        <Link href={`/items/${item.id}`}>
          {item.thumbnail ? (
            <img src={item.thumbnail} alt={item.name} className={styles.itemImageImg} />
          ) : (
            <div className={styles.itemImageImg}>No image</div>
          )}
        </Link>
        <span className={`${styles.statusBadge} ${item.is_active ? styles.statusActive : styles.statusEnded}`}>
          {item.is_active ? 'Active' : 'Ended'}
        </span>
      </div>
      <div className={styles.itemContent}>
        <h3 className={styles.itemName}>
          <Link href={`/items/${item.id}`}>{item.name}</Link>
        </h3>
        <div className={styles.priceSection}>
          <span className={styles.priceLabel}>Price:</span>
          <span className={styles.price}>${parseFloat(item.current_price).toFixed(2)}</span>
        </div>
        {isBid && 'remaining_time' in item && (
          <div className={styles.timeSection}>
            <span className={styles.timeLabel}>Time Left:</span>
            <span className={styles.timeValue}>{item.remaining_time}</span>
          </div>
        )}
        {!isBid && (
          <div className={styles.actions}>
            <button onClick={() => setEditingId(item.id)} className={styles.editButton}>
              Edit
            </button>
            <button
              onClick={() => setDeleteConfirmId(item.id)}
              className={styles.deleteButton}
              title="Delete item"
              aria-label="Delete item"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (!username || loading) {
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.loadingText}>Loading profile...</p>
      </div>
    );
  }

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
          </div>
          
          {/* Create Item Button */}
          {activeTab === 'items' && (
            <button onClick={() => setShowCreateModal(true)} className={styles.createButton}>
              + Create Item
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === 'items' ? (
          <div className={styles.grid}>
            {items.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>You haven't listed any items yet.</p>
              </div>
            ) : (
              <>
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {bids.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>You haven't placed any bids yet.</p>
              </div>
            ) : (
              <>
                {bids.map((bid) => (
                  <ItemCard key={bid.id} item={bid} isBid />
                ))}
              </>
            )}
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]}`}>
            {toast.message}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId !== null && (
          <div className={styles.modal} onClick={() => setDeleteConfirmId(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>Delete Item?</h2>
              <p className={styles.confirmMessage}>Are you sure you want to delete this item?</p>
              <p className={styles.confirmWarning}>This action cannot be undone.</p>
              <div className={styles.confirmButtons}>
                <button onClick={() => setDeleteConfirmId(null)} className={styles.confirmCancel}>
                  Cancel
                </button>
                <button onClick={() => handleDeleteItem(deleteConfirmId)} className={styles.confirmDelete}>
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
              fetchData(username);
              setToast({ message: 'Item updated successfully', type: 'success' });
            }}
          />
        )}

        {/* Create Item Modal */}
        {showCreateModal && (
          <CreateItemModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchData(username);
              setToast({ message: 'Item created successfully!', type: 'success' });
            }}
          />
        )}
      </div>
    </div>
  );
}

// Edit Item Modal Component (keep existing)
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
  const [images, setImages] = useState<Array<any>>([]);
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
        const sortedImages = data.images.sort((a: any, b: any) => a.order - b.order);
        setImages(sortedImages);
        setImageOrder(sortedImages.map((_: any, i: number) => i));
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
      if (JSON.stringify(imageOrder) !== JSON.stringify(images.map((_, i) => i))) {
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
        <div className={styles.modalContent}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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
                  key={originalIndex}
                  draggable
                  onDragStart={() => setDraggedIndex(newIndex)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedIndex !== null && draggedIndex !== newIndex) {
                      handleReorderImage(draggedIndex, newIndex);
                    }
                    setDraggedIndex(null);
                  }}
                  className={`${styles.draggableImage} ${
                    draggedIndex === newIndex ? styles.dragging : ''
                  }`}
                >
                  <img
                    src={`data:image/${images[originalIndex].format};base64,${images[originalIndex].data}`}
                    alt={`Image ${newIndex + 1}`}
                  />
                  <div className={styles.imageNumber}>{newIndex + 1}</div>
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
          <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// CREATE ITEM MODAL COMPONENT
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
  const [auctionType, setAuctionType] = useState<'FORWARD' | 'DUTCH'>('FORWARD');
  const [endTime, setEndTime] = useState('');
  const [dutchDecreasePercentage, setDutchDecreasePercentage] = useState('5');
  const [dutchDecreaseInterval, setDutchDecreaseInterval] = useState('5');
  const [images, setImages] = useState<Array<{ data: string; format: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    if (images.length + files.length > 5) {
      setErrors({ ...errors, images: 'Maximum 5 images allowed' });
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, images: 'Only image files are allowed' });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        const format = file.type.split('/')[1];
        setImages((prev) => [...prev, { data: base64String, format }]);
        setErrors((prev) => ({ ...prev, images: '' }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!startingPrice || parseFloat(startingPrice) <= 0) {
      newErrors.startingPrice = 'Valid starting price is required';
    }
    if (!endTime) newErrors.endTime = 'End time is required';
    if (images.length === 0) newErrors.images = 'At least 1 image is required';

    if (auctionType === 'DUTCH') {
      if (!dutchDecreasePercentage || parseFloat(dutchDecreasePercentage) <= 0) {
        newErrors.dutchDecreasePercentage = 'Valid percentage is required';
      }
      if (!dutchDecreaseInterval || parseFloat(dutchDecreaseInterval) <= 0) {
        newErrors.dutchDecreaseInterval = 'Valid interval is required';
      }

      if (!dutchDecreaseInterval) {
      newErrors.dutchDecreaseInterval = 'Interval is required';
    } else {
      const intervalValue = parseFloat(dutchDecreaseInterval);
      if (intervalValue <= 0) {
        newErrors.dutchDecreaseInterval = 'Interval must be greater than 0';
      } else if (!Number.isInteger(intervalValue)) {
        newErrors.dutchDecreaseInterval = 'Only whole numbers are accepted';
      }
    }
  }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      setErrors({});

      const payload: any = {
        name: name.trim(),
        description: description.trim(),
        starting_price: parseFloat(startingPrice),
        auction_type: auctionType,
        end_time: endTime,
        images_data: images.map(img => img.data),
      };

      if (auctionType === 'DUTCH') {
        payload.dutch_decrease_percentage = parseFloat(dutchDecreasePercentage);
        payload.dutch_decrease_interval = parseFloat(dutchDecreaseInterval);
      }

      await itemsApi.createItem(payload);
      onSuccess();
    } catch (err: any) {
      setErrors({ submit: err?.error || err?.message || 'Failed to create item' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.createModalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Create New Item</h2>

        {errors.submit && <div className={styles.errorMessage}>{errors.submit}</div>}

        {/* Name */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            placeholder="Enter item name"
          />
          {errors.name && <div className={styles.fieldError}>{errors.name}</div>}
        </div>

        {/* Description */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={styles.textarea}
            placeholder="Describe your item..."
          />
          {errors.description && <div className={styles.fieldError}>{errors.description}</div>}
        </div>

        {/* Starting Price */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Starting Price ($) *</label>
          <input
            type="number"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
            className={styles.input}
            placeholder="0.00"
            min="0.01"
            step="0.01"
          />
          {errors.startingPrice && <div className={styles.fieldError}>{errors.startingPrice}</div>}
        </div>

        {/* End Time */}
        <div className={styles.formGroup}>
          <label className={styles.label}>End Time *</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={styles.input}
            min={new Date().toISOString().slice(0, 16)}
          />
          {errors.endTime && <div className={styles.fieldError}>{errors.endTime}</div>}
        </div>

        {/* Image Upload */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Images * (1-5 images)</label>
          <div
            className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInput}
              style={{ display: 'none' }}
              disabled={images.length >= 5}
            />
            <div className={styles.dropZoneContent}>
              <div className={styles.uploadIcon}>📁</div>
              <p>Drag and drop images here</p>
              <p className={styles.dropZoneOr}>or</p>
              <button type="button" className={styles.uploadButton}>
                Choose Files
              </button>
            </div>
          </div>
          {errors.images && <div className={styles.fieldError}>{errors.images}</div>}
          
          {images.length > 0 && (
            <div className={styles.imagePreviewContainer}>
              {images.map((img, index) => (
                <div key={index} className={styles.imagePreviewItem}>
                  <img src={img.data} alt={`Preview ${index + 1}`} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className={styles.removeImageButton}
                    type="button"
                  >
                    ✕
                  </button>
                  <div className={styles.imageNumber}>{index + 1}</div>
                </div>
              ))}
            </div>
          )}
          <p className={styles.dragHint}>{images.length}/5 images uploaded</p>
        </div>

        {/* Auction Type */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Auction Type *</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="FORWARD"
                checked={auctionType === 'FORWARD'}
                onChange={(e) => setAuctionType(e.target.value as 'FORWARD')}
                className={styles.radioInput}
              />
              <span>Forward Auction (Price increases)</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="DUTCH"
                checked={auctionType === 'DUTCH'}
                onChange={(e) => setAuctionType(e.target.value as 'DUTCH')}
                className={styles.radioInput}
              />
              <span>Dutch Auction (Price decreases)</span>
            </label>
          </div>
        </div>

        {/* Dutch-specific fields */}
        {auctionType === 'DUTCH' && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Price Decrease % (per interval)</label>
              <input
                type="number"
                value={dutchDecreasePercentage}
                onChange={(e) => setDutchDecreasePercentage(e.target.value)}
                className={styles.input}
                placeholder="1"
                min="1"
                max="50"
                step="1"
              />
              {/* Dynamic calculation display */}
              {startingPrice && dutchDecreasePercentage && parseFloat(startingPrice) > 0 && parseFloat(dutchDecreasePercentage) > 0 && (
                <div className={styles.calculationHint}>
                  {dutchDecreasePercentage}% = ${((parseFloat(startingPrice) * parseFloat(dutchDecreasePercentage)) / 100).toFixed(2)}
                </div>
              )}
              {errors.dutchDecreasePercentage && (
                <div className={styles.fieldError}>{errors.dutchDecreasePercentage}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Decrease Interval (seconds)</label>
              <input
                type="number"
                value={dutchDecreaseInterval}
                onChange={(e) => setDutchDecreaseInterval(e.target.value)}
                className={styles.input}
                placeholder="60"
                min="1"
                step="1"
              />
              {errors.dutchDecreaseInterval && (
                <div className={styles.fieldError}>{errors.dutchDecreaseInterval}</div>
              )}
            </div>
          </>
        )}


        <div className={styles.modalButtons}>
          <button onClick={onClose} className={styles.cancelButton} disabled={saving}>
            Cancel
          </button>
          <button onClick={handleCreate} className={styles.saveButton} disabled={saving}>
            {saving ? 'Creating...' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
