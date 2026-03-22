import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PropertyImage from "../components/PropertyImage";
import dummyProperties from "../data/dummyProperties";

const categories = [
  { id: "all", label: "All" },
  { id: "PG", label: "PG" },
  { id: "Hostel", label: "Hostel" },
  { id: "Room", label: "Room" },
];

const Listings = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: "",
    priceMin: "",
    priceMax: "",
  });
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const locationParam = queryParams.get("location") || "";
    const searchValue = locationParam.toLowerCase().trim();

    const filtered = dummyProperties.filter((property) => {
      if (!searchValue) return true;

      const city = property.location?.city?.toLowerCase() || "";
      const locality = property.location?.locality?.toLowerCase() || "";
      const title = property.title?.toLowerCase() || "";
      const description = property.description?.toLowerCase() || "";
      const category = property.category?.toLowerCase() || "";
      const propertyType = property.propertyType?.toLowerCase() || "";

      return (
        city.includes(searchValue) ||
        locality.includes(searchValue) ||
        title.includes(searchValue) ||
        description.includes(searchValue) ||
        category.includes(searchValue) ||
        propertyType.includes(searchValue)
      );
    });

    setProperties(filtered);
    setFilters((prev) => ({
      ...prev,
      location: locationParam,
    }));
    setLoading(false);
  }, [location.search]);

  const displayedProperties = useMemo(() => {
    return properties.filter((property) => {
      if (
        activeCategory !== "all" &&
        (property.category || "").toLowerCase() !== activeCategory.toLowerCase()
      ) {
        return false;
      }

      if (
        filters.location &&
        ![
          property.location?.city || "",
          property.location?.locality || "",
          property.title || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(filters.location.toLowerCase())
      ) {
        return false;
      }

      if (filters.priceMin && property.price < Number(filters.priceMin)) {
        return false;
      }

      if (filters.priceMax && property.price > Number(filters.priceMax)) {
        return false;
      }

      return true;
    });
  }, [activeCategory, filters.location, filters.priceMax, filters.priceMin, properties]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      location: "",
      priceMin: "",
      priceMax: "",
    });
    setActiveCategory("all");
    navigate("/listings");
  };

  const navigateToPropertyDetail = (propertyId) => {
    navigate(`/properties/${propertyId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-neutral-600">Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="bg-white border-b border-neutral-200 sticky top-[72px]" style={{ zIndex: 10 }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-full border transition ${
                    activeCategory === category.id
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-neutral-700 border-neutral-300"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <button
              onClick={clearAllFilters}
              className="px-4 py-2 rounded-full border border-neutral-300 text-neutral-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Search Adyar, Vadapalani, Velachery..."
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="number"
              name="priceMin"
              value={filters.priceMin}
              onChange={handleFilterChange}
              placeholder="Min price"
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="number"
              name="priceMax"
              value={filters.priceMax}
              onChange={handleFilterChange}
              placeholder="Max price"
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-neutral-900 mb-6">
          {displayedProperties.length} {displayedProperties.length === 1 ? "Property" : "Properties"} Available
        </h1>

        {displayedProperties.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm py-16 text-center">
            <div className="text-5xl text-neutral-300 mb-4">
              <i className="fas fa-search"></i>
            </div>
            <h3 className="text-2xl font-semibold text-neutral-800 mb-2">
              No properties found
            </h3>
            <p className="text-neutral-500 mb-6">
              Search panna Adyar, Vadapalani, Velachery, Tambaram madhiri Chennai areas try pannunga.
            </p>
            <button
              onClick={clearAllFilters}
              className="bg-primary-600 text-white px-5 py-3 rounded-xl hover:bg-primary-700 transition"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayedProperties.map((property) => {
              const propertyImages =
                Array.isArray(property.images) && property.images.length > 0
                  ? property.images
                  : ["/images/default-property.jpg"];

              return (
                <div
                  key={property._id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => navigateToPropertyDetail(property._id)}
                >
                  <div className="relative h-64">
                    <PropertyImage
                      images={propertyImages}
                      alt={property.title}
                      className="w-full h-64 object-cover"
                      showGallery={true}
                      id={`property-image-${property._id}`}
                      propertyId={property._id}
                    />
                    <span className="absolute top-4 right-4 bg-white text-primary-600 px-3 py-1 rounded-full font-semibold shadow-sm">
                      Rs.{property.price}/month
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-neutral-900">
                        {property.title}
                      </h3>
                      <span className="text-sm font-medium text-yellow-500">
                        <i className="fas fa-star mr-1"></i>
                        {property.rating || property.averageRating || 4.5}
                      </span>
                    </div>

                    <div className="mb-3">
                      <span className="inline-block bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-md">
                        {property.propertyType || property.category}
                      </span>
                    </div>

                    <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
                      {property.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                      <span>
                        <i className="fas fa-bed mr-1"></i>
                        {property.capacity?.bedrooms || 1} Beds
                      </span>
                      <span>
                        <i className="fas fa-bath mr-1"></i>
                        {property.capacity?.bathrooms || 1} Baths
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        <i className="fas fa-map-marker-alt text-primary-500 mr-1"></i>
                        {property.location?.locality || property.location?.city || "Unknown"}
                        {property.location?.city ? `, ${property.location.city}` : ""}
                      </span>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          navigateToPropertyDetail(property._id);
                        }}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Listings;
