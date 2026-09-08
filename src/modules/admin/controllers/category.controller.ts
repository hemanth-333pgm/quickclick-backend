import { Request, Response, NextFunction } from "express";
import { Category } from "../../categories/models/category.model";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class CategoryController {
    async getCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await Category.find()
                .sort({ sortOrder: 1, name: 1 });
            
            res.json(SuccessResponse.success("Categories retrieved", categories));
        } catch (error) {
            next(error);
        }
    }

    async getCategoryById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const category = await Category.findById(id);
            
            if (!category) {
                throw new AppError("Category not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            
            res.json(SuccessResponse.success("Category retrieved", category));
        } catch (error) {
            next(error);
        }
    }

    async createCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, description, imageUrl, isFeatured, sortOrder } = req.body;
            
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            
            const category = new Category({
                name,
                slug,
                description,
                imageUrl,
                isFeatured: isFeatured || false,
                sortOrder: sortOrder || 0,
                isActive: true
            });
            
            await category.save();
            
            res.status(201).json(SuccessResponse.success("Category created", category));
        } catch (error) {
            next(error);
        }
    }

    async updateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { name, description, imageUrl, isFeatured, isActive, sortOrder } = req.body;
            
            const category = await Category.findById(id);
            if (!category) {
                throw new AppError("Category not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            
            if (name) {
                category.name = name;
                category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            }
            if (description) category.description = description;
            if (imageUrl) category.imageUrl = imageUrl;
            if (isFeatured !== undefined) category.isFeatured = isFeatured;
            if (isActive !== undefined) category.isActive = isActive;
            if (sortOrder !== undefined) category.sortOrder = sortOrder;
            
            await category.save();
            
            res.json(SuccessResponse.success("Category updated", category));
        } catch (error) {
            next(error);
        }
    }

    async deleteCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            
            const category = await Category.findById(id);
            if (!category) {
                throw new AppError("Category not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            
            // Soft delete
            category.isActive = false;
            await category.save();
            
            res.json(SuccessResponse.success("Category deleted", { id }));
        } catch (error) {
            next(error);
        }
    }
}
