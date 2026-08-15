export interface ProductItem {
  id: string;
  name: string;
  category: 'Groceries' | 'Fruits' | 'Vegetables' | 'Household' | 'Personal Care' | 'Snacks' | 'Beverages' | 'Bakery';
  description: string;
  price: number;
  currency: string;
  stock: number;
  unit: string;
  seller: string;
  location: string;
  image: string;
}

export const CATALOGUE_ITEMS: ProductItem[] = [
  {
    id: 'P001',
    name: 'Basmati Rice',
    category: 'Groceries',
    description: 'Premium long-grain aged basmati rice',
    price: 320,
    currency: 'INR',
    stock: 25,
    unit: '5 kg',
    seller: 'Local Fresh Mart',
    location: 'Kanpur',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'P002',
    name: 'Fortune Sunflower Oil',
    category: 'Groceries',
    description: 'Refined sunflower cooking oil pouch',
    price: 165,
    currency: 'INR',
    stock: 15,
    unit: '1 L',
    seller: 'Local Fresh Mart',
    location: 'Kanpur',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'P003',
    name: 'Dabur Mustard Oil',
    category: 'Groceries',
    description: 'Kachi ghani pure mustard oil',
    price: 180,
    currency: 'INR',
    stock: 10,
    unit: '1 L',
    seller: 'Local Fresh Mart',
    location: 'Kanpur',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'P004',
    name: 'Aashirvaad Whole Wheat Atta',
    category: 'Groceries',
    description: '100% pure MP chakki whole wheat flour',
    price: 240,
    currency: 'INR',
    stock: 3,
    unit: '5 kg',
    seller: 'Local Fresh Mart',
    location: 'Kanpur',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'P005',
    name: 'Toor Dal',
    category: 'Groceries',
    description: 'Unpolished premium protein toor dal',
    price: 140,
    currency: 'INR',
    stock: 0,
    unit: '1 kg',
    seller: 'Local Fresh Mart',
    location: 'Kanpur',
    image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'P006',
    name: 'Fresh Alphonso Mangoes',
    category: 'Fruits',
    description: 'Handpicked sweet Ratnagiri alphonso mangoes',
    price: 450,
    currency: 'INR',
    stock: 12,
    unit: '1 dozen',
    seller: 'Green Orchard',
    location: 'Kanpur',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'P007',
    name: 'Shimla Apples',
    category: 'Fruits',
    description: 'Crisp red royal Shimla apples',
    price: 180,
    currency: 'INR',
    stock: 20,
    unit: '1 kg',
    seller: 'Green Orchard',
    location: 'Kanpur',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'P008',
    name: 'Fresh Farm Bananas',
    category: 'Fruits',
    description: 'Robusta yellow sweet ripe bananas',
    price: 60,
    currency: 'INR',
    stock: 30,
    unit: '1 dozen',
    seller: 'Green Orchard',
    location: 'Kanpur',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'P009',
    name: 'Organic Tomatoes',
    category: 'Vegetables',
    description: 'Farm fresh juicy red tomatoes',
    price: 40,
    currency: 'INR',
    stock: 4,
    unit: '1 kg',
    seller: 'Sabzi Mandi Express',
    location: 'Kanpur',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'P010',
    name: 'Fresh Onions',
    category: 'Vegetables',
    description: 'Nashik red quality onions',
    price: 35,
    currency: 'INR',
    stock: 50,
    unit: '1 kg',
    seller: 'Sabzi Mandi Express',
    location: 'Kanpur',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'P016',
    name: 'Haldiram Bhujia Sev',
    category: 'Snacks',
    description: 'Crispy spicy gram flour Indian bhujia snack',
    price: 110,
    currency: 'INR',
    stock: 22,
    unit: '400 g',
    seller: 'Snack Corner',
    location: 'Kanpur',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281232?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'P018',
    name: 'Amul Taaza Toned Milk',
    category: 'Beverages',
    description: 'Homogenised fresh toned milk pouch',
    price: 30,
    currency: 'INR',
    stock: 40,
    unit: '500 ml',
    seller: 'Amul Parlour',
    location: 'Kanpur',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
  },
];

export function getProductImage(productQuery: string): string {
  const query = (productQuery || '').toLowerCase();

  if (query.includes('rice') || query.includes('basmati') || query.includes('चावल')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('sunflower') || query.includes('cooking oil')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('mustard') || query.includes('sarson') || query.includes('तेल')) {
    return 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('atta') || query.includes('wheat') || query.includes('flour') || query.includes('आटा')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('dal') || query.includes('toor') || query.includes('lentil') || query.includes('दाल')) {
    return 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('mango') || query.includes('alphonso') || query.includes('आम')) {
    return 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('apple') || query.includes('shimla') || query.includes('सेब')) {
    return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('banana') || query.includes('केला')) {
    return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('tomato') || query.includes('टमाटर')) {
    return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('onion') || query.includes('प्याज')) {
    return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('snack') || query.includes('bhujia') || query.includes('lays') || query.includes('chips')) {
    return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281232?auto=format&fit=crop&w=600&q=80';
  }
  if (query.includes('milk') || query.includes('amul') || query.includes('दूध')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80';
  }

  // Fallback default grocery item image
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
}
