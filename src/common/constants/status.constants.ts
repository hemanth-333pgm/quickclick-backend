export const UserStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    SUSPENDED: "SUSPENDED",
    PENDING: "PENDING",
    DELETED: "DELETED"
} as const;

export const RetailerStatus = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    SUSPENDED: "SUSPENDED",
    INACTIVE: "INACTIVE"
} as const;

export const DeliveryPartnerStatus = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    SUSPENDED: "SUSPENDED",
    OFFLINE: "OFFLINE",
    ONLINE: "ONLINE"
} as const;

export const OrderStatus = {
    PLACED: "PLACED",
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED",
    PREPARING: "PREPARING",
    READY_FOR_PICKUP: "READY_FOR_PICKUP",
    ASSIGNED: "ASSIGNED",
    PICKED_UP: "PICKED_UP",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    FAILED: "FAILED"
} as const;

export const PaymentStatus = {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    REFUNDED: "REFUNDED",
    CANCELLED: "CANCELLED"
} as const;

export const DeliveryAssignmentStatus = {
    OFFERED: "OFFERED",
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED",
    REACHED_STORE: "REACHED_STORE",
    PICKED_UP: "PICKED_UP",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED"
} as const;

export const UserRoles = {
    CUSTOMER: "CUSTOMER",
    RETAILER: "RETAILER",
    DELIVERY: "DELIVERY",
    ADMIN: "ADMIN",
    SUPER_ADMIN: "SUPER_ADMIN",
    DELIVERY_PARTNER: "DELIVERY_PARTNER",
} as const;

export type UserStatusType = typeof UserStatus[keyof typeof UserStatus];
export type RetailerStatusType = typeof RetailerStatus[keyof typeof RetailerStatus];
export type DeliveryPartnerStatusType = typeof DeliveryPartnerStatus[keyof typeof DeliveryPartnerStatus];
export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];
export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];
export type DeliveryAssignmentStatusType = typeof DeliveryAssignmentStatus[keyof typeof DeliveryAssignmentStatus];
export type UserRolesType = typeof UserRoles[keyof typeof UserRoles];


