export interface Image {
  id?: number;
  data: string;
  format: 'jpeg' | 'png' | 'jpg';
  order: number;
}

export interface AuctionItem {
  id: number;
  name: string;
  description: string;
  starting_price: string;
  current_price: string;
  seller_username: string;
  current_bidder_username: string | null;
  is_active: boolean;
  images: Image[];
  thumbnail: string;
  auction_type: 'FORWARD' | 'REVERSE' | 'SEALED_BID';
  end_time: string;
  created_at: string;
  auction_status: 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'PENDING';
  remaining_time: string;
  bid_history?: Bid[];
}

export interface ItemDetailPage extends AuctionItem {
  // Additional fields for detail view
}

export interface BidItem extends AuctionItem {
  // Additional fields for bid tracking
  bid_amount?: string;
  highest_bidder?: boolean;
}

export interface Bid {
  id: number;
  bidder: string;
  amount: string;
  timestamp: string;
}

export interface CreateItemRequest {
  name: string;
  description: string;
  starting_price: string;
  auction_type: 'FORWARD' | 'REVERSE' | 'SEALED_BID';
  end_time: string;
  images_data?: string[]; // base64 encoded images
}

export interface EditItemRequest {
  name?: string;
  description?: string;
  image_order?: number[]; // reorder images by their current indices
}

export interface UserProfile {
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

// Component Props Types

export interface ItemCardProps {
  item: AuctionItem;
  isBid?: boolean;
  onEdit?: (itemId: number) => void;
  onDelete?: (itemId: number) => void;
}

export interface ImageCarouselProps {
  images: Image[];
  thumbnail: string;
  itemName: string;
}

export interface EditItemModalProps {
  itemId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export interface DeleteConfirmModalProps {
  itemId: number;
  itemName: string;
  onConfirm: (itemId: number) => void;
  onCancel: () => void;
}

export interface ProfileTabsProps {
  activeTab: 'items' | 'bids';
  onTabChange: (tab: 'items' | 'bids') => void;
  itemCount: number;
  bidCount: number;
}

export interface ImageUploadModalProps {
  onClose: () => void;
  onUpload: (images: string[]) => void;
  maxImages?: number;
}

// Hook return types

export interface UseItemResponse {
  item: AuctionItem | null;
  loading: boolean;
  error: string | null;
}

export interface UseItemsResponse {
  items: AuctionItem[];
  loading: boolean;
  error: string | null;
}

export interface UseEditItemResponse {
  editItem: (itemId: number, data: EditItemRequest) => Promise<AuctionItem>;
  loading: boolean;
  error: string | null;
}

export interface UseDeleteItemResponse {
  deleteItem: (itemId: number) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface UseCreateItemResponse {
  createItem: (data: CreateItemRequest) => Promise<AuctionItem>;
  loading: boolean;
  error: string | null;
}

export interface UseAuthResponse {
  isAuthenticated: boolean;
  loading: boolean;
  username: string | null;
}

// Form states

export interface EditItemFormState {
  name: string;
  description: string;
  imageOrder: number[];
}

export interface CreateItemFormState {
  name: string;
  description: string;
  starting_price: string;
  auction_type: 'FORWARD' | 'REVERSE' | 'SEALED_BID';
  end_time: string;
  images: File[];
}