import mongoose from "mongoose";
import { DeliveryAssignment } from "../models/delivery-assignment.model";
import { DeliveryPartner } from "../models/delivery-partner.model";
import { Order } from "../../orders/models/order.model";
import { OrderStatus, DeliveryAssignmentStatus } from "../../../common/constants/status.constants";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";
import { logger } from "../../../config/logger";

export class DeliveryAssignmentService {
    async findNearestAvailablePartners(
        retailerId: string,
        dropoffLat: number,
        dropoffLng: number,
        maxDistance: number = 10,
        limit: number = 5
    ): Promise<any[]> {
        const partners = await DeliveryPartner.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [dropoffLng, dropoffLat]
                    },
                    distanceField: "distance",
                    maxDistance: maxDistance * 1000,
                    spherical: true,
                    query: {
                        status: "APPROVED",
                        availability: "ONLINE",
                        isVerified: true,
                        $expr: {
                            $lt: ["$currentDeliveries", "$maxConcurrentDeliveries"]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "deliveryassignments",
                    let: { partnerId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$deliveryPartnerId", "$$partnerId"] },
                                        { $in: ["$status", ["OFFERED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"]] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "activeAssignments"
                }
            },
            {
                $addFields: {
                    activeCount: { $size: "$activeAssignments" }
                }
            },
            {
                $match: {
                    activeCount: 0
                }
            },
            {
                $project: {
                    userId: 1,
                    vehicleType: 1,
                    rating: 1,
                    totalDeliveries: 1,
                    currentDeliveries: 1,
                    maxConcurrentDeliveries: 1,
                    distance: 1,
                    earningsToday: 1
                }
            },
            {
                $sort: {
                    rating: -1,
                    totalDeliveries: -1,
                    distance: 1
                }
            },
            {
                $limit: limit
            }
        ]);

