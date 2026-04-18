import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadMultipleToCloudinary } from "../utils/cloudinaryService";
import { useAuth } from "../contexts/AuthContext";
import { CHENNAI_AREAS, CHENNAI_CITY, saveStoredHostListings, getStoredHostListings } from "../utils/chennaiListings";
import {
  getChennaiLocalityMeta,
  normalizeRoomPrice,
} from "../utils/chennaiLocations";

const DIGIT_ONLY_FIELDS = new Set([
  "price",
  "phone",
  "zipCode",
  "guests",
  "bedrooms",
  "beds",
  "bathrooms",
]);

const initialForm = {
  title: "",
  description: "",
  propertyType: "Room",
  price: "",
  phone: "",
  address: "",
  locality: CHENNAI_AREAS[0],
  zipCode: "",
  guests: 1,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
};

const BecomeHost = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;

    const nextValue = DIGIT_ONLY_FIELDS.has(name)
      ? value.replace(/\D/g, "")
      : value;

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const handlePhotoSelect = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 8);
    const nextPhotos = files.map((file, index) => ({
      file,
      id: `${file.name}-${index}-${Date.now()}`,
      preview: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...nextPhotos].slice(0, 8));
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const validate = () => {
    if (!form.title.trim()) return "Room title is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.phone.trim()) return "Contact number is required";
    if (!form.address.trim()) return "Address is required";
    if (!form.locality.trim()) return "Chennai area is required";
    if (!form.zipCode.trim()) return "Pincode is required";
    if (!form.price || Number(form.price) < 3000 || Number(form.price) > 4000) {
      return "Monthly price must be between Rs.3000 and Rs.4000";
    }
    if (photos.length === 0) return "At least one room image is required";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      let uploadedImages = [];
      try {
        uploadedImages = await uploadMultipleToCloudinary(
          photos.map((item) => item.file)
        );
      } catch (uploadError) {
        uploadedImages = photos.map((item, index) => ({
          secure_url: item.preview,
          url: item.preview,
          public_id: `local-preview-${index}`,
        }));
      }

      const localityMeta = getChennaiLocalityMeta(form.locality);

      const listing = {
        id: `HOST-${Date.now()}`,
        _id: `HOST-${Date.now()}`,
        source: "local-host",
        title: form.title.trim(),
        description: form.description.trim(),
        propertyType: form.propertyType,
        category: form.propertyType,
        price: normalizeRoomPrice(Number(form.price)),
        status: "active",
        rating: 5,
        averageRating: 5,
        location: {
          address: form.address.trim(),
          locality: form.locality,
          city: CHENNAI_CITY,
          state: "Tamil Nadu",
          country: "India",
          zipCode: form.zipCode.trim(),
          landmark: localityMeta.landmark,
          coordinates: localityMeta.coordinates,
        },
        images: uploadedImages.map((image, index) => ({
          url: image.secure_url || image.url || photos[index]?.preview || "",
          secure_url: image.secure_url || image.url || photos[index]?.preview || "",
          publicId: image.public_id || image.publicId || `host-image-${index}`,
        })),
        amenities: {
          wifi: true,
          parking: true,
          ac: form.propertyType !== "Hostel",
          workspace: true,
        },
        capacity: {
          guests: Number(form.guests) || 1,
          bedrooms: Number(form.bedrooms) || 1,
          beds: Number(form.beds) || 1,
          bathrooms: Number(form.bathrooms) || 1,
        },
        owner: {
          _id: currentUser?._id || null,
          username: currentUser?.username || "host",
          firstName: currentUser?.firstName || "Host",
          lastName: currentUser?.lastName || "User",
          profileImage: currentUser?.profileImage || "",
          phone: form.phone.trim(),
        },
      };

      const existingListings = getStoredHostListings();
      saveStoredHostListings([listing, ...existingListings]);
      navigate("/listings?location=Chennai");
    } catch (submitError) {
      console.error(submitError);
      setError("There was a problem publishing the listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.14),_transparent_30%),linear-gradient(180deg,_#fff7f8_0%,_#f8fafc_44%,_#ffffff_100%)] py-8">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[30px] border border-white/70 bg-white/90 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.28)]">
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr,1.3fr]">
            <div className="bg-[linear-gradient(160deg,_#0f172a_0%,_#1e293b_45%,_#334155_100%)] p-6 text-white md:p-8">
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-100">
                Chennai host listing
              </span>
              <h1 className="mt-4 text-3xl font-bold">Add your room directly to the website</h1>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Images, contact number, monthly rent, area, and address are required. Once you submit the form, your listing appears immediately on the Chennai rooms page.
              </p>

              <div className="mt-8 space-y-3 text-sm text-slate-200">
                <div className="rounded-2xl bg-white/10 px-4 py-3">Only Chennai rooms and hostels</div>
                <div className="rounded-2xl bg-white/10 px-4 py-3">Tenants can open chat and contact details directly</div>
                <div className="rounded-2xl bg-white/10 px-4 py-3">Simple publishing flow for host details</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8">
              {error && (
                <div className="mb-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Room title</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    placeholder="Example: Women's PG near Adyar signal"
                    autoComplete="off"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Property type</label>
                  <select
                    name="propertyType"
                    value={form.propertyType}
                    onChange={updateField}
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                  >
                    <option value="Room">Room</option>
                    <option value="PG">PG</option>
                    <option value="Hostel">Hostel</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Monthly price</label>
                  <input
                    name="price"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={form.price}
                    onChange={updateField}
                    placeholder="3000 - 4000"
                    className="manual-number-input w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                  />
                  <p className="mt-2 text-xs text-neutral-500">Allowed range: Rs.3000 to Rs.4000 per month.</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Contact number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    placeholder="9876543210"
                    inputMode="numeric"
                    autoComplete="tel"
                    className="manual-number-input w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Chennai area</label>
                  <input
                    name="locality"
                    type="text"
                    list="chennai-areas"
                    value={form.locality}
                    onChange={updateField}
                    placeholder="Example: Perungudi"
                    autoComplete="off"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                  />
                  <datalist id="chennai-areas">
                    {CHENNAI_AREAS.map((area) => (
                      <option key={area} value={area} />
                    ))}
                  </datalist>
                  <p className="mt-2 text-xs text-neutral-500">
                    Dropdown suggestions use pannaலாம், இல்லையெனில் உங்கள் area name manual-a type pannalaam.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={updateField}
                    placeholder="Street / landmark / nearby stop"
                    autoComplete="street-address"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">City</label>
                  <input
                    value={CHENNAI_CITY}
                    readOnly
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Pincode</label>
                  <input
                    name="zipCode"
                    type="text"
                    value={form.zipCode}
                    onChange={updateField}
                    placeholder="600020"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    className="manual-number-input w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Guests</label>
                  <input name="guests" type="text" inputMode="numeric" value={form.guests} onChange={updateField} autoComplete="off" className="manual-number-input w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Bedrooms</label>
                  <input name="bedrooms" type="text" inputMode="numeric" value={form.bedrooms} onChange={updateField} autoComplete="off" className="manual-number-input w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Beds</label>
                  <input name="beds" type="text" inputMode="numeric" value={form.beds} onChange={updateField} autoComplete="off" className="manual-number-input w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Bathrooms</label>
                  <input name="bathrooms" type="text" inputMode="numeric" value={form.bathrooms} onChange={updateField} autoComplete="off" className="manual-number-input w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100" />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Description</label>
                  <textarea
                    name="description"
                    rows="4"
                    value={form.description}
                    onChange={updateField}
                    placeholder="Food, attached bath, wifi, security, curfew, sharing details..."
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium text-neutral-700">Room images</label>
                    <span className="text-xs text-neutral-500">{photos.length}/8 selected</span>
                  </div>
                  <div className="rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 p-5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm transition hover:text-primary-700"
                    >
                      Upload Images
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />

                    {photos.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                        {photos.map((photo) => (
                          <div key={photo.id} className="group relative overflow-hidden rounded-2xl">
                            <img src={photo.preview} alt="Preview" className="h-28 w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removePhoto(photo.id)}
                              className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs text-rose-600 opacity-0 transition group-hover:opacity-100"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/host/listings")}
                  className="rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-primary-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Publishing..." : "Publish Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeHost;
