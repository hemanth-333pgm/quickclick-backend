import mongoose from "mongoose";
import { VerificationDocument } from "../models/document.model";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";
import { logger } from "../../../config/logger";
import { RetailerStatus, DeliveryPartnerStatus } from "../../../common/constants/status.constants";

export class VerificationService {
    async submitDocuments(
        userId: string,
        userType: "RETAILER" | "DELIVERY",
        documents: any[]
    ): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            let docRecord = await VerificationDocument.findOne({ userId });

            if (!docRecord) {
                docRecord = new VerificationDocument({
                    userId,
                    userType,
                    documents: [],
                    verificationStatus: "PENDING",
                    submittedAt: new Date(),
                });
            }

            for (const doc of documents) {
                docRecord.documents.push({
                    ...doc,
                    uploadedAt: new Date(),
                    status: "PENDING",
                });
            }

            await docRecord.save({ session });

            if (userType === "RETAILER") {
                const { Retailer } = await import("../../retailers/models/retailer.model");
                await Retailer.findOneAndUpdate(
                    { ownerId: userId },
                    { status: RetailerStatus.PENDING },
                    { session }
                );
            } else if (userType === "DELIVERY") {
                const { DeliveryPartner } = await import("../../delivery/models/delivery-partner.model");
                await DeliveryPartner.findOneAndUpdate(
                    { userId },
                    { status: DeliveryPartnerStatus.PENDING },
                    { session }
                );
            }

            await session.commitTransaction();
            return docRecord;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async verifyDocuments(
        documentId: string,
        adminId: string,
        decisions: Array<{
            documentIndex: number;
            status: "VERIFIED" | "REJECTED";
            rejectionReason?: string;
        }>,
        remarks?: string
    ): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const docRecord = await VerificationDocument.findById(documentId);
            if (!docRecord) {
                throw new AppError("Document record not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }

            for (const decision of decisions) {
                if (decision.documentIndex >= docRecord.documents.length) {
                    continue;
                }

                const doc = docRecord.documents[decision.documentIndex];
                doc.status = decision.status;
                doc.verifiedAt = new Date();
                doc.verifiedBy = new mongoose.Types.ObjectId(adminId);
                if (decision.rejectionReason) {
                    doc.rejectionReason = decision.rejectionReason;
                }
            }

            const allVerified = docRecord.documents.every((d) => d.status === "VERIFIED");
            const anyRejected = docRecord.documents.some((d) => d.status === "REJECTED");

            if (allVerified) {
                docRecord.verificationStatus = "VERIFIED";
                docRecord.verifiedAt = new Date();
                docRecord.verifiedBy = new mongoose.Types.ObjectId(adminId);
            } else if (anyRejected) {
                docRecord.verificationStatus = "REJECTED";
            } else {
                docRecord.verificationStatus = "INCOMPLETE";
            }

            docRecord.verificationRemarks = remarks;
            await docRecord.save({ session });

            if (docRecord.verificationStatus === "VERIFIED") {
                if (docRecord.userType === "RETAILER") {
                    const { Retailer } = await import("../../retailers/models/retailer.model");
                    await Retailer.findOneAndUpdate(
                        { ownerId: docRecord.userId },
                        { status: RetailerStatus.APPROVED },
                        { session }
                    );
                } else if (docRecord.userType === "DELIVERY") {
                    const { DeliveryPartner } = await import("../../delivery/models/delivery-partner.model");
                    await DeliveryPartner.findOneAndUpdate(
                        { userId: docRecord.userId },
                        { status: DeliveryPartnerStatus.APPROVED, isVerified: true },
                        { session }
                    );
                }
            }

            await session.commitTransaction();
            return docRecord;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getPendingVerifications(
        userType?: "RETAILER" | "DELIVERY"
    ): Promise<any[]> {
        const query: any = { verificationStatus: "PENDING" };
        if (userType) {
            query.userType = userType;
        }

        return await VerificationDocument.find(query)
            .populate("userId", "name email mobile")
            .sort({ submittedAt: 1 });
    }

    async getVerificationDetails(documentId: string): Promise<any> {
        return await VerificationDocument.findById(documentId)
            .populate("userId", "name email mobile")
            .populate("verifiedBy", "name email");
    }

    async getApprovalDashboard(adminId: string): Promise<any> {
        const [pendingDocuments, totalDocuments] = await Promise.all([
            VerificationDocument.countDocuments({ verificationStatus: "PENDING" }),
            VerificationDocument.countDocuments(),
        ]);

        const recentDocuments = await VerificationDocument.find({ verificationStatus: "PENDING" })
            .populate("userId", "name email mobile")
            .sort({ submittedAt: -1 })
            .limit(10);

        return {
            summary: {
                pendingDocuments,
                totalDocuments,
            },
            recentDocuments,
            lastUpdated: new Date().toISOString(),
        };
    }
}
