'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import { userApi, itemsApi } from '@/lib/api';

interface AuctionItem {
  id: number;
  name: string;
  description: string;
  starting_price: string;
  current_price: string;
  seller_username: string;
  current_bidder_username: string | null;
  is_active: boolean;
  images: Array<{ data: string; format: string; order: number }>;
  thumbnail: string;
}

interface BidItem extends AuctionItem {
  remaining_time: string;
  bid_amount?: string;
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [activeTab, setActiveTab] = useState<'items' | 'bids'>('items');
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

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
      setBids(bidsData);
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
      setItems(items.filter((item) => item.id !== itemId));
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const ItemCard = ({ item, isBid = false }: { item: AuctionItem | BidItem; isBid?: boolean }) => (
    <div className={styles.itemCard}>
      <a href={`/items/${item.id}`}>
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
      </a>

      <div className={styles.itemContent}>
        <a href={`/items/${item.id}`}>
          <h3 className={styles.itemName}>{item.name}</h3>
        </a>

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
    <button
      onClick={() => setEditingId(item.id)}
      className={styles.editButton}
    >
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingText}>Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        <div className={styles.header}>
          <h1 className={styles.title}>{username}&apos;s Profile</h1>
          <p className={styles.subtitle}>View your items and bids</p>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        {/* Tabs */}
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

        {/* Content */}
        {activeTab === 'items' ? (
          <div>
            {items.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>You haven&apos;t listed any items yet.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} isBid={false} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {bids.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>You haven&apos;t placed any bids yet.</p>
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
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Delete Item?</h2>
            <p className={styles.confirmMessage}>
              Are you sure you want to delete this item?
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
    </div>
  );
}

// Edit Item Modal Component
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
  const [images, setImages] = useState<Array<{ data: string; format: string; order: number }>>([]);
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
        <div className={styles.modalContent}>
          <div className={styles.loadingText}>Loading...</div>
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