export interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  nameEn?: string | null;
  descriptionEn?: string | null;
  rating: number;
  reviews: number;
  inStock: boolean;
  discount?: number | null;
  stock?: number | null;
}
