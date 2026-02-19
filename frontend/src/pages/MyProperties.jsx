import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, ArrowLeft, Plus, MapPin, Bed, Bath, Edit, Trash2,
  Image as ImageIcon, X, DollarSign, Check, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MyProperties = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '', address: '', city: 'Vancouver', province: 'BC',
    postal_code: '', lat: 49.2827, lng: -123.1207, price: '',
    bedrooms: '', bathrooms: '', sqft: '', property_type: 'Apartment',
    description: '', amenities: [], images: [], available_date: '',
    pet_friendly: false, parking: false, listing_type: 'rent',
    year_built: '', lot_size: '', garage: ''
  });

  const propertyTypes = ['Apartment', 'Condo', 'House', 'Townhouse', 'Loft', 'Studio', 'Duplex', 'Penthouse'];
  const amenityOptions = ['Gym', 'Pool', 'Rooftop Deck', 'In-suite Laundry', 'Bike Storage', 'Concierge',
    'Balcony', 'Fireplace', 'Dishwasher', 'Garage', 'Backyard', 'Home Office', 'Storage'];

  useEffect(() => {
    if (!user || user.user_type !== 'landlord') { navigate('/login'); return; }
    fetchListings();
  }, [user, navigate]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/listings/landlord/${user.id}`);
      setListings(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    const newImages = [...form.images];
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post(`${API}/upload/image`, formData);
        newImages.push(res.data.url);
      } catch (err) { console.error('Upload error:', err); }
    }
    setForm({ ...form, images: newImages });
    setUploading(false);
  };

  const removeImage = (idx) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });
  };

  const toggleAmenity = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const openEdit = (listing) => {
    setEditingListing(listing);
    setForm({
      title: listing.title, address: listing.address, city: listing.city,
      province: listing.province, postal_code: listing.postal_code,
      lat: listing.lat, lng: listing.lng, price: listing.price,
      bedrooms: listing.bedrooms, bathrooms: listing.bathrooms,
      sqft: listing.sqft, property_type: listing.property_type,
      description: listing.description, amenities: listing.amenities || [],
      images: listing.images || [], available_date: listing.available_date || '',
      pet_friendly: listing.pet_friendly, parking: listing.parking
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingListing(null);
    setForm({
      title: '', address: '', city: 'Vancouver', province: 'BC',
      postal_code: '', lat: 49.2827, lng: -123.1207, price: '',
      bedrooms: '', bathrooms: '', sqft: '', property_type: 'Apartment',
      description: '', amenities: [], images: [], available_date: '',
      pet_friendly: false, parking: false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      price: parseInt(form.price), bedrooms: parseInt(form.bedrooms),
      bathrooms: parseFloat(form.bathrooms), sqft: parseInt(form.sqft),
      lat: parseFloat(form.lat), lng: parseFloat(form.lng)
    };

    try {
      if (editingListing) {
        await axios.put(`${API}/listings/${editingListing.id}?landlord_id=${user.id}`, data);
      } else {
        await axios.post(`${API}/listings/create?landlord_id=${user.id}`, data);
      }
      setShowModal(false);
      fetchListings();
    } catch (err) {
      console.error(err);
      alert('Failed to save. Please try again.');
    }
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await axios.delete(`${API}/listings/${listingId}?landlord_id=${user.id}`);
      fetchListings();
    } catch (err) { console.error(err); }
  };

  const toggleStatus = async (listing) => {
    const newStatus = listing.status === 'active' ? 'inactive' : 'active';
    try {
      await axios.put(`${API}/listings/${listing.id}?landlord_id=${user.id}`, { status: newStatus });
      fetchListings();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <header className="bg-[#1A2F3A] text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-white/70 hover:text-white"><ArrowLeft size={18} /></Link>
            <div>
              <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>My Properties</h1>
              <p className="text-sm text-white/70">Manage your property listings</p>
            </div>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm" data-testid="add-property-btn">
            <Plus size={16} /> Add Property
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-[#1A2F3A]">{listings.length}</p>
            <p className="text-sm text-gray-500">Total Properties</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-green-600">{listings.filter(l => l.status === 'active').length}</p>
            <p className="text-sm text-gray-500">Active</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-gray-500">{listings.filter(l => l.status === 'inactive').length}</p>
            <p className="text-sm text-gray-500">Inactive</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-[#1A2F3A]">
              ${listings.reduce((sum, l) => sum + (l.status === 'active' ? l.price : 0), 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Monthly Revenue</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3 mb-4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div>)}</div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Building2 className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Properties Yet</h3>
            <p className="text-gray-500 mb-4">Add your first property listing</p>
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A2F3A] text-white rounded-full hover:bg-[#2C4A52]">
              <Plus size={16} /> Add Property
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow" data-testid={`property-${listing.id}`}>
                <div className="relative h-48">
                  <img src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600'} alt={listing.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium">{listing.property_type}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${listing.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {listing.status}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-[#1A2F3A] rounded-full text-xs font-medium text-white">${listing.price?.toLocaleString()}/mo</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-[#1A2F3A] text-lg mb-1">{listing.title}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-3"><MapPin size={12} />{listing.address}, {listing.city}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1"><Bed size={14} />{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed`}</span>
                    <span className="flex items-center gap-1"><Bath size={14} />{listing.bathrooms} bath</span>
                    <span>{listing.sqft} sqft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(listing)} className="flex-1 px-3 py-2 bg-[#F5F5F0] text-[#1A2F3A] rounded-xl text-sm hover:bg-gray-200 flex items-center justify-center gap-1" data-testid={`edit-property-${listing.id}`}>
                      <Edit size={14} /> Edit
                    </button>
                    <button onClick={() => toggleStatus(listing)} className="px-3 py-2 bg-[#F5F5F0] rounded-xl text-sm hover:bg-gray-200" title={listing.status === 'active' ? 'Deactivate' : 'Activate'}>
                      {listing.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => handleDelete(listing.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-sm hover:bg-red-100" data-testid={`delete-property-${listing.id}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 my-8">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {editingListing ? 'Edit Property' : 'Add New Property'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Property Title</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="Modern Downtown Condo" required data-testid="property-title-input" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Property Type</label>
                  <select value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none">
                    {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Monthly Rent ($)</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="2500" required />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Address</label>
                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="1200 West Georgia St, Unit 2505" required />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="City" required />
                <input type="text" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} className="px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="Province" required />
                <input type="text" value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} className="px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="Postal Code" required />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Bedrooms</label>
                  <input type="number" min="0" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Bathrooms</label>
                  <input type="number" min="0" step="0.5" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Sqft</label>
                  <input type="number" value={form.sqft} onChange={e => setForm({ ...form, sqft: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" required />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Available Date</label>
                <input type="date" value={form.available_date} onChange={e => setForm({ ...form, available_date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none resize-none" placeholder="Describe the property..." required />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Photos</label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#1A2F3A] transition-colors">
                    <ImageIcon size={20} className="text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">{uploading ? 'Uploading...' : 'Add'}</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {amenityOptions.map(a => (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`px-3 py-1.5 rounded-full text-xs transition-colors ${form.amenities.includes(a) ? 'bg-[#1A2F3A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.pet_friendly} onChange={e => setForm({ ...form, pet_friendly: e.target.checked })} className="w-5 h-5 rounded" />
                  <span className="text-sm text-gray-700">Pet Friendly</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.parking} onChange={e => setForm({ ...form, parking: e.target.checked })} className="w-5 h-5 rounded" />
                  <span className="text-sm text-gray-700">Parking Available</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-[#1A2F3A] text-white hover:bg-[#2C4A52]" data-testid="save-property-btn">
                  {editingListing ? 'Update Property' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProperties;
