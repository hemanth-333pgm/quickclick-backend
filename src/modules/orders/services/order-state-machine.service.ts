import { OrderStatus } from "../../../common/constants/status.constants";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export interface StateTransition {
    from: string;
    to: string;
    allowedRoles: string[];
    validate?: (order: any, context?: any) => Promise<boolean> | boolean;
}

export class OrderStateMachine {
    private static transitions: StateTransition[] = [
        { from: OrderStatus.PLACED, to: OrderStatus.CANCELLED, allowedRoles: ["CUSTOMER", "ADMIN"] },
        { from: OrderStatus.PLACED, to: OrderStatus.ACCEPTED, allowedRoles: ["RETAILER", "ADMIN"] },
        { from: OrderStatus.PLACED, to: OrderStatus.REJECTED, allowedRoles: ["RETAILER", "ADMIN"] },
        { from: OrderStatus.ACCEPTED, to: OrderStatus.PREPARING, allowedRoles: ["RETAILER", "ADMIN"] },
        { from: OrderStatus.ACCEPTED, to: OrderStatus.CANCELLED, allowedRoles: ["RETAILER", "ADMIN"] },
        { from: OrderStatus.PREPARING, to: OrderStatus.READY_FOR_PICKUP, allowedRoles: ["RETAILER", "ADMIN"] },
        { from: OrderStatus.PREPARING, to: OrderStatus.CANCELLED, allowedRoles: ["RETAILER", "ADMIN"] },
        { from: OrderStatus.READY_FOR_PICKUP, to: OrderStatus.ASSIGNED, allowedRoles: ["ADMIN"] },
        { from: OrderStatus.ASSIGNED, to: OrderStatus.PICKED_UP, allowedRoles: ["DELIVERY", "ADMIN"] },
        { from: OrderStatus.ASSIGNED, to: OrderStatus.CANCELLED, allowedRoles: ["ADMIN"] },
        { from: OrderStatus.PICKED_UP, to: OrderStatus.OUT_FOR_DELIVERY, allowedRoles: ["DELIVERY", "ADMIN"] },
        { from: OrderStatus.OUT_FOR_DELIVERY, to: OrderStatus.DELIVERED, allowedRoles: ["DELIVERY", "ADMIN"] },
        { from: OrderStatus.OUT_FOR_DELIVERY, to: OrderStatus.CANCELLED, allowedRoles: ["ADMIN"] },
    ];

    static getValidTransitions(currentStatus: string): string[] {
        return this.transitions
            .filter(t => t.from === currentStatus)
            .map(t => t.to);
    }

    static canTransition(currentStatus: string, newStatus: string, actorRole: string, order: any, context?: any): boolean {
        const transition = this.transitions.find(t => t.from === currentStatus && t.to === newStatus);
        if (!transition) return false;
        if (!transition.allowedRoles.includes(actorRole)) return false;
        if (transition.validate) {
            const result = transition.validate(order, context);
            if (result instanceof Promise) {
                return true;
            }
            return result;
        }
        return true;
    }

    static async validateTransition(currentStatus: string, newStatus: string, actorRole: string, order: any, context?: any): Promise<void> {
        const transition = this.transitions.find(t => t.from === currentStatus && t.to === newStatus);
        
        if (!transition) {
            throw new AppError(
                `Invalid state transition from ${currentStatus} to ${newStatus}`,
                422,
                ErrorCodes.ORDER_INVALID_STATE
            );
        }

        if (!transition.allowedRoles.includes(actorRole)) {
            throw new AppError(
                `Role ${actorRole} not allowed for transition from ${currentStatus} to ${newStatus}`,
                403,
                ErrorCodes.ORDER_INVALID_STATE
            );
        }

        if (this.isTerminalState(currentStatus)) {
            throw new AppError(
                `Cannot transition from terminal state ${currentStatus}`,
                422,
                ErrorCodes.ORDER_INVALID_STATE
            );
        }

        if (transition.validate) {
            const result = transition.validate(order, context);
            if (result instanceof Promise) {
                const isValid = await result;
                if (!isValid) {
                    throw new AppError(
                        `Transition validation failed: ${currentStatus} -> ${newStatus}`,
                        422,
                        ErrorCodes.ORDER_INVALID_STATE
                    );
                }
            } else if (!result) {
                throw new AppError(
                    `Transition validation failed: ${currentStatus} -> ${newStatus}`,
                    422,
                    ErrorCodes.ORDER_INVALID_STATE
                );
            }
        }
    }

    static getNextStates(currentStatus: string): string[] {
        return this.transitions
            .filter(t => t.from === currentStatus)
            .map(t => t.to);
    }

    static isTerminalState(status: string): boolean {
        return [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REJECTED].includes(status as any);
    }

    static canCustomerCancel(order: any): boolean {
        const cancelableStates = [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING];
        return cancelableStates.includes(order.status);
    }
}
