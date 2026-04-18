const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/user");
const Property = require("./models/property");

dotenv.config();

const normalizeRoomPrice = (price) => Math.min(4000, Math.max(3000, price));

const sampleProperties = [
  {
    title: "Women's PG in Velachery",
    description:
      "Safe and well-maintained women's PG with WiFi, meals, and easy access to IT parks in Velachery.",
    category: "PG",
    listingType: "pg",
    tenantPreference: "women",
    price: normalizeRoomPrice(3850),
    location: {
      address: "12, Taramani Link Road",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      zipCode: "600042",
      coordinates: [80.2206, 12.9815],
      locality: "Velachery",
      landmark: "Near Phoenix Marketcity"
    },
    amenities: {
      wifi: true,
      ac: true,
      tv: true,
      parking: true,
      washer: true,
      workspace: true
    },
    capacity: {
      guests: 1,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1
    },
    rules: {
      smoking: false,
      pets: false,
      parties: false,
      checkInTime: "12:00",
      checkOutTime: "10:00"
    },
    isActive: true,
    isApproved: true
  },
  {
    title: "Working Women's Hostel in Adyar",
    description:
      "Affordable hostel stay for working women in Adyar with security, laundry, and shared kitchen access.",
    category: "Hostel",
    listingType: "hostel",
    tenantPreference: "women",
    price: normalizeRoomPrice(3400),
    location: {
      address: "44, LB Road",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      zipCode: "600020",
      coordinates: [80.2575, 13.0067],
      locality: "Adyar",
      landmark: "Near Adyar Depot"
    },
    amenities: {
      wifi: true,
      kitchen: true,
      ac: false,
      tv: true,
      washer: true,
      workspace: true
    },
    capacity: {
      guests: 1,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1
    },
    rules: {
      smoking: false,
      pets: false,
      parties: false,
      checkInTime: "11:00",
      checkOutTime: "09:30"
    },
    isActive: true,
    isApproved: true
  },
  {
    title: "Private Room for Students in Tambaram",
    description:
      "Private furnished room suitable for college students with calm neighborhood and good train connectivity.",
    category: "Room",
    listingType: "private-room",
    tenantPreference: "students",
    price: normalizeRoomPrice(3200),
    location: {
      address: "8, GST Road",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      zipCode: "600045",
      coordinates: [80.1187, 12.9249],
      locality: "Tambaram",
      landmark: "Near Tambaram Railway Station"
    },
    amenities: {
      wifi: true,
      kitchen: true,
      ac: false,
      parking: true,
      workspace: true
    },
    capacity: {
      guests: 1,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1
    },
    rules: {
      smoking: false,
      pets: false,
      parties: false,
      checkInTime: "13:00",
      checkOutTime: "11:00"
    },
    isActive: true,
    isApproved: true
  },
  {
    title: "Shared Men's PG in OMR",
    description:
      "Budget-friendly shared PG stay in OMR for working professionals with food, WiFi, and transport access.",
    category: "PG",
    listingType: "shared-room",
    tenantPreference: "men",
    price: normalizeRoomPrice(3000),
    location: {
      address: "101, Rajiv Gandhi Salai",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      zipCode: "600096",
      coordinates: [80.2456, 12.9172],
      locality: "OMR",
      landmark: "Near Perungudi Toll Plaza"
    },
    amenities: {
      wifi: true,
      kitchen: true,
      ac: true,
      parking: true,
      washer: true
    },
    capacity: {
      guests: 2,
      bedrooms: 1,
      beds: 2,
      bathrooms: 1
    },
    rules: {
      smoking: false,
      pets: false,
      parties: false,
      checkInTime: "12:30",
      checkOutTime: "10:30"
    },
    isActive: true,
    isApproved: true
  }
];

async function seedChennaiProperties() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected for Chennai property seeding");

    let host = await User.findOne({ email: "host@smartrent.com" });

    if (!host) {
      host = await User.create({
        username: "chennaihost",
        email: "host@smartrent.com",
        password: "host1234",
        firstName: "Chennai",
        lastName: "Host",
        role: "host",
        phone: "9876543210"
      });
      console.log("Created demo host user: host@smartrent.com / host1234");
    }

    await Property.deleteMany({
      owner: host._id,
      "location.city": "Chennai"
    });

    const propertiesToCreate = sampleProperties.map((property) => ({
      ...property,
      owner: host._id
    }));

    const createdProperties = await Property.insertMany(propertiesToCreate);

    host.properties = createdProperties.map((property) => property._id);
    await host.save();

    console.log(`Seeded ${createdProperties.length} Chennai demo properties`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding Chennai properties:", error);
    process.exit(1);
  }
}

seedChennaiProperties();
