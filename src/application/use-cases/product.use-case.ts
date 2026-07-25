/**
 * Product use cases
 * @module application/use-cases/product
 */

import type { Product, CookiePiece, CookieBox } from "@/domain/entities/product";
import type { IProductRepository } from "@/domain/ports/repositories";

/**
 * Get all active products use case
 */
export class GetAllProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(): Promise<Product[]> {
    return this.productRepo.getAllActive();
  }
}

/**
 * Get product by slug use case
 */
export class GetProductBySlugUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(slug: string): Promise<Product | null> {
    return this.productRepo.getBySlug(slug);
  }
}

/**
 * Get all cookies use case
 */
export class GetAllCookiesUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(): Promise<CookiePiece[]> {
    return this.productRepo.getAllCookies();
  }
}

/**
 * Get all boxes use case
 */
export class GetAllBoxesUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(): Promise<CookieBox[]> {
    return this.productRepo.getAllBoxes();
  }
}

/**
 * Create product use case (admin)
 */
export class CreateProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(
    product: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<Product> {
    return this.productRepo.create(product);
  }
}

/**
 * Update product use case (admin)
 */
export class UpdateProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string, product: Partial<Product>): Promise<Product> {
    return this.productRepo.update(id, product);
  }
}

/**
 * Toggle product active status use case (admin)
 */
export class ToggleProductActiveUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string): Promise<void> {
    return this.productRepo.toggleActive(id);
  }
}

/**
 * Delete product use case (admin)
 */
export class DeleteProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string): Promise<void> {
    return this.productRepo.delete(id);
  }
}
