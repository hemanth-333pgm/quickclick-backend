export class QueryOptimizer {
    static getDefaultProjection(model: string): Record<string, number> {
        const projections: Record<string, Record<string, number>> = {
            user: {
                password: 0,
                __v: 0,
                verificationToken: 0,
                resetPasswordToken: 0,
            },
            product: {
                __v: 0,
                reservedQty: 0,
                minStockThreshold: 0,
            },
            order: {
                __v: 0,
                statusHistory: 0,
            },
            retailer: {
                __v: 0,
                documents: 0,
            },
            deliveryAssignment: {
                __v: 0,
                routePolyline: 0,
            },
            zone: {
                __v: 0,
                boundaries: 0,
            },
        };

        return projections[model] || {};
    }

    static getListProjection(model: string): Record<string, number | any> {
        const projections: Record<string, Record<string, number | any>> = {
            product: {
                name: 1,
                price: 1,
                discountPrice: 1,
                imageUrl: 1,
                unit: 1,
                rating: 1,
                retailerId: 1,
                status: 1,
            },
            order: {
                orderNumber: 1,
                total: 1,
                status: 1,
                createdAt: 1,
                userId: 1,
                retailerId: 1,
            },
            retailer: {
                shopName: 1,
                address: 1,
                location: 1,
                rating: 1,
                isOpen: 1,
                imageUrl: 1,
            },
            user: {
                name: 1,
                mobile: 1,
                email: 1,
                role: 1,
                status: 1,
                avatarUrl: 1,
            },
        };

        return projections[model] || {};
    }

    static paginateOptions(page: number = 1, limit: number = 20, maxLimit: number = 100) {
        const safeLimit = Math.min(limit, maxLimit);
        const skip = (page - 1) * safeLimit;
        return {
            skip,
            limit: safeLimit,
        };
    }

    static getSortOptions(sortBy: string = "createdAt", order: "asc" | "desc" = "desc") {
        return {
            [sortBy]: order === "desc" ? -1 : 1,
        };
    }
}