        return partners;
    }

    async assignDeliveryPartner(
        orderId: string,
        partnerId: string,
        adminId?: string
    ): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const order = await Order.findById(orderId).session(session);
            if (!order) {
                throw new AppError("Order not found", 404, ErrorCodes.ORDER_NOT_FOUND);
            }

            if (order.status !== OrderStatus.READY_FOR_PICKUP) {
                throw new AppError(
                    "Order must be READY_FOR_PICKUP to assign delivery partner",
                    422,
                    ErrorCodes.ORDER_INVALID_STATE
                );
            }

            const existingAssignment = await DeliveryAssignment.findOne({
                orderId: orderId,
                status: { $in: ["OFFERED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"] }
            }).session(session);

            if (existingAssignment) {
                throw new AppError(
                    "Order already has an active assignment",
                    409,
                    ErrorCodes.ASSIGNMENT_CONFLICT
                );
            }

            const partner = await DeliveryPartner.findOneAndUpdate(
                {
                    _id: partnerId,
                    status: "APPROVED",
                    availability: "ONLINE",
                    isVerified: true,
                    $expr: {
                        $lt: ["$currentDeliveries", "$maxConcurrentDeliveries"]
                    }
                },
                {
                    $inc: { currentDeliveries: 1 },
                    $set: { currentAssignmentId: null }
                },
                {
                    new: true,
                    session
                }
            );

            if (!partner) {
                throw new AppError(
                    "Delivery partner is not available",
                    409,
                    ErrorCodes.DELIVERY_PARTNER_UNAVAILABLE
                );
            }

            const assignment = new DeliveryAssignment({
                orderId: orderId,
                deliveryPartnerId: partnerId,
                retailerId: order.retailerId,
                status: DeliveryAssignmentStatus.OFFERED,
                offeredAt: new Date(),
                pickupLocation: {
                    latitude: 0,
                    longitude: 0,
                    address: "Store address"
                },
                dropoffLocation: {
                    latitude: order.addressSnapshot.latitude,
                    longitude: order.addressSnapshot.longitude,
                    address: `${order.addressSnapshot.line1}, ${order.addressSnapshot.city}`
                },
                estimatedDeliveryTime: new Date(Date.now() + 45 * 60000)
            });

            await assignment.save({ session });

            await DeliveryPartner.findByIdAndUpdate(
                partnerId,
                { $set: { currentAssignmentId: assignment._id } },
                { session }
            );

            order.status = OrderStatus.ASSIGNED;
            order.deliveryPartnerId = new mongoose.Types.ObjectId(partnerId);
            order.statusHistory.push({
                fromStatus: OrderStatus.READY_FOR_PICKUP,
                toStatus: OrderStatus.ASSIGNED,
                actorId: adminId ? new mongoose.Types.ObjectId(adminId) : undefined,
                actorRole: adminId ? "ADMIN" : "SYSTEM",
                reason: `Assigned to delivery partner ${partnerId}`,
                timestamp: new Date()
            });
            await order.save({ session });

            await session.commitTransaction();

            return {
                assignment,
                partner,
                order
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async acceptAssignment(
        assignmentId: string,
        deliveryPartnerId: string
    ): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const assignment = await DeliveryAssignment.findOne({
                _id: assignmentId,
                deliveryPartnerId: deliveryPartnerId,
                status: DeliveryAssignmentStatus.OFFERED
            }).session(session);

            if (!assignment) {
                throw new AppError(
                    "Assignment not found or not offered",
                    404,
                    ErrorCodes.ASSIGNMENT_NOT_FOUND
                );
            }

            const partner = await DeliveryPartner.findOne({
                _id: deliveryPartnerId,
                status: "APPROVED",
                availability: "ONLINE",
                isVerified: true
            }).session(session);

            if (!partner) {
                throw new AppError(
                    "Partner not available",
                    409,
                    ErrorCodes.DELIVERY_PARTNER_UNAVAILABLE
                );
            }

            assignment.status = DeliveryAssignmentStatus.ACCEPTED;
            assignment.acceptedAt = new Date();
            await assignment.save({ session });

            const order = await Order.findById(assignment.orderId).session(session);
            if (order && order.status === OrderStatus.ASSIGNED) {
                order.statusHistory.push({
                    fromStatus: OrderStatus.ASSIGNED,
                    toStatus: OrderStatus.ASSIGNED,
                    actorId: new mongoose.Types.ObjectId(deliveryPartnerId),
                    actorRole: "DELIVERY",
                    reason: "Delivery partner accepted assignment",
                    timestamp: new Date()
                });
                await order.save({ session });
            }

            await session.commitTransaction();

            return {
                assignment,
                order
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async updateDeliveryProgress(
        assignmentId: string,
        deliveryPartnerId: string,
        updateData: {
            status: string;
            latitude?: number;
            longitude?: number;
            notes?: string;
            otpCode?: string;
        }
    ): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const assignment = await DeliveryAssignment.findOne({
                _id: assignmentId,
                deliveryPartnerId: deliveryPartnerId
            }).session(session);

            if (!assignment) {
                throw new AppError(
                    "Assignment not found",
                    404,
                    ErrorCodes.ASSIGNMENT_NOT_FOUND
                );
            }

            const validTransitions: Record<string, string[]> = {
                [DeliveryAssignmentStatus.ACCEPTED]: [
                    DeliveryAssignmentStatus.REACHED_STORE,
                    DeliveryAssignmentStatus.PICKED_UP,
                    DeliveryAssignmentStatus.CANCELLED
                ],
                [DeliveryAssignmentStatus.REACHED_STORE]: [
                    DeliveryAssignmentStatus.PICKED_UP,
                    DeliveryAssignmentStatus.CANCELLED
                ],
                [DeliveryAssignmentStatus.PICKED_UP]: [
                    DeliveryAssignmentStatus.OUT_FOR_DELIVERY,
                    DeliveryAssignmentStatus.CANCELLED
                ],
                [DeliveryAssignmentStatus.OUT_FOR_DELIVERY]: [
                    DeliveryAssignmentStatus.DELIVERED,
                    DeliveryAssignmentStatus.CANCELLED
                ]
            };

            const allowed = validTransitions[assignment.status] || [];
            if (!allowed.includes(updateData.status)) {
                throw new AppError(
                    `Invalid state transition from ${assignment.status} to ${updateData.status}`,
                    422,
                    ErrorCodes.ORDER_INVALID_STATE
                );
            }

            const oldStatus = assignment.status;
            assignment.status = updateData.status as any;

            switch (updateData.status) {
                case DeliveryAssignmentStatus.REACHED_STORE:
                    assignment.reachedStoreAt = new Date();
                    break;
                case DeliveryAssignmentStatus.PICKED_UP:
                    assignment.pickupAt = new Date();
                    await Order.findByIdAndUpdate(
                        assignment.orderId,
                        {
                            status: OrderStatus.PICKED_UP,
                            $push: {
                                statusHistory: {
                                    fromStatus: OrderStatus.ASSIGNED,
                                    toStatus: OrderStatus.PICKED_UP,
                                    actorId: new mongoose.Types.ObjectId(deliveryPartnerId),
                                    actorRole: "DELIVERY",
                                    reason: "Picked up from store",
                                    timestamp: new Date()
                                }
                            }
                        },
                        { session }
                    );
                    break;
                case DeliveryAssignmentStatus.OUT_FOR_DELIVERY:
                    assignment.outForDeliveryAt = new Date();
                    await Order.findByIdAndUpdate(
                        assignment.orderId,
                        {
                            status: OrderStatus.OUT_FOR_DELIVERY,
                            $push: {
                                statusHistory: {
                                    fromStatus: OrderStatus.PICKED_UP,
                                    toStatus: OrderStatus.OUT_FOR_DELIVERY,
                                    actorId: new mongoose.Types.ObjectId(deliveryPartnerId),
                                    actorRole: "DELIVERY",
                                    reason: "Out for delivery",
                                    timestamp: new Date()
                                }
                            }
                        },
                        { session }
                    );
                    break;
                case DeliveryAssignmentStatus.DELIVERED:
                    if (updateData.otpCode) {
                        // Verify OTP logic here
                    }
                    assignment.deliveredAt = new Date();
                    assignment.actualDeliveryTime = new Date();
                    
                    await Order.findByIdAndUpdate(
                        assignment.orderId,
                        {
                            status: OrderStatus.DELIVERED,
                            actualDeliveryTime: new Date(),
                            $push: {
                                statusHistory: {
                                    fromStatus: OrderStatus.OUT_FOR_DELIVERY,
                                    toStatus: OrderStatus.DELIVERED,
                                    actorId: new mongoose.Types.ObjectId(deliveryPartnerId),
                                    actorRole: "DELIVERY",
                                    reason: "Delivered successfully",
                                    timestamp: new Date()
                                }
                            }
                        },
                        { session }
                    );

                    await DeliveryPartner.findByIdAndUpdate(
                        deliveryPartnerId,
                        {
                            $inc: {
                                totalDeliveries: 1,
                                earningsToday: assignment.earnings || 0,
                                earningsThisWeek: assignment.earnings || 0,
                                earningsThisMonth: assignment.earnings || 0,
                                currentDeliveries: -1
                            },
                            $set: { currentAssignmentId: null }
                        },
                        { session }
                    );
                    break;
                case DeliveryAssignmentStatus.CANCELLED:
                    await DeliveryPartner.findByIdAndUpdate(
                        deliveryPartnerId,
                        {
                            $inc: { currentDeliveries: -1 },
                            $set: { currentAssignmentId: null }
                        },
                        { session }
                    );
                    break;
            }

            if (updateData.latitude && updateData.longitude) {
                assignment.currentLocation = {
                    latitude: updateData.latitude,
                    longitude: updateData.longitude,
                    updatedAt: new Date()
                };
            }

            if (updateData.notes) {
                assignment.notes = updateData.notes;
            }

            await assignment.save({ session });

            await session.commitTransaction();

            return {
                assignment,
                oldStatus
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}
