import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  Building, 
  MapPin, 
  Phone, 
  DollarSign, 
  CreditCard, 
  Upload, 
  Check, 
  AlertTriangle,
  Loader2,
  FileText,
  Plus,
  Trash
} from 'lucide-react';

const Settings = () => {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState({
    companyName: '',
    address: '',
    mobile: '',
    phone: '',
    gstNumber: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    defaultHsnCode: '',
    noteText: '',
    logoUrl: '',
    logoSquareUrl: '',
    currency: 'INR'
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedSquareFile, setSelectedSquareFile] = useState(null);
  const [previewSquareUrl, setPreviewSquareUrl] = useState('');

  const fetchSettings = async (selectId = null) => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/settings');
      setProfiles(res.data);
      
      if (res.data.length > 0) {
        let activeProfile = res.data[0];
        if (selectId) {
          const found = res.data.find(p => p._id === selectId);
          if (found) activeProfile = found;
        }
        
        setSelectedProfile(activeProfile);
        setIsAddingNew(false);
        
        if (activeProfile.logoUrl) {
          setPreviewUrl(`http://localhost:5000${activeProfile.logoUrl}`);
        } else {
          setPreviewUrl('');
        }
        
        if (activeProfile.logoSquareUrl) {
          setPreviewSquareUrl(`http://localhost:5000${activeProfile.logoSquareUrl}`);
        } else {
          setPreviewSquareUrl('');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load company profile settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSquareFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedSquareFile(file);
      setPreviewSquareUrl(URL.createObjectURL(file));
    }
  };

  const handleSelectProfile = (profile) => {
    setIsAddingNew(false);
    setSelectedProfile(profile);
    setError('');
    setSelectedFile(null);
    setSelectedSquareFile(null);
    if (profile.logoUrl) {
      setPreviewUrl(`http://localhost:5000${profile.logoUrl}`);
    } else {
      setPreviewUrl('');
    }
    if (profile.logoSquareUrl) {
      setPreviewSquareUrl(`http://localhost:5000${profile.logoSquareUrl}`);
    } else {
      setPreviewSquareUrl('');
    }
  };

  const handleInitAddNew = () => {
    setIsAddingNew(true);
    setError('');
    setSelectedFile(null);
    setSelectedSquareFile(null);
    setPreviewUrl('');
    setPreviewSquareUrl('');
    setSelectedProfile({
      companyName: '',
      address: '',
      mobile: '',
      phone: '',
      gstNumber: '',
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      defaultHsnCode: '998361',
      noteText: 'Please send payment within 30 days of receiving this invoice.',
      logoUrl: '',
      logoSquareUrl: '',
      currency: 'INR'
    });
  };

  const handleDeleteProfile = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company profile? Invoices previously generated under this company will fall back to default settings.')) return;
    try {
      setError('');
      await API.delete(`/settings/${id}`);
      fetchSettings();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete company profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccess(false);
      setError('');

      const formData = new FormData();
      Object.keys(selectedProfile).forEach(key => {
        if (key !== 'logoUrl' && key !== 'logoSquareUrl' && key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
          formData.append(key, selectedProfile[key]);
        }
      });

      if (selectedFile) {
        formData.append('logo', selectedFile);
      }
      if (selectedSquareFile) {
        formData.append('logoSquare', selectedSquareFile);
      }

      let res;
      if (isAddingNew) {
        res = await API.post('/settings', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        res = await API.put(`/settings/${selectedProfile._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setSelectedFile(null);
      setSelectedSquareFile(null);
      await fetchSettings(res.data._id);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save company settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 p-8 text-slate-800 overflow-y-auto max-h-[calc(100vh-80px)] select-none">

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check size={16} />
          Settings saved successfully! Invoices generated will render these profile details instantly.
        </div>
      )}

      {loading && profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
          <p className="text-sm font-semibold tracking-wide">Retrieving registered company records...</p>
        </div>
      ) : (
        <>
          {/* Company Profiles Registry grid */}
          <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                <Building size={18} className="text-blue-500" />
                Registered Company Profiles ({profiles.length})
              </h3>
              <button
                onClick={handleInitAddNew}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 border border-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer shadow-md shadow-blue-500/10"
              >
                <Plus size={14} />
                Add New Company
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((profile) => {
                const isSelected = !isAddingNew && selectedProfile?._id === profile._id;
                return (
                  <div
                    key={profile._id}
                    onClick={() => handleSelectProfile(profile)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all relative flex flex-col justify-between min-h-[120px] group select-none ${
                      isSelected 
                        ? 'bg-blue-50/50 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.05)]' 
                        : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-extrabold text-slate-800 text-xs tracking-tight truncate max-w-[80%]">
                          {profile.companyName}
                        </h4>
                        {isSelected && (
                          <span className="inline-flex items-center text-[8px] bg-blue-100 text-blue-600 border border-blue-200 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 truncate">{profile.address}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[9px] text-slate-550">
                        <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">GSTIN: {profile.gstNumber}</span>
                        <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">{profile.bankName}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-2 border-t border-slate-100 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProfile(profile._id);
                        }}
                        className="p-1 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                        title="Delete Profile"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Settings Input Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Building size={18} className="text-blue-500" />
                {isAddingNew ? 'Register New Company profile' : `Configure Profile: ${selectedProfile.companyName || 'Biller'}`}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Row 1: Company Name, HSN & Currency */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      value={selectedProfile.companyName}
                      onChange={handleChange}
                      required
                      placeholder="e.g. AETHER DIGITAL SOLUTIONS"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Default HSN Code</label>
                    <input
                      type="text"
                      name="defaultHsnCode"
                      value={selectedProfile.defaultHsnCode}
                      onChange={handleChange}
                      required
                      placeholder="e.g. 998361"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">System Currency</label>
                    <select
                      name="currency"
                      value={selectedProfile.currency || 'INR'}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="INR">INR (₹) - Indian Rupees</option>
                      <option value="USD">USD ($) - US Dollars</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Address */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-550 tracking-wider mb-2">Company Address</label>
                  <textarea
                    name="address"
                    value={selectedProfile.address}
                    onChange={handleChange}
                    required
                    rows="3"
                    placeholder="Provide official registration coordinates..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all resize-none placeholder:text-slate-400"
                  />
                </div>

                {/* Row 3: Mobile, Phone, GSTIN */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Mobile Number</label>
                    <input
                      type="text"
                      name="mobile"
                      value={selectedProfile.mobile}
                      onChange={handleChange}
                      required
                      placeholder="e.g. 799-700-1144"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Phone Lines</label>
                    <input
                      type="text"
                      name="phone"
                      value={selectedProfile.phone}
                      onChange={handleChange}
                      required
                      placeholder="e.g. 0863-2223115"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">GSTIN (GST Number)</label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={selectedProfile.gstNumber}
                      onChange={handleChange}
                      required
                      placeholder="e.g. 37AAUCM1990N1ZH"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Bank Details Area */}
                <div className="border-t border-slate-100 pt-5 mt-5">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CreditCard size={16} className="text-emerald-500" />
                    Payment & Bank Channels
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Account Holder Name</label>
                      <input
                        type="text"
                        name="accountHolderName"
                        value={selectedProfile.accountHolderName}
                        onChange={handleChange}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Bank Name</label>
                      <input
                        type="text"
                        name="bankName"
                        value={selectedProfile.bankName}
                        onChange={handleChange}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Account Number</label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={selectedProfile.accountNumber}
                        onChange={handleChange}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Branch & IFSC Code</label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={selectedProfile.ifscCode}
                        onChange={handleChange}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Note / Terms */}
                <div className="border-t border-slate-100 pt-5">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Default Invoice Note / Payment SLA</label>
                  <textarea
                    name="noteText"
                    value={selectedProfile.noteText}
                    onChange={handleChange}
                    required
                    rows="2"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all resize-none placeholder:text-slate-400"
                  />
                </div>

                {/* Logo Upload Widgets */}
                <div className="border-t border-slate-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Wordmark logo */}
                  <div className="bg-slate-50/50 p-4 border border-slate-200 rounded-2xl">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">
                      Company Wordmark Logo (Wide)
                    </label>
                    <div className="flex flex-col gap-4">
                      {previewUrl ? (
                        <div className="relative group w-full h-20 bg-white rounded-xl flex items-center justify-center p-3 border border-slate-200 overflow-hidden shadow-inner">
                          <img src={previewUrl} alt="Name Logo preview" className="max-w-full max-h-full object-contain" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <label htmlFor="logo-upload" className="cursor-pointer text-[10px] font-black text-white hover:underline">Change Logo</label>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-20 rounded-xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                          <Building size={20} className="text-slate-400" />
                          <span className="text-[9px] uppercase tracking-wider font-bold">No Wordmark Logo</span>
                        </div>
                      )}
                      
                      <div>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border border-slate-200 shadow-sm w-full justify-center"
                        >
                          <Upload size={13} />
                          Choose Wordmark File
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Square Logo */}
                  <div className="bg-slate-50/50 p-4 border border-slate-200 rounded-2xl">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">
                      Company Square Icon (1:1 Ratio)
                    </label>
                    <div className="flex flex-col gap-4">
                      {previewSquareUrl ? (
                        <div className="relative group w-full h-20 bg-white rounded-xl flex items-center justify-center p-3 border border-slate-200 overflow-hidden shadow-inner">
                          <img src={previewSquareUrl} alt="Square Logo preview" className="max-w-[4.5rem] max-h-full object-contain" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <label htmlFor="logo-square-upload" className="cursor-pointer text-[10px] font-black text-white hover:underline">Change Icon</label>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-20 rounded-xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                          <Building size={20} className="text-slate-400" />
                          <span className="text-[9px] uppercase tracking-wider font-bold">No Square Icon</span>
                        </div>
                      )}
                      
                      <div>
                        <input
                          id="logo-square-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleSquareFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="logo-square-upload"
                          className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border border-slate-200 shadow-sm w-full justify-center"
                        >
                          <Upload size={13} />
                          Choose Square File
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
                  {isAddingNew && (
                    <button
                      type="button"
                      onClick={() => {
                        if (profiles.length > 0) {
                          handleSelectProfile(profiles[0]);
                        } else {
                          setIsAddingNew(false);
                        }
                      }}
                      className="inline-flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 border border-blue-500 text-white px-8 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 min-w-44 shadow-lg shadow-blue-500/20"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-white" />
                        Saving profile...
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        {isAddingNew ? 'Create Company Profile' : 'Save Profile Changes'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Dynamic Live Mockup */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                Live Invoice Mockup (Preview)
              </h3>
              
              <div className="flex-1 bg-white text-slate-900 rounded-xl p-6 border border-slate-350 shadow-inner select-none font-sans overflow-hidden max-h-[660px] flex flex-col justify-between">
                
                {/* Row 1: Header */}
                <div className="flex items-start justify-between border-b border-slate-300 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    {previewSquareUrl && previewUrl ? (
                      <div className="flex items-center gap-0.5">
                        <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center overflow-hidden border border-slate-200 p-0.5">
                          <img src={previewSquareUrl} alt="Square Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="w-32 h-12 bg-white flex items-center justify-center overflow-hidden">
                          <img src={previewUrl} alt="Name Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                      </div>
                    ) : previewSquareUrl ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center overflow-hidden border border-slate-200 p-0.5">
                          <img src={previewSquareUrl} alt="Square Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-blue-900 text-sm tracking-tight leading-none">
                            {selectedProfile.companyName || 'MANUEN INFOTECH'}
                          </h4>
                          <span className="text-[7px] text-green-600 font-bold tracking-wide">I N F O T E C H</span>
                        </div>
                      </div>
                    ) : previewUrl ? (
                      <div className="w-36 h-12 bg-white flex items-center justify-center overflow-hidden">
                        <img src={previewUrl} alt="Name Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-900 rounded-md flex items-center justify-center font-black text-white text-sm">
                          {(selectedProfile.companyName || 'M')[0] || 'M'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-blue-900 text-sm tracking-tight leading-none">
                            {selectedProfile.companyName || 'MANUEN INFOTECH'}
                          </h4>
                          <span className="text-[7px] text-green-600 font-bold tracking-wide">I N F O T E C H</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border border-black text-[7px] font-bold p-1 px-2.5 text-left w-28 bg-slate-50">
                    <div className="border-b border-black pb-0.5 mb-0.5">Date : {new Date().toLocaleDateString('en-GB')}</div>
                    <div>Invoice No : MIT2026001</div>
                  </div>
                </div>

                {/* Centered teal title */}
                <h2 className="text-center font-black text-cyan-500 text-lg leading-none tracking-wider mb-4">INVOICE</h2>

                {/* Side by side columns */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-[7px]">
                  {/* FROM Box */}
                  <div className="border border-slate-300 bg-white">
                    <div className="bg-[#e8e5d3] font-bold p-1 border-b border-slate-300">FROM</div>
                    <div className="p-1.5 space-y-0.5">
                      <p className="font-extrabold">{selectedProfile.companyName || 'MANUEN INFOTECH'}</p>
                      <p className="text-slate-650">{selectedProfile.address || 'Vaarahi Enclave, 6/13 Brodipet, Guntur-2'}</p>
                      <p className="text-slate-650">Mobile No : {selectedProfile.mobile || '799-700-1144'}</p>
                      <p className="text-slate-650">GST No : {selectedProfile.gstNumber || '37AAUCM1990N1ZH'}</p>
                    </div>
                  </div>

                  {/* BILL TO Box */}
                  <div className="border border-slate-300 bg-white">
                    <div className="bg-[#e8e5d3] font-bold p-1 border-b border-slate-300">BILL TO</div>
                    <div className="p-1.5 space-y-0.5">
                      <p className="font-extrabold">SURYA ASSOCIATES</p>
                      <p className="text-slate-600">20-08-148, Chalamaya Satram, Sangadigunta, GUNTUR-522003, AP.</p>
                      <p className="text-slate-650">GST NO : 37AOCPS6929L1Z8</p>
                      <p className="text-slate-650">Phone No : 0863-2223115</p>
                      <p className="text-slate-650">Mobile No : 888-664-4111</p>
                    </div>
                  </div>
                </div>

                {/* Main Service Table Grid */}
                <div className="border border-black overflow-hidden mb-4 text-[7.5px]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#e8e5d3] border-b border-black font-extrabold">
                        <th className="border-r border-black p-1 text-center w-10">S NO</th>
                        <th className="border-r border-black p-1 text-left">Description of Services</th>
                        <th className="border-r border-black p-1 text-center w-16">HSN Code</th>
                        <th className="border-r border-black p-1 text-center w-16">Quantity</th>
                        <th className="p-1 text-right w-20">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-1.5 text-center">1</td>
                        <td className="border-r border-black p-1.5">
                          <p className="font-bold">Digital Marketing poster service</p>
                          <div className="mt-4 pl-8 space-y-1 font-extrabold text-slate-700">
                            <p>CGST (9%)</p>
                            <p>SGST (9%)</p>
                          </div>
                        </td>
                        <td className="border-r border-black p-1.5 text-center">{selectedProfile.defaultHsnCode || '998361'}</td>
                        <td className="border-r border-black p-1.5 text-center">6 Months</td>
                        <td className="p-1.5 text-right font-medium">
                          <p>16,949.00/-</p>
                          <div className="mt-4 space-y-1 font-extrabold">
                            <p>1,525.50/-</p>
                            <p>1,525.50/-</p>
                          </div>
                        </td>
                      </tr>
                      <tr className="bg-[#e8e5d3] font-bold">
                        <td className="border-r border-black p-1.5 text-center">Total:</td>
                        <td className="border-r border-black p-1.5"></td>
                        <td className="border-r border-black p-1.5"></td>
                        <td className="border-r border-black p-1.5 text-center">6 Months</td>
                        <td className="p-1.5 text-right font-black">20,000.00/-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tax summary */}
                <div className="border border-black overflow-hidden mb-4 text-[7px]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#e8e5d3] border-b border-black font-extrabold">
                        <th className="border-r border-black p-1 text-center w-16">HSN</th>
                        <th className="border-r border-black p-1 text-right">Amount</th>
                        <th className="border-r border-black p-1 text-right">CGST (9%)</th>
                        <th className="border-r border-black p-1 text-right">SGST (9%)</th>
                        <th className="p-1 text-right">Total Tax Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-1 text-center font-bold">{selectedProfile.defaultHsnCode || '998361'}</td>
                        <td className="border-r border-black p-1 text-right">16,949.00/-</td>
                        <td className="border-r border-black p-1 text-right">1,525.50/-</td>
                        <td className="border-r border-black p-1 text-right">1,525.50/-</td>
                        <td className="p-1 text-right">3,051.00/-</td>
                      </tr>
                      <tr className="bg-[#e8e5d3] font-bold">
                        <td className="border-r border-black p-1 text-center">Total</td>
                        <td className="border-r border-black p-1 text-right">16,949.00/-</td>
                        <td className="border-r border-black p-1 text-right">1,525.50/-</td>
                        <td className="border-r border-black p-1 text-right">1,525.50/-</td>
                        <td className="p-1 text-right font-extrabold">3,051.00/-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Words & Bank */}
                <div className="grid grid-cols-2 gap-4 text-[7px] mb-4">
                  <div>
                    <p className="text-slate-500">Total Amount (in words):</p>
                    <p className="font-extrabold text-slate-800">Twenty Thousand Rupees only</p>
                  </div>
                  <div className="pl-6 border-l border-slate-200">
                    <p className="font-black text-slate-900">Company's Bank Details</p>
                    <div className="mt-1 text-slate-650 space-y-0.5">
                      <p>A/c Holder: {selectedProfile.accountHolderName || 'MANUEN INFOTECH (OPC)'}</p>
                      <p>Bank Name: {selectedProfile.bankName || 'HDFC BANK'}</p>
                      <p>Account No: {selectedProfile.accountNumber || '50200118677718'}</p>
                      <p>Branch & IFS Code: {selectedProfile.ifscCode || 'Kothapet & HDFC0004266'}</p>
                    </div>
                  </div>
                </div>

                {/* Note banner */}
                <div className="border border-black overflow-hidden text-[6px]">
                  <div className="bg-[#e8e5d3] border-b border-black font-extrabold text-center p-0.5">Note</div>
                  <p className="p-1 text-center italic text-slate-800">
                    {selectedProfile.noteText || 'Please send payment within 30 days of receiving this invoice...'}
                  </p>
                </div>

              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Settings;
