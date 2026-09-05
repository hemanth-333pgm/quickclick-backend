export class SuccessResponse {
    static success<T = any>(
        message: string,
        data?: T,
        meta: Record<string, any> = {}
    ) {
        return {
            success: true,
            message,
            data: data || null,
            meta: {
                timestamp: new Date().toISOString(),
                ...meta
            }
        };
    }

    static paginated<T = any>(
        data: T[],
        total: number,
        page: number,
        limit: number,
        message: string = "Data retrieved successfully"
    ) {
        return {
            success: true,
            message,
            data,
            meta: {
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrevious: page > 1
                },
                timestamp: new Date().toISOString()
            }
        };
    }
}
