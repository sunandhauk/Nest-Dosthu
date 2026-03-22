const Property = require("../models/property");
const User = require("../models/user");
const { propertySchema } = require("../schema");
const { cloudinary } = require("../cloudConfig");

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc    Create a new property
// @route   POST /api/properties
// @access  Private (Host/Admin)
const createProperty = async (req, res) => {
  try {
    const { error, value } = propertySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const property = new Property({
      ...value,
      owner: req.user._id,
    });

    const savedProperty = await property.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { properties: savedProperty._id },
    });

    res.status(201).json(savedProperty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all properties
// @route   GET /api/properties
// @access  Public
const getProperties = async (req, res) => {
  try {
    const filter = {
      isActive: true,
      isApproved: true,
      "location.city": {
        $regex: /^chennai$/i,
      },
    };

    if (req.query.location || req.query.city) {
      const rawLocation = req.query.city || req.query.location;
      const searchValue = rawLocation.trim();

      filter.$or = [
        { "location.city": { $regex: escapeRegex(searchValue), $options: "i" } },
        { "location.locality": { $regex: escapeRegex(searchValue), $options: "i" } },
        { "location.landmark": { $regex: escapeRegex(searchValue), $options: "i" } },
        { title: { $regex: escapeRegex(searchValue), $options: "i" } },
      ];
    }

    if (req.query.category) {
      const categories = req.query.category
        .split(",")
        .map((category) => category.trim())
        .filter(Boolean);

      if (categories.length > 0) {
        filter.category = { $in: categories };
      }
    }

    if (req.query.listingType) {
      const listingTypes = req.query.listingType
        .split(",")
        .map((type) => type.trim())
        .filter(Boolean);

      if (listingTypes.length > 0) {
        filter.listingType = { $in: listingTypes };
      }
    }

    if (req.query.tenantPreference) {
      const preferences = req.query.tenantPreference
        .split(",")
        .map((preference) => preference.trim())
        .filter(Boolean);

      if (preferences.length > 0) {
        filter.tenantPreference = { $in: preferences };
      }
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    if (req.query.guests) {
      filter["capacity.guests"] = { $gte: Number(req.query.guests) };
    }

    if (req.query.amenities) {
      const amenities = req.query.amenities.split(",");
      amenities.forEach((amenity) => {
        filter[`amenities.${amenity}`] = true;
      });
    }

    if (req.query.search) {
      const searchRegex = {
        $regex: escapeRegex(req.query.search),
        $options: "i",
      };

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { "location.locality": searchRegex },
        { "location.landmark": searchRegex },
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit =
      req.query.limit === undefined ? 1000 : parseInt(req.query.limit) || 1000;
    const startIndex = (page - 1) * limit;

    const filteredTotal = await Property.countDocuments(filter);
    console.log(`Total properties matching filters: ${filteredTotal}`);
    console.log(`Filter criteria: ${JSON.stringify(filter)}`);

    const properties = await Property.find(filter)
      .populate("owner", "username firstName lastName profileImage")
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .lean();

    const pagination = {
      page,
      limit,
      total: filteredTotal,
      pages: Math.ceil(filteredTotal / limit),
    };

    res.status(200).json({ properties, pagination });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get a property by ID
// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("owner", "username firstName lastName profileImage")
      .populate({
        path: "reviews",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "user",
          select: "username firstName lastName profileImage",
        },
      });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update a property
// @route   PUT /api/properties/:id
// @access  Private (Owner/Admin)
const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (
      property.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this property" });
    }

    const { error, value } = propertySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedProperty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete a property
// @route   DELETE /api/properties/:id
// @access  Private (Owner/Admin)
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (
      property.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this property" });
    }

    for (const image of property.images) {
      if (image.publicId) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    }

    await User.findByIdAndUpdate(property.owner, {
      $pull: { properties: property._id },
    });

    await property.remove();

    res.status(200).json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Upload property images
// @route   POST /api/properties/:id/images
// @access  Private (Owner/Admin)
const uploadPropertyImages = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (
      property.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this property" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const newImages = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    property.images.push(...newImages);
    await property.save();

    res.status(200).json({
      message: "Images uploaded successfully",
      images: property.images,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete property image
// @route   DELETE /api/properties/:id/images/:imageId
// @access  Private (Owner/Admin)
const deletePropertyImage = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (
      property.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this property" });
    }

    const image = property.images.id(req.params.imageId);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }

    property.images.pull(req.params.imageId);
    await property.save();

    res.status(200).json({
      message: "Image deleted successfully",
      images: property.images,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update property availability
// @route   PUT /api/properties/:id/availability
// @access  Private (Owner/Admin)
const updateAvailability = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (
      property.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this property" });
    }

    if (!req.body.availability || !Array.isArray(req.body.availability)) {
      return res.status(400).json({ message: "Invalid availability data" });
    }

    property.availability = req.body.availability;
    await property.save();

    res.status(200).json({
      message: "Availability updated successfully",
      availability: property.availability,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get my properties
// @route   GET /api/properties/user/me
// @access  Private
const getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json(properties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Approve a property (Admin only)
// @route   PUT /api/properties/:id/approve
// @access  Private (Admin)
const approveProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    property.isApproved = true;
    await property.save();

    res.status(200).json({
      message: "Property approved successfully",
      property,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  uploadPropertyImages,
  deletePropertyImage,
  updateAvailability,
  getMyProperties,
  approveProperty,
};
