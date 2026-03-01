import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, Trash, Edit, Calendar as CalendarIcon, X, TrendingUp, DollarSign, 
  LayoutDashboard, XCircle, Wifi, Utensils, Waves, Car, Tv, Dumbbell, Shield, Wind, Coffee, MapPin, Loader2, Upload, Users, Wrench, MessageSquare, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2'; 
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import API from '../services/api';
import PageHeader from '../components/layout/PageHeader';
import { theme } from '../theme';
import { useResponsive } from '../hooks/useResponsive';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- DESIGN TOKENS & STYLES ---
const dashboardWrapper = { minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: theme.typography.fontFamily };
const headerContainer = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' };
const pillNavContainer = { display: 'flex', gap: '1rem', backgroundColor: '#eee', padding: '0.4rem', borderRadius: '16px', width: 'fit-content', marginBottom: '3.5rem' };
const pillTabStyle = (active) => ({ padding: '0.8rem 2rem', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem', backgroundColor: active ? '#fff' : 'transparent', color: active ? theme.colors.charcoal : theme.colors.slate, boxShadow: active ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' });
const mainAddButtonStyle = { display: 'flex', alignItems: 'center', gap: '0.8rem', backgroundColor: theme.colors.charcoal, color: '#fff', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: theme.shadows.md };
const cancelButtonStyle = { display: 'flex', alignItems: 'center', gap: '0.8rem', backgroundColor: '#fff', color: theme.colors.charcoal, border: `1px solid ${theme.colors.divider}`, padding: '1rem 2rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' };
const formContainerStyle = { backgroundColor: '#fff', border: `1px solid ${theme.colors.divider}`, borderRadius: '24px', padding: '4rem', marginBottom: '4rem', boxShadow: theme.shadows.lg };
const listingCardStyle = { padding: '1.8rem', backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '2.5rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' };
const imageWrapper = { position: 'relative', overflow: 'hidden', borderRadius: '14px', width: '180px', height: '120px' };
const refinedThumbStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const statusBadge = { position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(22, 163, 74, 0.9)', color: '#fff', fontSize: '0.65rem', fontWeight: '900', padding: '0.3rem 0.7rem', borderRadius: '6px', letterSpacing: '0.05em' };
const listingLinkStyle = { display: 'flex', alignItems: 'center', gap: '3rem', flex: 1, textDecoration: 'none', color: 'inherit' };
const refinedTagStyle = { fontSize: '0.7rem', fontWeight: '800', backgroundColor: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '8px', color: '#4b5563', textTransform: 'uppercase' };
const refinedTagStyleRed = { ...refinedTagStyle, backgroundColor: '#fee2e2', color: theme.colors.brand, display: 'flex', alignItems: 'center', gap: '0.4rem' };
const removeTagBtnStyle = { background: 'none', border: 'none', color: theme.colors.brand, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', borderRadius: '50%' };
const listingMetricsStyle = (isMobile) => ({ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '0.5rem' : '3rem' });
const dividerVertical = { width: '1px', height: '50px', backgroundColor: '#eee' };
const verticalDividerSmall = { width: '1px', height: '24px', backgroundColor: '#e5e7eb' };
const propertyNameStyle = { fontWeight: '900', fontSize: '1.4rem', color: theme.colors.charcoal, letterSpacing: '-0.03em' };
const priceValueStyle = { fontWeight: '900', fontSize: '1.8rem', color: theme.colors.charcoal, letterSpacing: '-0.02em' };
const priceLabelStyle = { fontSize: '0.7rem', color: theme.colors.slate, textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em', marginTop: '0.2rem' };
const pillActionButton = (color) => ({ width: '44px', height: '44px', borderRadius: '50%', border: `1px solid ${color}20`, backgroundColor: `${color}08`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', color: color });
const iconCircleButton = { width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid #e5e7eb', color: theme.colors.charcoal, cursor: 'pointer', transition: 'all 0.2s' };
const fileUploadLabel = { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.2rem', backgroundColor: '#f3f4f6', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', border: '1px solid #e5e7eb' };
const emptyStateStyle = { padding: '8rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '24px', border: `2px dashed ${theme.colors.divider}` };
const statCardStyle = { display: 'flex', alignItems: 'center', gap: '2rem', padding: '3rem', backgroundColor: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' };
const statLabelStyle = { fontSize: '0.8rem', color: theme.colors.slate, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' };
const statValueStyle = { fontSize: '2.5rem', fontWeight: '900', color: theme.colors.charcoal, marginTop: '0.4rem' };
const chartBoxStyle = { backgroundColor: '#fff', borderRadius: '24px', padding: '4rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' };
const tableTh = { padding: '1.5rem 2rem', fontSize: '0.75rem', fontWeight: '900', color: theme.colors.slate, textTransform: 'uppercase', letterSpacing: '0.1em' };
const tableTd = { padding: '1.5rem 2rem', verticalAlign: 'middle', color: theme.colors.charcoal, fontSize: '0.95rem' };
const statusBadgeStyle = (color) => ({ padding: '0.4rem 1rem', backgroundColor: `${color}15`, color: color, borderRadius: '30px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' });
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '0.8rem' };
const labelStyle = { fontSize: '0.75rem', fontWeight: '900', color: theme.colors.charcoal, textTransform: 'uppercase', letterSpacing: '0.1em' };
const inputStyle = { padding: '1.2rem', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '1rem', outline: 'none', transition: 'all 0.2s', backgroundColor: '#f9fafb', fontFamily: 'inherit' };
const navLinkStyle = (isMobile) => ({ textDecoration: 'none', color: theme.colors.charcoal, fontSize: isMobile ? '1.1rem' : theme.typography.sizes.sm, fontWeight: theme.typography.weights.semibold, display: 'flex', alignItems: 'center', gap: '1rem', padding: isMobile ? '1.2rem 1.5rem' : '0.5rem 1rem', borderRadius: theme.radius.sm, borderBottom: isMobile ? `1px solid ${theme.colors.lightGrey}` : 'none' });
const amenityChipStyle = (active) => ({ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.8rem 1.4rem', borderRadius: '12px', border: `1px solid ${active ? theme.colors.charcoal : '#e5e7eb'}`, backgroundColor: active ? theme.colors.charcoal : '#fff', color: active ? '#fff' : '#4b5563', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' });
const removeImgBtnStyle = { position: 'absolute', top: '-8px', right: '-8px', backgroundColor: theme.colors.brand, color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: theme.shadows.sm };
const primaryButtonStyle = { backgroundColor: theme.colors.charcoal, color: '#fff', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' };

// --- LUXURY AVAILABILITY STYLES ---
const availabilityCardStyle = { ...listingCardStyle, flexDirection: 'column', alignItems: 'stretch', gap: '0' };
const mainAddBtnSmall = { padding: '0.6rem 1.2rem', backgroundColor: theme.colors.charcoal, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' };
const cancelBtnSmall = { padding: '0.6rem 1.2rem', backgroundColor: '#fff', color: theme.colors.charcoal, border: `1px solid ${theme.colors.divider}`, borderRadius: '8px', fontWeight: '800', cursor: 'pointer' };
const calendarDock = { marginTop: '2rem', paddingTop: '2rem', borderTop: `1px solid ${theme.colors.divider}`, display: 'flex', gap: '4rem', alignItems: 'flex-start' };
const dockTitle = { margin: 0, fontSize: '1.1rem', fontWeight: '900' };
const dockSubtitle = { fontSize: '0.85rem', color: theme.colors.slate, marginTop: '0.5rem', lineHeight: '1.5', maxWidth: '300px' };
const rangePreview = { marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#f9fafb', padding: '1.2rem', borderRadius: '12px', width: 'fit-content' };
const previewBox = { display: 'flex', flexDirection: 'column', gap: '0.3rem' };
const applyBtnStyle = { ...primaryButtonStyle, marginTop: '2rem', width: '100%', maxWidth: '300px' };

// --- MOBILE RESERVATION STYLES ---
const mobileResCard = { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: theme.shadows.card, border: `1px solid ${theme.colors.divider}` };
const mobileMessageBtn = { ...navLinkStyle(false), backgroundColor: '#f3f4f6', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' };

// --- SUB-COMPONENTS ---
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div style={statCardStyle}>
    <div style={{ backgroundColor: `${color}10`, padding: '1.2rem', borderRadius: '20px' }}>
      <Icon size={32} color={color} />
    </div>
    <div>
      <div style={statLabelStyle}>{label}</div>
      <div style={statValueStyle}>{value}</div>
    </div>
  </div>
);

const AvailabilityCard = ({ listing, onUpdate }) => {
  const [range, setRange] = useState([null, null]);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleAdd = () => {
    if (!range[0] || !range[1]) return toast.error("Selection incomplete");
    const newDates = [...(listing.unavailableDates || []), { start: range[0], end: range[1] }];
    onUpdate(listing._id, newDates);
    setRange([null, null]);
    setShowCalendar(false);
  };

  const handleRemove = (index) => {
    const newDates = listing.unavailableDates.filter((_, i) => i !== index);
    onUpdate(listing._id, newDates);
  };

  return (
    <div style={availabilityCardStyle}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={imageWrapper}><img src={listing.images[0]} style={refinedThumbStyle} alt="listing" /></div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900' }}>{listing.title}</h4>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {(listing.unavailableDates || []).length === 0 ? (
              <span style={{ fontSize: '0.85rem', color: theme.colors.slate }}>Operational 24/7. No scheduled downtime.</span>
            ) : (
              listing.unavailableDates.map((d, i) => (
                <div key={i} style={refinedTagStyleRed}>
                  <Wrench size={12} /> {new Date(d.start).toLocaleDateString()} - {new Date(d.end).toLocaleDateString()}
                  <button onClick={() => handleRemove(i)} style={removeTagBtnStyle}><X size={10} /></button>
                </div>
              ))
            )}
          </div>
        </div>
        <button 
          onClick={() => setShowCalendar(!showCalendar)} 
          style={showCalendar ? cancelBtnSmall : mainAddBtnSmall}
        >
          {showCalendar ? 'Cancel' : 'Block Dates'}
        </button>
      </div>

      <AnimatePresence>
        {showCalendar && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={calendarDock}>
              <div style={{ flex: 1 }}>
                <h5 style={dockTitle}>Schedule Maintenance</h5>
                <p style={dockSubtitle}>Select the range of dates this property will be unavailable for discovery.</p>
                {range[0] && range[1] && (
                  <div style={rangePreview}>
                    <div style={previewBox}><span>START</span><strong>{range[0].toLocaleDateString()}</strong></div>
                    <ArrowRight size={20} color={theme.colors.slate} />
                    <div style={previewBox}><span>END</span><strong>{range[1].toLocaleDateString()}</strong></div>
                  </div>
                )}
                <button onClick={handleAdd} disabled={!range[0] || !range[1]} style={applyBtnStyle}>Commit Downtime</button>
              </div>
              <div className="luxury-calendar-wrapper">
                <Calendar selectRange={true} onChange={setRange} value={range} minDate={new Date()} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * ============================================================================
 * 🏢 ADMIN DASHBOARD (The Host Management Suite)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * This component acts as the high-fidelity control center for 'admin' users.
 * 
 * Architectural Evolution:
 * - Phase 1: A basic HTML table for CRUD operations.
 * - Phase 11: Introduction of State Recovery (pre-filling the edit form).
 * - Phase 27: The Cinematic Overhaul. Transitioned to a "Live Card" grid, 
 *   Pill Navigation, and Hybrid S3/URL image uploads.
 * - Phase 42: Omni-Channel Communication & Luxury Availability UI.
 */
/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 46 (The Desktop-Heavy Dashboard)
 * ============================================================================
 * Previously, the mobile dashboard showed all 4 tabs: 
 * Properties, Availability, Reservations, Analytics.
 * 
 * THE FLAW: Typing property descriptions or analyzing revenue charts on a 
 * 6-inch screen was high-friction and prone to user error.
 * 
 * THE FIX: Atomic Management. On mobile, we hide the "Maintenance Heavy" 
 * tabs (Properties/Analytics) and focus purely on "Actionable" hospitality
 * (Availability/Reservations).
 * ============================================================================ */

const AdminDashboard = ({ user, refreshListings }) => {
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState('listings');
  const [adminListings, setAdminListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const standardAmenities = [
    { id: 'WiFi', icon: Wifi }, { id: 'Kitchen', icon: Utensils },
    { id: 'Pool', icon: Waves }, { id: 'Parking', icon: Car },
    { id: 'TV', icon: Tv }, { id: 'AC', icon: Wind },
    { id: 'Gym', icon: Dumbbell }, { id: 'Security', icon: Shield },
    { id: 'Breakfast', icon: Coffee }
  ];

  const [formData, setFormData] = useState({
    _id: null, title: '', location: '', description: '', fullDescription: '', 
    rate: '', category: 'pools', images: [], lat: '', lng: '', imageUrlInput: '',
    maxGuests: 2, bedrooms: 1, beds: 1, amenities: [],
    childRate: null, infantRate: null,
    unavailableDates: []
  });

  const [newMaintenanceRange, setNewMaintenanceRange] = useState([null, null]);
  const [showEditorCalendar, setShowEditorCalendar] = useState(false);

  // Phase 47: Atomic Tab Enforcement
  useEffect(() => {
    if (isMobile && (activeTab === 'listings' || activeTab === 'insights')) {
      setActiveTab('bookings');
    }
  }, [isMobile, activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'listings' || activeTab === 'availability') {
        const response = await API.get(`/listings?adminId=${user?.id || user?._id}`);
        setAdminListings(response.data);
      } else {
        const response = await API.get('/bookings/admin');
        setBookings(response.data);
      }
    } catch (err) { toast.error("Management Sync Failed"); } finally { setLoading(false); }
  };

  useEffect(() => { 
    if (user) fetchAdminData(); 
  }, [activeTab, user]);

  /**
   * REVENUE AGGREGATION ENGINE (Phase 6)
   * Logic: Dynamically computes monthly totals from confirmed reservations 
   * to power the Chart.js visualizer.
   */
  const getChartData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueByMonth = new Array(12).fill(0);
    bookings.filter(b => b.status === 'confirmed').forEach(booking => {
      const date = new Date(booking.createdAt);
      revenueByMonth[date.getMonth()] += booking.totalPrice;
    });
    return { 
      labels: months, 
      datasets: [{ label: 'Confirmed Revenue ($)', data: revenueByMonth, backgroundColor: theme.colors.brand, borderRadius: 8 }] 
    };
  };

  const totalRevenue = bookings.filter(b => b.status === 'confirmed').reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalBookings = bookings.filter(b => b.status === 'confirmed').length;

  const toggleAmenity = (id) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id) ? prev.amenities.filter(a => a !== id) : [...prev.amenities, id]
    }));
  };

  /**
   * FORM STATE RECOVERY (Phase 11)
   * Logic: When a user clicks "Edit", we populate the entire formData state
   * with the existing listing details. This prevents data loss during updates.
   */
  const handleEditClick = (listing) => {
    setFormData({ 
      _id: listing._id, title: listing.title, location: listing.location, 
      description: listing.description, fullDescription: listing.fullDescription, 
      rate: listing.rate, category: listing.category, images: listing.images, 
      lat: listing.coordinates?.lat || '', lng: listing.coordinates?.lng || '', 
      imageUrlInput: '', maxGuests: listing.maxGuests, bedrooms: listing.bedrooms, 
      beds: listing.beds, amenities: listing.amenities || [],
      childRate: listing.childRate || null, infantRate: listing.infantRate || null,
      unavailableDates: listing.unavailableDates || []
    });
    setShowForm(true); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * HYBRID UPLOAD ENGINE (Phase 27)
   * Logic: Sends the physical file to the backend, which streams it to AWS S3,
   * returns the permanent cloud URL, and pushes it into the local state array.
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const uploadToast = toast.loading('Syncing with S3 Cloud...');
    const uploadData = new FormData();
    uploadData.append('image', file);
    try {
      const res = await API.post('/listings/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, images: [...prev.images, res.data.imageUrl] }));
      toast.success('Asset synced successfully.', { id: uploadToast });
    } catch (err) { toast.error('Cloud Sync Failure', { id: uploadToast });
    } finally { setIsUploading(false); }
  };

  const updateListingAvailability = async (listingId, newDates) => {
    const syncToast = toast.loading('Syncing availability...');
    try {
      await API.put(`/listings/${listingId}`, { unavailableDates: newDates });
      toast.success('Availability synchronized.', { id: syncToast });
      fetchAdminData();
    } catch (err) { toast.error('Sync failure.', { id: syncToast }); }
  };

  const addMaintenancePeriod = () => {
    if (!newMaintenanceRange[0] || !newMaintenanceRange[1]) {
      toast.error("Select both start and end dates.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      unavailableDates: [...prev.unavailableDates, { start: newMaintenanceRange[0], end: newMaintenanceRange[1] }]
    }));
    setNewMaintenanceRange([null, null]);
    setShowEditorCalendar(false);
  };

  /* ============================================================================
   * 👻 HISTORICAL GHOST: PHASE 28 (The Management Handshake Failure)
   * ============================================================================
   * const handleSubmitLegacy = async (e) => {
   *    await API.put(`/listings/${formData._id}`, formData); 
   * }
   * 
   * THE FLAW: The backend model expects 'coordinates' to be a nested object
   * { lat, lng }. The original formData was "flattening" these at the top 
   * level. While this worked locally, Production Atlas (Phase 29) rejected 
   * the update because the mandatory 'coordinates' field was technically missing.
   * 
   * THE FIX: A Payload Interceptor that manually nests the data into the
   * structure expected by the Persistence Layer.
   * ============================================================================ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const actionToast = toast.loading(formData._id ? 'Saving changes...' : 'Publishing listing...');
    
    // RECOVERY LOGIC (Phase 28): The backend expects a nested 'coordinates' object.
    const payload = {
      ...formData,
      coordinates: {
        lat: Number(formData.lat) || 40.7128,
        lng: Number(formData.lng) || -74.0060
      }
    };

    try {
      if (formData._id) {
        await API.put(`/listings/${formData._id}`, payload);
        toast.success('Changes saved successfully.', { id: actionToast });
      } else {
        await API.post('/listings', payload);
        toast.success('Listing published.', { id: actionToast });
      }
      setShowForm(false);
      fetchAdminData();
      if (refreshListings) refreshListings();
    } catch (err) { 
      const errorMsg = err.response?.data?.message || err.response?.data || 'Management Handshake Failure';
      toast.error(errorMsg, { id: actionToast }); 
    }
  };

  /* ============================================================================
   * 👻 HISTORICAL GHOST: PHASE 1 (The Dangerous Delete)
   * ============================================================================
   * const deleteListing = async (id) => {
   *    await API.delete(`/listings/${id}`); // Instant removal!
   * }
   * 
   * THE FLAW: No confirmation dialog. One accidental click destroyed data.
   * THE FIX: window.confirm() integration.
   * ============================================================================ */
  const handleDelete = async (id) => {
    if (!window.confirm("Permanent removal of this property? This action is irreversible.")) return;
    const deleteToast = toast.loading('Removing property...');
    try {
      await API.delete(`/listings/${id}`);
      toast.success('Property removed.', { id: deleteToast });
      fetchAdminData();
      if (refreshListings) refreshListings();
    } catch (err) { toast.error('Removal Failure', { id: deleteToast }); }
  };

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
      <Loader2 size={40} className="spin" color={theme.colors.brand} />
      <div style={{ color: theme.colors.slate, fontWeight: '600', letterSpacing: '0.05em' }}>SYNCHRONIZING MANAGEMENT SUITE...</div>
    </div>
  );

  return (
    <div style={dashboardWrapper}>
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: isMobile ? '2rem 1.5rem' : '4rem 2rem' }}>
        
        <div style={headerContainer}>
          <PageHeader 
            title="Host Dashboard" 
            subtitle={isMobile ? "Manage arrivals and scheduling." : `Orchestrating ${adminListings.length} premium properties.`} 
            icon={LayoutDashboard} 
          />
          {!isMobile && (
            <button 
              onClick={() => {
                if (!showForm) {
                  setFormData({
                    _id: null, title: '', location: '', description: '', fullDescription: '', 
                    rate: '', category: 'pools', images: [], lat: '', lng: '', imageUrlInput: '',
                    maxGuests: 2, bedrooms: 1, beds: 1, amenities: [],
                    childRate: null, infantRate: null,
                    unavailableDates: []
                  });
                }
                setShowForm(!showForm);
              }} 
              style={showForm ? cancelButtonStyle : mainAddButtonStyle}
            >
              {showForm ? <><X size={18} /> Close Editor</> : <><PlusCircle size={18} /> New Listing</>}
            </button>
          )}
        </div>
        
        <div style={pillNavContainer}>
          {!isMobile && <button onClick={() => setActiveTab('listings')} style={pillTabStyle(activeTab === 'listings')}>Properties</button>}
          <button onClick={() => setActiveTab('availability')} style={pillTabStyle(activeTab === 'availability')}>Availability</button>
          <button onClick={() => setActiveTab('bookings')} style={pillTabStyle(activeTab === 'bookings')}>Reservations</button>
          {!isMobile && <button onClick={() => setActiveTab('insights')} style={pillTabStyle(activeTab === 'insights')}>Analytics</button>}
        </div>

        {activeTab === 'insights' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
              <StatCard icon={DollarSign} label="Total Confirmed Revenue" value={`$${totalRevenue.toLocaleString()}`} color="#4f46e5" />
              <StatCard icon={CalendarIcon} label="Successful Stays" value={totalBookings} color={theme.colors.brand} />
            </div>
            <div style={chartBoxStyle}><h3>Earnings Overview</h3><div style={{ height: '400px' }}><Bar data={getChartData()} options={{ maintainAspectRatio: false }} /></div></div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div>
            {showForm && (
              <div style={formContainerStyle}>
                <h3 style={{ marginBottom: '2.5rem', fontSize: '1.5rem', fontWeight: '800' }}>{formData._id ? 'Edit Property Details' : 'Listing Configuration'}</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={inputGroup}><label style={labelStyle}>Listing Title</label><input style={inputStyle} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g., Glass Penthouse Overlook" required /></div>
                    <div style={inputGroup}><label style={labelStyle}>Location</label><input style={inputStyle} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="City, Country" required /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={inputGroup}><label style={labelStyle}>Nightly Rate ($)</label><input style={inputStyle} type="number" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} required /></div>
                      <div style={inputGroup}><label style={labelStyle}>Category</label><select style={inputStyle} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option value="pools">Amazing Pools</option>
                        <option value="arctic">Arctic</option>
                        <option value="castles">Castles</option>
                        <option value="islands">Islands</option>
                        <option value="cabins">Cabins</option>
                      </select></div>
                    </div>
                    <div style={inputGroup}><label style={labelStyle}>Teaser Description</label><textarea style={{ ...inputStyle, height: '80px' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Short summary..." required /></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={inputGroup}>
                      <label style={labelStyle}>Amenities</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                        {standardAmenities.map(amenity => (
                          <div key={amenity.id} onClick={() => toggleAmenity(amenity.id)} style={amenityChipStyle(formData.amenities.includes(amenity.id))}><amenity.icon size={16} /> {amenity.id}</div>
                        ))}
                      </div>
                    </div>
                    <div style={inputGroup}>
                      <label style={labelStyle}>Temporal Service Control (Maintenance)</label>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: theme.colors.slate }}>Block out periods for maintenance or personal use.</span>
                        <button type="button" onClick={() => setShowEditorCalendar(!showEditorCalendar)} style={showEditorCalendar ? cancelBtnSmall : mainAddBtnSmall}>
                          {showEditorCalendar ? 'Cancel' : 'Block Dates'}
                        </button>
                      </div>

                      <AnimatePresence>
                        {showEditorCalendar && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', border: `1px solid ${theme.colors.divider}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                {newMaintenanceRange[0] && newMaintenanceRange[1] ? (
                                  <div style={{ ...rangePreview, marginTop: 0 }}>
                                    <div style={previewBox}><span>START</span><strong>{newMaintenanceRange[0].toLocaleDateString()}</strong></div>
                                    <ArrowRight size={20} color={theme.colors.slate} />
                                    <div style={previewBox}><span>END</span><strong>{newMaintenanceRange[1].toLocaleDateString()}</strong></div>
                                  </div>
                                ) : <p style={{ fontSize: '0.8rem', color: theme.colors.slate }}>Select a range on the calendar to proceed.</p>}
                                <button type="button" onClick={addMaintenancePeriod} disabled={!newMaintenanceRange[0] || !newMaintenanceRange[1]} style={{ ...applyBtnStyle, marginTop: '1.5rem' }}>Commit Downtime</button>
                              </div>
                              <div className="luxury-calendar-wrapper small-calendar">
                                <Calendar selectRange={true} onChange={setNewMaintenanceRange} value={newMaintenanceRange} minDate={new Date()} />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {formData.unavailableDates.map((d, i) => (
                          <div key={i} style={refinedTagStyleRed}>
                            <Wrench size={12} /> {new Date(d.start).toLocaleDateString()} - {new Date(d.end).toLocaleDateString()}
                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, unavailableDates: prev.unavailableDates.filter((_, idx) => idx !== i) }))} style={removeTagBtnStyle}><X size={10} /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={inputGroup}>
                      <label style={labelStyle}>Photos</label>
                      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        <input 
                          style={{ ...inputStyle, flex: 1 }} 
                          value={formData.imageUrlInput} 
                          onChange={e => setFormData({...formData, imageUrlInput: e.target.value})} 
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (formData.imageUrlInput) {
                                setFormData(prev => ({ ...prev, images: [...prev.images, prev.imageUrlInput], imageUrlInput: '' }));
                              }
                            }
                          }}
                          placeholder="Paste Image URL..." 
                        />
                        <button type="button" onClick={() => { if(formData.imageUrlInput) setFormData(prev => ({ ...prev, images: [...prev.images, prev.imageUrlInput], imageUrlInput: '' })) }} style={iconCircleButton} title="Add Image URL"><PlusCircle size={22} /></button>
                        <div style={verticalDividerSmall} />
                        <label style={fileUploadLabel}>
                          <Upload size={18} /> {isUploading ? 'Uploading...' : 'Upload from Computer'}
                          <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isUploading} />
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                        {formData.images.map((img, i) => (
                          <div key={i} style={{ position: 'relative' }}>
                            <img src={img} style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover', border: `1px solid ${theme.colors.divider}` }} />
                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} style={removeImgBtnStyle}><X size={12} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button type="submit" style={{ ...primaryButtonStyle, marginTop: 'auto', height: '60px', fontSize: '1.1rem' }}>{formData._id ? 'Save Changes' : 'Publish Listing'}</button>
                  </div>
                </form>
              </div>
            )}

            {adminListings.length === 0 ? (
              <div style={emptyStateStyle}>
                <XCircle size={48} color={theme.colors.divider} />
                <h3 style={{ marginTop: '1.5rem', color: theme.colors.slate }}>No active listings found.</h3>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: isMobile ? '1rem' : '1.5rem' }}>
                {adminListings.map(l => (
                  <motion.div key={l._id} whileHover={!isMobile ? { y: -4, boxShadow: theme.shadows.lg } : {}} style={listingCardStyle}>
                    <Link to={`/listing/${l._id}`} style={listingLinkStyle}>
                      <div style={imageWrapper}>
                        <img src={l.images[0]} style={refinedThumbStyle} alt={l.title} />
                        <div style={statusBadge}>LIVE</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={propertyNameStyle}>{l.title}</div>
                        <div style={{ fontSize: '0.95rem', color: theme.colors.slate, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <MapPin size={14} color={theme.colors.brand} /> {l.location}
                        </div>
                        {!isMobile && (
                          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.6rem' }}>
                             {l.amenities.slice(0, 3).map(a => <span key={a} style={refinedTagStyle}>{a}</span>)}
                             {l.amenities.length > 3 && <span style={refinedTagStyle}>+{l.amenities.length - 3}</span>}
                          </div>
                        )}
                      </div>
                    </Link>
                    <div style={listingMetricsStyle(isMobile)}>
                      <div style={{ textAlign: isMobile ? 'left' : 'right', minWidth: isMobile ? 'auto' : '140px' }}>
                        <div style={priceValueStyle}><span style={{ fontSize: '1rem', fontWeight: '600' }}>$</span>{l.rate}</div>
                        <div style={priceLabelStyle}>Per Night</div>
                      </div>
                      {!isMobile && <div style={dividerVertical} />}
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: isMobile ? 'flex-start' : 'flex-end', marginTop: isMobile ? '1rem' : '0' }}>
                        <button onClick={() => handleEditClick(l)} style={pillActionButton('#4f46e5')} title="Edit Configuration"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(l._id)} style={{ ...pillActionButton(theme.colors.brand) }} title="Remove Listing"><Trash size={18} /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AVAILABILITY MANAGEMENT (Phase 41) */}
        {activeTab === 'availability' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {adminListings.length === 0 ? (
              <div style={emptyStateStyle}><h3>No properties found to manage.</h3></div>
            ) : (
              adminListings.map(l => (
                <AvailabilityCard key={l._id} listing={l} onUpdate={updateListingAvailability} />
              ))
            )}
          </div>
        )}

        {/* RESERVATIONS MANAGEMENT (Phase 39/46) */}
        {activeTab === 'bookings' && (
          <div style={{ backgroundColor: isMobile ? 'transparent' : '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: isMobile ? 'none' : theme.shadows.card, border: isMobile ? 'none' : '1px solid rgba(0,0,0,0.05)' }}>
            {bookings.length === 0 ? (
              <div style={emptyStateStyle}><h3>No reservations found.</h3></div>
            ) : !isMobile ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left', borderBottom: '1px solid #eee' }}>
                    <th style={tableTh}>Guest Identity</th>
                    <th style={tableTh}>Property</th>
                    <th style={tableTh}>Dates</th>
                    <th style={tableTh}>Total</th>
                    <th style={tableTh}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => {
                    const guestCount = (b.guests?.adults || 0) + (b.guests?.children || 0);
                    return (
                      <tr key={b._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={tableTd}>
                          <Link to={`/inbox?listing=${b.listingId?._id}&guest=${b.userId?._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ fontWeight: '700', color: theme.colors.brand }}>{b.userId?.name}</div>
                            <div style={{ fontSize: '0.8rem', color: theme.colors.slate, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Users size={12} /> {guestCount || 1} guest{guestCount !== 1 ? 's' : ''} 
                              {b.guests?.infants > 0 && ` · ${b.guests.infants} infant${b.guests.infants > 1 ? 's' : ''}`}
                            </div>
                          </Link>
                        </td>
                        <td style={tableTd}>
                          <Link to={`/listing/${b.listingId?._id}`} style={{ textDecoration: 'none', color: theme.colors.charcoal, fontWeight: '600' }}>
                            {b.listingId?.title}
                          </Link>
                        </td>
                        <td style={tableTd}>{new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}</td>
                        <td style={tableTd}><div style={{ fontWeight: '800' }}>${b.totalPrice}</div></td>
                        <td style={tableTd}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={statusBadgeStyle(b.status === 'confirmed' ? theme.colors.success : theme.colors.brand)}>
                              {b.status}
                            </span>
                            <Link to={`/inbox?listing=${b.listingId?._id}&guest=${b.userId?._id}`} style={pillActionButton(theme.colors.charcoal)} title="Message Guest">
                              <MessageSquare size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* 📱 MOBILE RESERVATION CARDS */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {bookings.map(b => {
                  const guestCount = (b.guests?.adults || 0) + (b.guests?.children || 0);
                  return (
                    <div key={b._id} style={mobileResCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: '800', color: theme.colors.brand, fontSize: '1.1rem' }}>{b.userId?.name}</div>
                          <div style={{ fontSize: '0.85rem', color: theme.colors.slate, marginTop: '0.2rem' }}>
                            {guestCount} guests {b.guests?.infants > 0 && `· ${b.guests.infants} infant`}
                          </div>
                        </div>
                        <span style={statusBadgeStyle(b.status === 'confirmed' ? theme.colors.success : theme.colors.brand)}>{b.status}</span>
                      </div>
                      
                      <div style={{ margin: '1rem 0', padding: '1rem 0', borderTop: `1px solid ${theme.colors.divider}`, borderBottom: `1px solid ${theme.colors.divider}` }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{b.listingId?.title}</div>
                        <div style={{ fontSize: '0.8rem', color: theme.colors.slate, marginTop: '0.4rem' }}>
                          {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '900', fontSize: '1.1rem' }}>${b.totalPrice}</div>
                        <Link to={`/inbox?listing=${b.listingId?._id}&guest=${b.userId?._id}`} style={mobileMessageBtn}>
                          <MessageSquare size={18} /> Message
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
