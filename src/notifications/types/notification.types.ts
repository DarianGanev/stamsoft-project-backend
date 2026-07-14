import {
  LISTING_NOTIFICATION_FIELDS,
  NOTIFICATION_TYPES,
} from '../constants';

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type ListingNotificationField =
  (typeof LISTING_NOTIFICATION_FIELDS)[number];
export type NotificationChangeValue = string | number | null;

export type NotificationChange = {
  field: ListingNotificationField;
  oldValue: NotificationChangeValue;
  newValue: NotificationChangeValue;
};

export type ListingReferenceChangeValues = Partial<
  Record<
    Extract<ListingNotificationField, 'brand' | 'model'>,
    Readonly<{ oldValue: string; newValue: string }>
  >
>;

export type Notification = {
  id: string;
  userId: string;
  listingId: string | null;
  type: NotificationType;
  listingTitle: string;
  listingImageUrl: string | null;
  changes: NotificationChange[];
  readAt: string | null;
  createdAt: string;
};

export type CreateListingNotificationInput = {
  listingId: string;
  listingOwnerId: string;
  includeListingOwner?: boolean;
  listingTitle: string;
  listingImageUrl: string | null;
  type: NotificationType;
  changes: NotificationChange[];
};
