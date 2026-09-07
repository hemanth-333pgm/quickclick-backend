import { Category } from "../models/category.model";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class CategoryService {
    async createCategory(data: any): Promise<any> {
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const category = new Category({ ...data, slug });
        await category.save();
        return category;
    }

    async getCategories(isActive: boolean = true, parentId?: string): Promise<any[]> {
        const query: any = { isActive };
        if (parentId) {
            query.parentId = parentId;
        } else {
            query.parentId = { $exists: false };
        }
        return await Category.find(query).sort({ sortOrder: 1, name: 1 });
    }

    async getCategoryById(id: string): Promise<any> {
        const category = await Category.findById(id);
        if (!category) {
            throw new AppError("Category not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
        }
        return category;
    }

    async getCategoryBySlug(slug: string): Promise<any> {
        const category = await Category.findOne({ slug, isActive: true });
        if (!category) {
            throw new AppError("Category not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
        }
        return category;
    }

    async updateCategory(id: string, data: any): Promise<any> {
        const category = await Category.findById(id);
        if (!category) {
            throw new AppError("Category not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
        }
        if (data.name) {
            data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        }
        Object.assign(category, data);
        await category.save();
        return category;
    }

    async deleteCategory(id: string): Promise<any> {
        const category = await Category.findById(id);
        if (!category) {
            throw new AppError("Category not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
        }
        category.isActive = false;
        await category.save();
        return category;
    }
}
