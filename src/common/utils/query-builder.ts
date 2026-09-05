import { QueryOptimizer } from "./query-optimizer";

export class QueryBuilder<T> {
    private query: any = {};
    private sort: any = {};
    private projection: any = {};
    private skip: number = 0;
    private limit: number = 20;
    private populate: any[] = [];

    // Filter methods
    where(field: string, value: any): this {
        if (value !== undefined && value !== null && value !== "") {
            this.query[field] = value;
        }
        return this;
    }

    whereIn(field: string, values: any[]): this {
        if (values && values.length > 0) {
            this.query[field] = { $in: values };
        }
        return this;
    }

    whereBetween(field: string, min: any, max: any): this {
        if (min !== undefined && max !== undefined) {
            this.query[field] = { $gte: min, $lte: max };
        }
        return this;
    }

    whereGt(field: string, value: any): this {
        if (value !== undefined) {
            this.query[field] = { $gt: value };
        }
        return this;
    }

    whereLt(field: string, value: any): this {
        if (value !== undefined) {
            this.query[field] = { $lt: value };
        }
        return this;
    }

    whereLike(field: string, value: string): this {
        if (value) {
            this.query[field] = { $regex: value, $options: "i" };
        }
        return this;
    }

    whereText(value: string): this {
        if (value) {
            this.query.$text = { $search: value };
        }
        return this;
    }

    whereGeoNear(lat: number, lng: number, maxDistance: number = 10000): this {
        if (lat && lng) {
            this.query.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },
                    $maxDistance: maxDistance,
                },
            };
        }
        return this;
    }

    // Sort methods
    sortBy(field: string, order: "asc" | "desc" = "desc"): this {
        this.sort[field] = order === "desc" ? -1 : 1;
        return this;
    }

    sortMultiple(sortFields: Record<string, "asc" | "desc">): this {
        for (const [field, order] of Object.entries(sortFields)) {
            this.sort[field] = order === "desc" ? -1 : 1;
        }
        return this;
    }

    // Projection methods
    select(fields: string[]): this {
        for (const field of fields) {
            this.projection[field] = 1;
        }
        return this;
    }

    exclude(fields: string[]): this {
        for (const field of fields) {
            this.projection[field] = 0;
        }
        return this;
    }

    // Pagination
    paginate(page: number = 1, limit: number = 20): this {
        const options = QueryOptimizer.paginateOptions(page, limit);
        this.skip = options.skip;
        this.limit = options.limit;
        return this;
    }

    // Population
    populateWith(field: string, select?: string | string[]): this {
        const populateObj: any = { path: field };
        if (select) {
            populateObj.select = Array.isArray(select) ? select.join(" ") : select;
        }
        this.populate.push(populateObj);
        return this;
    }

    // Build and execute
    build(): any {
        return {
            query: this.query,
            sort: this.sort,
            projection: this.projection,
            skip: this.skip,
            limit: this.limit,
            populate: this.populate,
        };
    }

    async execute(model: any): Promise<any> {
        try {
            let query = model.find(this.query);

            if (Object.keys(this.projection).length > 0) {
                query = query.select(this.projection);
            }

            if (Object.keys(this.sort).length > 0) {
                query = query.sort(this.sort);
            }

            if (this.skip > 0) {
                query = query.skip(this.skip);
            }

            if (this.limit > 0) {
                query = query.limit(this.limit);
            }

            for (const pop of this.populate) {
                query = query.populate(pop.path, pop.select);
            }

            const results = await query.lean().exec();
            return results;
        } catch (error) {
            throw error;
        }
    }

    async count(model: any): Promise<number> {
        try {
            return await model.countDocuments(this.query);
        } catch (error) {
            throw error;
        }
    }
}

export const qb = <T>() => new QueryBuilder<T>();
