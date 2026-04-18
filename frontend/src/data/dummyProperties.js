import {
  getChennaiLocalityMeta,
  normalizeRoomPrice,
} from "../utils/chennaiLocations";

const createLocation = (locality) => {
  const meta = getChennaiLocalityMeta(locality);

  return {
    address: meta.address,
    city: "Chennai",
    locality,
    state: "Tamil Nadu",
    country: "India",
    zipCode: meta.zipCode,
    landmark: meta.landmark,
    coordinates: meta.coordinates,
  };
};

export const dummyProperties = [
  {
    _id: "CHN-001",
    title: "Women's PG in Adyar",
    description:
      "Safe and affordable women's PG in Adyar with WiFi, food, laundry, and easy access to colleges and offices.",
    price: normalizeRoomPrice(3550),
    propertyType: "PG",
    category: "PG",
    capacity: {
      bedrooms: 1,
      bathrooms: 1,
    },
    size: 120,
    rating: 4.8,
    trending: true,
    location: createLocation("Adyar"),
    amenities: {
      wifi: true,
      kitchen: true,
      ac: true,
      workspace: true,
      washer: true,
    },
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=60",
    ],
  },
  {
    _id: "CHN-002",
    title: "Working Women's Hostel in Adyar",
    description:
      "Comfortable hostel stay for working women in Adyar with security, attached bathroom, and meal service.",
    price: normalizeRoomPrice(3400),
    propertyType: "Hostel",
    category: "Hostel",
    capacity: {
      bedrooms: 1,
      bathrooms: 1,
    },
    size: 100,
    rating: 4.6,
    location: createLocation("Adyar"),
    amenities: {
      wifi: true,
      kitchen: false,
      ac: false,
      workspace: true,
      washer: true,
    },
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=60",
    ],
  },
  {
    _id: "CHN-003",
    title: "Private Room in Vadapalani",
    description:
      "Budget-friendly private room in Vadapalani near metro, malls, and offices. Suitable for students and working professionals.",
    price: normalizeRoomPrice(3600),
    propertyType: "Room",
    category: "Room",
    capacity: {
      bedrooms: 1,
      bathrooms: 1,
    },
    size: 90,
    rating: 4.5,
    trending: true,
    location: createLocation("Vadapalani"),
    amenities: {
      wifi: true,
      kitchen: true,
      ac: false,
      workspace: true,
      parking: true,
    },
    images: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=60",
    ],
  },
  {
    _id: "CHN-004",
    title: "Men's PG in Vadapalani",
    description:
      "Shared PG accommodation for men in Vadapalani with furnished rooms, WiFi, and food.",
    price: normalizeRoomPrice(3200),
    propertyType: "PG",
    category: "PG",
    capacity: {
      bedrooms: 1,
      bathrooms: 1,
    },
    size: 110,
    rating: 4.4,
    location: createLocation("Vadapalani"),
    amenities: {
      wifi: true,
      kitchen: true,
      ac: true,
      parking: true,
      washer: true,
    },
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=60",
    ],
  },
  {
    _id: "CHN-005",
    title: "Student Room in Velachery",
    description:
      "Neat and compact room in Velachery ideal for students. Nearby bus stand, railway station, and restaurants.",
    price: normalizeRoomPrice(3300),
    propertyType: "Room",
    category: "Room",
    capacity: {
      bedrooms: 1,
      bathrooms: 1,
    },
    size: 85,
    rating: 4.3,
    location: createLocation("Velachery"),
    amenities: {
      wifi: true,
      kitchen: true,
      workspace: true,
      parking: false,
    },
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=60",
    ],
  },
  {
    _id: "CHN-006",
    title: "Women's Hostel in Velachery",
    description:
      "Secure women's hostel in Velachery with CCTV, meals, laundry, and clean shared rooms.",
    price: normalizeRoomPrice(3850),
    propertyType: "Hostel",
    category: "Hostel",
    capacity: {
      bedrooms: 1,
      bathrooms: 1,
    },
    size: 115,
    rating: 4.7,
    trending: true,
    location: createLocation("Velachery"),
    amenities: {
      wifi: true,
      kitchen: false,
      ac: true,
      washer: true,
      workspace: true,
    },
    images: [
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=60",
    ],
  },
  {
    _id: "CHN-007",
    title: "Working Men's Hostel in Tambaram",
    description:
      "Affordable hostel for working men in Tambaram with food, WiFi, and good transport connectivity.",
    price: normalizeRoomPrice(3100),
    propertyType: "Hostel",
    category: "Hostel",
    capacity: {
      bedrooms: 1,
      bathrooms: 1,
    },
    size: 105,
    rating: 4.2,
    location: createLocation("Tambaram"),
    amenities: {
      wifi: true,
      kitchen: false,
      parking: true,
      washer: true,
    },
    images: [
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=600&q=60",
    ],
  },
  {
    _id: "CHN-008",
    title: "Budget Room in Tambaram",
    description:
      "Single occupancy budget room in Tambaram near railway station. Good for students and job seekers.",
    price: normalizeRoomPrice(3000),
    propertyType: "Room",
    category: "Room",
    capacity: {
      bedrooms: 1,
      bathrooms: 1,
    },
    size: 80,
    rating: 4.1,
    location: createLocation("Tambaram"),
    amenities: {
      wifi: true,
      kitchen: true,
      parking: false,
      workspace: false,
    },
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=60",
    ],
  },
  {
    _id: "CHN-009",
    title: "Shared PG in OMR",
    description:
      "Shared PG accommodation in OMR for IT employees with AC rooms, food, and shuttle access.",
    price: normalizeRoomPrice(3700),
    propertyType: "PG",
    category: "PG",
    capacity: {
      bedrooms: 1,
      bathrooms: 1,
    },
    size: 130,
    rating: 4.5,
    trending: true,
    location: createLocation("OMR"),
    amenities: {
      wifi: true,
      kitchen: true,
      ac: true,
      parking: true,
      washer: true,
      workspace: true,
    },
    images: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=60",
    ],
  },
  {
    _id: "CHN-010",
    title: "Women's PG in OMR",
    description:
      "Clean and secure women's PG in OMR with attached washroom, meals, and power backup.",
    price: normalizeRoomPrice(3950),
    propertyType: "PG",
    category: "PG",
    capacity: {
      bedrooms: 1,
      bathrooms: 1,
    },
    size: 125,
    rating: 4.7,
    location: createLocation("OMR"),
    amenities: {
      wifi: true,
      kitchen: false,
      ac: true,
      washer: true,
      workspace: true,
    },
    images: [
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=60",
    ],
  }
];

export default dummyProperties;
