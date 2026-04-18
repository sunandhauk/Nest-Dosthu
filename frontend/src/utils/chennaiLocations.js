export const CHENNAI_LOCALITY_DETAILS = {
  Adyar: {
    coordinates: [80.2574, 13.0012],
    address: "18, Lattice Bridge Road",
    zipCode: "600020",
    landmark: "Near Adyar Signal",
  },
  Velachery: {
    coordinates: [80.218, 12.9791],
    address: "32, Velachery Main Road",
    zipCode: "600042",
    landmark: "Near Phoenix Marketcity",
  },
  Vadapalani: {
    coordinates: [80.2123, 13.0505],
    address: "11, Arcot Road",
    zipCode: "600026",
    landmark: "Near Vadapalani Metro",
  },
  Tambaram: {
    coordinates: [80.1185, 12.9249],
    address: "5, GST Road",
    zipCode: "600045",
    landmark: "Near Tambaram Railway Station",
  },
  OMR: {
    coordinates: [80.2458, 12.917],
    address: "101, Rajiv Gandhi Salai",
    zipCode: "600096",
    landmark: "Near Perungudi Toll Plaza",
  },
  "T Nagar": {
    coordinates: [80.2341, 13.0418],
    address: "27, North Usman Road",
    zipCode: "600017",
    landmark: "Near Panagal Park",
  },
  "Anna Nagar": {
    coordinates: [80.2102, 13.085],
    address: "14, 2nd Avenue",
    zipCode: "600040",
    landmark: "Near Anna Nagar Tower",
  },
  Porur: {
    coordinates: [80.1548, 13.0353],
    address: "9, Mount Poonamallee Road",
    zipCode: "600116",
    landmark: "Near Porur Junction",
  },
  Chromepet: {
    coordinates: [80.1462, 12.9516],
    address: "7, GST Road",
    zipCode: "600044",
    landmark: "Near Chromepet Station",
  },
  Guindy: {
    coordinates: [80.2206, 13.0067],
    address: "21, GST Road",
    zipCode: "600032",
    landmark: "Near Guindy Metro",
  },
};

export const normalizeRoomPrice = (price) => {
  if (!Number.isFinite(Number(price))) {
    return 3000;
  }

  return Math.min(4000, Math.max(3000, Number(price)));
};

export const getChennaiLocalityMeta = (locality) =>
  CHENNAI_LOCALITY_DETAILS[locality] || {
    coordinates: [80.2707, 13.0827],
    address: "Central Chennai",
    zipCode: "600001",
    landmark: "Near Chennai Central",
  };
