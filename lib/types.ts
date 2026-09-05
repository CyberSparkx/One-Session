export const Role = {
  ADMIN: "ADMIN",
  CREATOR: "CREATOR",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const BookingStatus = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  COMPLETED: "COMPLETED",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const PaymentStatus = {
  CREATED: "CREATED",
  CAPTURED: "CAPTURED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PayoutStatus = {
  NOT_PAID_OUT: "NOT_PAID_OUT",
  ROUTE_TRANSFERRED: "ROUTE_TRANSFERRED",
  MANUALLY_PAID: "MANUALLY_PAID",
} as const;
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];

export interface CreatorPayoutDetails {
  type: "bank" | "upi" | "razorpay_route";
  bankAccount?: string;
  ifsc?: string;
  accountHolderName?: string;
  upiId?: string;
  routeAccountId?: string;
}
