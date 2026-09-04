export interface ProductItem {
  id: string;
  name: string;
  category:
    | 'Groceries'
    | 'Fruits'
    | 'Vegetables'
    | 'Household'
    | 'Personal Care'
    | 'Snacks'
    | 'Beverages'
    | 'Bakery';
  description: string;
  price: number;
  currency: string;
  stock: number;
  unit: string;
  seller: string;
  location: string;
  image: string;
  badge?: string;
  rating?: number;
}

export const CATALOGUE_ITEMS: ProductItem[] = [
  {
    id: 'P001',
    name: 'Basmati Rice (India Gate Premium)',
    category: 'Groceries',
    description: 'Aged long-grain royal basmati rice with exquisite aroma',
    price: 320,
    currency: 'INR',
    stock: 25,
    unit: '5 kg',
    seller: 'Sharma Kirana Mart',
    location: 'Kanpur Main Market',
    badge: 'Bestseller',
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'P002',
    name: 'Fortune Sunlite Sunflower Oil',
    category: 'Groceries',
    description: 'Refined sunflower cooking oil enriched with Vitamins A & D',
    price: 165,
    currency: 'INR',
    stock: 15,
    unit: '1 L',
    seller: 'Sharma Kirana Mart',
    location: 'Kanpur Main Market',
    badge: 'Essential',
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'P003',
    name: 'Dabur Kachi Ghani Mustard Oil',
    category: 'Groceries',
    description: '100% cold-pressed pure mustard oil with natural pungency',
    price: 180,
    currency: 'INR',
    stock: 10,
    unit: '1 L',
    seller: 'Sharma Kirana Mart',
    location: 'Kanpur Main Market',
    badge: 'Pure & Cold Pressed',
    rating: 4.7,
    image:
      'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'P004',
    name: 'Aashirvaad Shudh Chakki Atta',
    category: 'Groceries',
    description: '100% whole wheat flour ground from heavy golden grains',
    price: 240,
    currency: 'INR',
    stock: 3,
    unit: '5 kg',
    seller: 'Sharma Kirana Mart',
    location: 'Kanpur Main Market',
    badge: 'Low Stock (3 left)',
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'P005',
    name: 'Premium Toor Dal (Arhar)',
    category: 'Groceries',
    description: 'Unpolished protein-rich toor dal without synthetic colors',
    price: 140,
    currency: 'INR',
    stock: 18,
    unit: '1 kg',
    seller: 'Sharma Kirana Mart',
    location: 'Kanpur Main Market',
    badge: 'High Protein',
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'P006',
    name: 'Ratnagiri Alphonso Mangoes',
    category: 'Fruits',
    description: 'Naturally ripened sweet aromatic King of Mangoes',
    price: 450,
    currency: 'INR',
    stock: 12,
    unit: '1 dozen',
    seller: 'Kisan Fruit Fresh Mandi',
    location: 'Kanpur Sabzi Mandi',
    badge: 'Seasonal Top Pick',
    rating: 5.0,
    image:
      'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'P007',
    name: 'Royal Shimla Apples',
    category: 'Fruits',
    description: 'Crisp, sweet & juicy handpicked mountain apples',
    price: 180,
    currency: 'INR',
    stock: 20,
    unit: '1 kg',
    seller: 'Kisan Fruit Fresh Mandi',
    location: 'Kanpur Sabzi Mandi',
    badge: 'Fresh Harvest',
    rating: 4.7,
    image:
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'P008',
    name: 'Fresh Farm Robusta Bananas',
    category: 'Fruits',
    description: 'Golden yellow ripe energy-packed farm bananas',
    price: 60,
    currency: 'INR',
    stock: 30,
    unit: '1 dozen',
    seller: 'Kisan Fruit Fresh Mandi',
    location: 'Kanpur Sabzi Mandi',
    badge: 'Daily Fresh',
    rating: 4.6,
    image:
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'P009',
    name: 'Farm Fresh Organic Tomatoes',
    category: 'Vegetables',
    description: 'Plump, firm and bright red desi salad & curry tomatoes',
    price: 40,
    currency: 'INR',
    stock: 45,
    unit: '1 kg',
    seller: 'Sabzi Mandi Express',
    location: 'Kanpur Sabzi Mandi',
    badge: 'Direct from Farm',
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'P010',
    name: 'Nashik Red Quality Onions',
    category: 'Vegetables',
    description: 'Crisp medium-sized pungent Nashik pink-red onions',
    price: 35,
    currency: 'INR',
    stock: 50,
    unit: '1 kg',
    seller: 'Sabzi Mandi Express',
    location: 'Kanpur Sabzi Mandi',
    badge: 'Kitchen Staple',
    rating: 4.7,
    image:
      'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'P016',
    name: 'Haldiram Nagpur Bhujia Sev',
    category: 'Snacks',
    description: 'Crispy traditional spiced moth bean & gram flour namkeen',
    price: 110,
    currency: 'INR',
    stock: 22,
    unit: '400 g',
    seller: 'Sharma Kirana Mart',
    location: 'Kanpur Main Market',
    badge: 'Chai Time Special',
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1621996346565-e3d5d6281232?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'P018',
    name: 'Amul Taaza Fresh Toned Milk',
    category: 'Beverages',
    description: 'Pasteurised homogenized fresh dairy milk pouch',
    price: 30,
    currency: 'INR',
    stock: 40,
    unit: '500 ml',
    seller: 'Amul Milk Dairy Corner',
    location: 'Kanpur Main Market',
    badge: 'Daily Dairy',
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
  },
];

export function getProductImage(productQuery: string): string {
  const query = (productQuery || '').toLowerCase();

  if (query.includes('rice') || query.includes('basmati') || query.includes('चावल')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80';
  }
  if (query.includes('sunflower') || query.includes('cooking oil')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80';
  }
  if (query.includes('mustard') || query.includes('sarson') || query.includes('तेल')) {
    return 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=800&q=80';
  }
  if (
    query.includes('atta') ||
    query.includes('wheat') ||
    query.includes('flour') ||
    query.includes('आटा')
  ) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80';
  }
  if (
    query.includes('dal') ||
    query.includes('toor') ||
    query.includes('lentil') ||
    query.includes('दाल')
  ) {
    return 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80';
  }
  if (query.includes('mango') || query.includes('alphonso') || query.includes('आम')) {
    return 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80';
  }
  if (query.includes('apple') || query.includes('shimla') || query.includes('सेब')) {
    return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80';
  }
  if (query.includes('banana') || query.includes('केला')) {
    return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80';
  }
  if (query.includes('tomato') || query.includes('टमाटर')) {
    return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80';
  }
  if (query.includes('onion') || query.includes('प्याज')) {
    return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=800&q=80';
  }
  if (
    query.includes('snack') ||
    query.includes('bhujia') ||
    query.includes('lays') ||
    query.includes('chips')
  ) {
    return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281232?auto=format&fit=crop&w=800&q=80';
  }
  if (query.includes('milk') || query.includes('amul') || query.includes('दूध')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80';
  }

  // Fallback default grocery item image
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';
}
