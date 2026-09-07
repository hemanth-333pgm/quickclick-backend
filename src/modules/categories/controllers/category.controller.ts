import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/category.service";
import { SuccessResponse } from "../../../common/response/success-response";

export class CategoryController {
    private categoryService: CategoryService;

    constructor() {
        this.categoryService = new CategoryService();
    }

    createCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.categoryService.createCategory(req.body);
            res.status(201).json(SuccessResponse.success("Category created", result));
        } catch (error) {
            next(error);
        }
    };

    getCategories = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { isActive, parentId } = req.query;
            const result = await this.categoryService.getCategories(
                isActive !== "false",
                parentId as string
            );
            res.json(SuccessResponse.success("Categories retrieved", result));
        } catch (error) {
            next(error);
        }
    };

    getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await this.categoryService.getCategoryById(id);
            res.json(SuccessResponse.success("Category retrieved", result));
        } catch (error) {
            next(error);
        }
    };

    getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { slug } = req.params;
            const result = await this.categoryService.getCategoryBySlug(slug);
            res.json(SuccessResponse.success("Category retrieved", result));
        } catch (error) {
            next(error);
        }
    };

    updateCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await this.categoryService.updateCategory(id, req.body);
            res.json(SuccessResponse.success("Category updated", result));
        } catch (error) {
            next(error);
        }
    };

    deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await this.categoryService.deleteCategory(id);
            res.json(SuccessResponse.success("Category deleted", result));
        } catch (error) {
            next(error);
        }
    };
}
