"use client";

import { useEffect, useState } from "react";
import {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "@/lib/actions/addresses";
import type { SelectAddress, InsertAddress } from "@/lib/db/schema";
import { MapPin, Plus, Edit, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type AddressFormData = Omit<InsertAddress, "userId">;

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<SelectAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SelectAddress | null>(
    null,
  );
  const [formData, setFormData] = useState<AddressFormData>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    phone: "",
    isDefault: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const result = await getUserAddresses();
      setAddresses(result);
    } catch (err) {
      toast.error("Failed to load addresses");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingAddress) {
        const result = await updateAddress(editingAddress.id, formData);
        if (result.success) {
          toast.success("Address updated successfully");
          await loadAddresses();
          resetForm();
        } else {
          toast.error(result.error || "Failed to update address");
        }
      } else {
        const result = await createAddress(formData);
        if (result.success) {
          toast.success("Address added successfully");
          await loadAddresses();
          resetForm();
        } else {
          toast.error(result.error || "Failed to add address");
        }
      }
    } catch (err) {
      toast.error("An error occurred");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (address: SelectAddress) => {
    setEditingAddress(address);
    setFormData({
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      phone: address.phone,
      isDefault: address.isDefault,
    });
    setShowForm(true);
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      const result = await deleteAddress(addressId);
      if (result.success) {
        toast.success("Address deleted successfully");
        await loadAddresses();
      } else {
        toast.error(result.error || "Failed to delete address");
      }
    } catch (err) {
      toast.error("An error occurred");
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      line1: "",
      line2: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      phone: "",
      isDefault: false,
    });
    setEditingAddress(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-body text-dark-600">Loading addresses...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-body text-dark-600">
          {addresses.length} {addresses.length === 1 ? "address" : "addresses"}{" "}
          saved
        </p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-dark-900 px-4 py-2 text-body font-medium text-light-100 transition-colors hover:bg-dark-700"
          >
            <Plus className="h-5 w-5" />
            Add Address
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-8 rounded-lg border border-light-300 bg-light-100 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-heading-3 text-dark-900">
              {editingAddress ? "Edit Address" : "Add New Address"}
            </h2>
            <button
              onClick={resetForm}
              className="text-dark-600 hover:text-dark-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-body-medium font-medium text-dark-900">
                Address Line 1
              </label>
              <input
                type="text"
                value={formData.line1}
                onChange={(e) =>
                  setFormData({ ...formData, line1: e.target.value })
                }
                className="w-full rounded-md border border-light-300 px-4 py-2 text-body text-dark-900 focus:border-dark-900 focus:outline-none"
                placeholder="123 Main Street"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-body-medium font-medium text-dark-900">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                value={formData.line2 || ""}
                onChange={(e) =>
                  setFormData({ ...formData, line2: e.target.value || null })
                }
                className="w-full rounded-md border border-light-300 px-4 py-2 text-body text-dark-900 focus:border-dark-900 focus:outline-none"
                placeholder="Apt, Suite, Unit, etc."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-body-medium font-medium text-dark-900">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full rounded-md border border-light-300 px-4 py-2 text-body text-dark-900 focus:border-dark-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-body-medium font-medium text-dark-900">
                  State/Province
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full rounded-md border border-light-300 px-4 py-2 text-body text-dark-900 focus:border-dark-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-body-medium font-medium text-dark-900">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="w-full rounded-md border border-light-300 px-4 py-2 text-body text-dark-900 focus:border-dark-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-body-medium font-medium text-dark-900">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                  className="w-full rounded-md border border-light-300 px-4 py-2 text-body text-dark-900 focus:border-dark-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-body-medium font-medium text-dark-900">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full rounded-md border border-light-300 px-4 py-2 text-body text-dark-900 focus:border-dark-900 focus:outline-none"
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault || false}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="h-4 w-4 rounded border-light-300 text-dark-900 focus:ring-dark-900"
              />
              <label
                htmlFor="isDefault"
                className="text-body-medium text-dark-900"
              >
                Set as default address
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-dark-900 px-6 py-2 text-body font-medium text-light-100 transition-colors hover:bg-dark-700 disabled:opacity-50"
              >
                {submitting
                  ? "Saving..."
                  : editingAddress
                    ? "Update Address"
                    : "Add Address"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-light-300 px-6 py-2 text-body font-medium text-dark-900 transition-colors hover:bg-light-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-24 w-24 text-dark-300 mb-6" />
          <h2 className="text-heading-2 text-dark-900 mb-4">
            No addresses yet
          </h2>
          <p className="text-body text-dark-600 mb-8">
            Add your shipping and billing addresses for faster checkout.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-lg border border-light-300 bg-light-100 p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {address.isDefault && (
                      <span className="rounded-full bg-dark-900 px-2 py-1 text-caption text-light-100">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="text-dark-600 hover:text-dark-900"
                    title="Edit address"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete address"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-body text-dark-700">
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.city}, {address.state}
                </p>
                <p>{address.country}</p>
                <p>{address.postalCode}</p>
                <p className="mt-2 text-body-medium font-medium text-dark-900">
                  {address.phone}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
