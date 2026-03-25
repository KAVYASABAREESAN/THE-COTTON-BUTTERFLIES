export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: 'women' | 'kids' | 'accessories';
  subcategory?: 'earrings' | 'chains';
  type: 'dress' | 'top' | 'shirt' | 'pants' | 'skirt' | 'frock' | 'gown' | 'saree' | 'kurta' | 'lehenga' | 'bag' | 'scarf' | 'other';
  colors: string[];
  sizes: string[];
  ageGroups?: string[]; // For kids
  images: string[];
  stock: number;
  featured: boolean;
  tags: string[];
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Embroidered Puff-Sleeve Maxi Dress',
    description: 'Beautiful embroidered maxi dress with puff sleeves, perfect for special occasions.',
    price: 4999,
    originalPrice: 6999,
    discount: 20,
    category: 'women',
    type: 'dress',
    colors: ['Pink', 'Blue'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: ['/api/placeholder/400/500'],
    stock: 15,
    featured: true,
    tags: ['dress', 'maxi', 'embroidery', 'puff-sleeve', 'women']
  },
  {
    id: '2',
    name: 'Lace-Trim V-Neck Crepe Maxi Dress',
    description: 'Elegant crepe maxi dress with delicate lace trim and V-neck design.',
    price: 3499,
    originalPrice: 5999,
    discount: 40,
    category: 'women',
    type: 'dress',
    colors: ['Black', 'Brown Floral'],
    sizes: ['XS', 'S', 'M', 'L'],
    images: ['/api/placeholder/400/500'],
    stock: 8,
    featured: true,
    tags: ['dress', 'maxi', 'lace', 'v-neck', 'crepe', 'women']
  },
  {
    id: '3',
    name: 'Modern Square-Neck Maxi Dress',
    description: 'Contemporary square-neck maxi dress in premium fabric.',
    price: 4199,
    originalPrice: 6995,
    discount: 40,
    category: 'women',
    type: 'dress',
    colors: ['Red', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL'],
    images: ['/api/placeholder/400/500'],
    stock: 12,
    featured: true,
    tags: ['dress', 'maxi', 'square-neck', 'modern', 'women']
  },
  {
    id: '4',
    name: 'Kids Floral Print Frock',
    description: 'Adorable floral print frock for little girls, perfect for parties.',
    price: 2499,
    category: 'kids',
    type: 'frock',
    colors: ['Pink', 'Yellow'],
    sizes: [],
    ageGroups: ['2-3', '4-5', '6-7'],
    images: ['/api/placeholder/400/500'],
    stock: 20,
    featured: true,
    tags: ['kids', 'frock', 'floral', 'dress', 'girls']
  },
  {
    id: '5',
    name: 'Linen Blend Shirt',
    description: 'Comfortable linen-blend shirt for casual everyday wear.',
    price: 3299,
    category: 'women',
    type: 'shirt',
    colors: ['White', 'Blue'],
    sizes: ['XS', 'S', 'M', 'L'],
    images: ['/api/placeholder/400/500'],
    stock: 25,
    featured: true,
    tags: ['shirt', 'linen', 'casual', 'women']
  },
  {
    id: '6',
    name: 'Poplin Cinched Midi Shirtdress',
    description: 'Chic poplin shirtdress with cinched waist for a flattering silhouette.',
    price: 4599,
    category: 'women',
    type: 'dress',
    colors: ['White', 'Striped'],
    sizes: ['XS', 'S', 'M'],
    images: ['/api/placeholder/400/500'],
    stock: 10,
    featured: false,
    tags: ['dress', 'midi', 'shirtdress', 'poplin', 'cinched', 'women']
  },
  {
    id: '7',
    name: 'Boys Casual T-Shirt & Shorts Set',
    description: 'Comfortable cotton set for active boys.',
    price: 1899,
    category: 'kids',
    type: 'top',
    colors: ['Blue', 'Green'],
    sizes: [],
    ageGroups: ['4-5', '6-7', '8-9'],
    images: ['/api/placeholder/400/500'],
    stock: 30,
    featured: false,
    tags: ['kids', 'boys', 'casual', 'tshirt', 'shorts', 'set']
  },
  {
    id: '8',
    name: 'Silk Blend Evening Gown',
    description: 'Luxurious silk-blend gown for formal occasions.',
    price: 8999,
    originalPrice: 12999,
    discount: 30,
    category: 'women',
    type: 'gown',
    colors: ['Black', 'Gold'],
    sizes: ['S', 'M', 'L'],
    images: ['/api/placeholder/400/500'],
    stock: 5,
    featured: true,
    tags: ['gown', 'evening', 'silk', 'formal', 'women']
  }
];

// Helper functions
export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};

export const getFeaturedProducts = (): Product[] => {
  return products.filter(product => product.featured);
};

export const getProductsByCategory = (category: 'women' | 'kids' | 'accessories'): Product[] => {
  return products.filter(product => product.category === category);
};

export const getProductsByType = (type: string): Product[] => {
  return products.filter(product => product.type === type);
};
