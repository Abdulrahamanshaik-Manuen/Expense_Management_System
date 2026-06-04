import React, { useEffect, useState, useRef } from 'react';
import API from '../services/api';
import {
  Plus,
  Trash,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  AlertTriangle,
  FolderOpen,
  Users,
  CreditCard,
  Layers,
  ArrowRight,
  ShieldAlert,
  Loader2,
  DollarSign,
  ShoppingBag,
  Landmark,
  Building,
  Activity,
  FileCheck,
  Eye,
  X,
  FileSpreadsheet,
  BookOpen,
  Download
} from 'lucide-react';

/** Indian/Western Currency Number-to-Words */
function priceToWords(price, currency = 'INR') {
  const unitName = 'Rupees';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ',
    'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ',
    'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  let num = Math.floor(price);
  if (num === 0) return `Zero ${unitName} only`;

  if ((num = num.toString()).length > 9) return 'Overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + unitName + ' ' : unitName + ' ';
  return str.trim() + ' only';
}

const Purchases = () => {
  const invoiceFileInput = useRef(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('entries');

  // Database states
  const [orders, setOrders] = useState([]);
  const [entries, setEntries] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [companyProfiles, setCompanyProfiles] = useState([]);

  // Filter States
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterYear, setFilterYear] = useState('All');

  const activeCompanyId = localStorage.getItem('selectedCompanyId');
  const activeCompany = companyProfiles.find(p => p._id === activeCompanyId) || companyProfiles[0];
  const activeCurrency = activeCompany?.currency || 'INR';
  const currencySymbol = '';

  const filteredEntries = entries.filter(entry => {
    const matchCompany = !activeCompanyId || (entry.companyId?._id || entry.companyId) === activeCompanyId;
    if (!matchCompany) return false;

    const entryDate = new Date(entry.purchaseDate || entry.createdAt);
    const matchMonth = filterMonth === 'All' || (entryDate.getMonth() + 1) === parseInt(filterMonth);
    const matchYear = filterYear === 'All' || entryDate.getFullYear() === parseInt(filterYear);
    return matchMonth && matchYear;
  });

  const filteredOrders = orders.filter(po => {
    const matchCompany = !activeCompanyId || (po.companyId?._id || po.companyId) === activeCompanyId;
    if (!matchCompany) return false;

    const poDate = new Date(po.createdAt);
    const matchMonth = filterMonth === 'All' || (poDate.getMonth() + 1) === parseInt(filterMonth);
    const matchYear = filterYear === 'All' || poDate.getFullYear() === parseInt(filterYear);
    return matchMonth && matchYear;
  });

  const filteredVendors = vendors.filter(ven => {
    const venDate = new Date(ven.createdAt);
    const matchMonth = filterMonth === 'All' || (venDate.getMonth() + 1) === parseInt(filterMonth);
    const matchYear = filterYear === 'All' || venDate.getFullYear() === parseInt(filterYear);
    return matchMonth && matchYear;
  });

  const downloadCSVReport = () => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (activeTab === 'entries') {
      headers = ['Voucher Number', 'Invoice Number', 'Supplier', 'PO Ref', 'Total Amount', 'Currency', 'Amount Paid', 'Amount Due', 'Payment Status', 'Voucher Date', 'Invoice Date'];
      rows = filteredEntries.map(entry => [
        entry.purchaseVoucherNumber || 'N/A',
        entry.invoiceNumber,
        entry.supplierName || entry.vendor?.name || 'N/A',
        entry.poRef?.poNumber || 'Direct Purchase',
        (entry.grandTotal || entry.totalAmount || 0).toFixed(2),
        activeCurrency,
        (entry.amountPaid || 0).toFixed(2),
        (entry.amountDue || 0).toFixed(2),
        entry.paymentStatus,
        entry.purchaseDate ? new Date(entry.purchaseDate).toLocaleDateString() : 'N/A',
        entry.invoiceDate ? new Date(entry.invoiceDate).toLocaleDateString() : 'N/A'
      ]);
      filename = `Purchase_Entries_Report_${filterMonth === 'All' ? 'All_Months' : 'Month_' + filterMonth}_${filterYear === 'All' ? 'All_Years' : filterYear}.csv`;
    } else if (activeTab === 'orders') {
      headers = ['PO Number', 'Supplier Vendor', 'GST Number', 'Total Amount', 'Currency', 'Status', 'Created At'];
      rows = filteredOrders.map(po => [
        po.poNumber,
        po.vendor?.name || 'N/A',
        po.vendor?.gstNumber || 'N/A',
        po.totalAmount.toFixed(2),
        activeCurrency,
        po.status,
        new Date(po.createdAt).toLocaleDateString()
      ]);
      filename = `Purchase_Orders_Report_${filterMonth === 'All' ? 'All_Months' : 'Month_' + filterMonth}_${filterYear === 'All' ? 'All_Years' : filterYear}.csv`;
    } else if (activeTab === 'vendors') {
      headers = ['Supplier Name', 'Payment Terms', 'Contact Person', 'Email', 'Phone', 'GSTIN', 'Invoices List'];
      rows = filteredVendors.map(ven => [
        ven.name,
        ven.paymentTerms,
        ven.contactPerson || 'N/A',
        ven.email,
        ven.phone || 'N/A',
        ven.gstNumber || 'N/A',
        getVendorInvoices(ven._id)
      ]);
      filename = `Suppliers_Registry_Report_${filterMonth === 'All' ? 'All_Months' : 'Month_' + filterMonth}_${filterYear === 'All' ? 'All_Years' : filterYear}.csv`;
    }

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Form Modals Toggles
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);

  // Document Viewer State
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [docUrl, setDocUrl] = useState('');
  const [docName, setDocName] = useState('');

  // PO Live Preview Modal State
  const [selectedPo, setSelectedPo] = useState(null);
  const [showPoPreviewModal, setShowPoPreviewModal] = useState(false);

  // Purchase Entry Specs Preview Modal State
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showEntryPreviewModal, setShowEntryPreviewModal] = useState(false);

  // Supplier Ledger Modal State
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedVendorForLedger, setSelectedVendorForLedger] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Edit states for Purchase Entries
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);

  // Edit states for Purchase Orders
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);

  // 2. Vendor Form State
  const [vendorForm, setVendorForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    paymentTerms: 'Net 30',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
  });

  // 3. Purchase Order Form State
  const [poForm, setPoForm] = useState({
    vendor: '',
    items: [{ name: '', quantity: 1, price: '', taxRate: 18 }],
    companyId: '',
    status: 'Draft',
  });

  // 4. Purchase Entry Form State
  const [entryForm, setEntryForm] = useState({
    poRef: '',
    vendor: '',
    supplierName: '',
    supplierGSTIN: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    purchaseDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    subTotal: 0,
    totalDiscount: 0,
    transportationCharges: 0,
    packingCharges: 0,
    loadingUnloadingCharges: 0,
    otherCharges: 0,
    additionalChargesTotal: 0,
    grandTotal: 0,
    paymentStatus: 'Unpaid',
    paymentMode: 'Cash',
    amountPaid: '0',
    amountDue: 0,
    paymentReferenceNumber: '',
    notes: '',
    items: [{ name: '', code: '', quantity: 1, unit: 'Pcs', price: '', discountType: 'percentage', discountValue: 0, discountAmount: 0, totalItemAmount: 0 }],
    companyId: '',
  });
  const [invoiceFile, setInvoiceFile] = useState(null);

  // Download state for PO/PV buttons
  const [downloadingPoId, setDownloadingPoId] = useState(null);
  const [downloadingPvId, setDownloadingPvId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poRes, entryRes, venRes, settingsRes] = await Promise.all([
        API.get('/purchase-orders'),
        API.get('/purchase-entries'),
        API.get('/vendors'),
        API.get('/settings'),
      ]);
      setOrders(poRes.data);
      setEntries(entryRes.data);
      setVendors(venRes.data);
      setCompanyProfiles(settingsRes.data);

      // Auto-prefills first vendor
      if (venRes.data.length > 0) {
        setPoForm(prev => ({ ...prev, vendor: venRes.data[0]._id }));
        setEntryForm(prev => ({
          ...prev,
          vendor: venRes.data[0]._id,
          supplierName: venRes.data[0].name || '',
          supplierGSTIN: venRes.data[0].gstNumber || '',
          companyId: localStorage.getItem('selectedCompanyId') || settingsRes.data[0]?._id || ''
        }));
      }
      // Auto-prefills first company setting
      if (settingsRes.data.length > 0) {
        const activeId = localStorage.getItem('selectedCompanyId') || settingsRes.data[0]._id;
        setPoForm(prev => ({ ...prev, companyId: activeId }));
        setEntryForm(prev => ({ ...prev, companyId: activeId }));
      }
    } catch (err) {
      console.error('Error fetching procurement details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (url, name) => {
    setDocUrl(url);
    setDocName(name);
    setShowDocViewer(true);
  };

  // Download PO PDF
  const downloadPO = async (poId, poNumber) => {
    try {
      setDownloadingPoId(poId);
      const res = await API.get(`/purchase-orders/${poId}/download?format=pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${poNumber || 'purchase-order'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PO download failed:', err);
      alert('Failed to download Purchase Order PDF.');
    } finally {
      setDownloadingPoId(null);
    }
  };

  // Download Purchase Voucher PDF
  const downloadVoucherPDF = async (entryId, voucherNumber) => {
    try {
      setDownloadingPvId(entryId);
      const res = await API.get(`/purchase-entries/${entryId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${voucherNumber || 'purchase-voucher'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Voucher PDF download failed:', err);
      alert('Failed to download Purchase Voucher PDF.');
    } finally {
      setDownloadingPvId(null);
    }
  };

  // Submit Vendor
  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/vendors', vendorForm);
      setVendorForm({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        gstNumber: '',
        paymentTerms: 'Net 30',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
      });
      setShowAddVendor(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating supplier.');
    }
  };

  // PO Items Helpers
  const addPoItem = () => {
    setPoForm({
      ...poForm,
      items: [...poForm.items, { name: '', quantity: 1, price: '', taxRate: 18 }]
    });
  };

  const updatePoItem = (index, field, value) => {
    const newItems = [...poForm.items];
    newItems[index][field] = value;
    setPoForm({ ...poForm, items: newItems });
  };

  const removePoItem = (index) => {
    const newItems = poForm.items.filter((_, i) => i !== index);
    setPoForm({ ...poForm, items: newItems });
  };

  // Submit PO
  const handlePOSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEditingOrder) {
        await API.put(`/purchase-orders/${editingOrderId}`, poForm);
      } else {
        await API.post('/purchase-orders', poForm);
      }
      setPoForm({
        vendor: vendors[0]?._id || '',
        items: [{ name: '', quantity: 1, price: '', taxRate: 18 }],
        companyId: localStorage.getItem('selectedCompanyId') || companyProfiles[0]?._id || '',
        status: 'Draft',
      });
      setIsEditingOrder(false);
      setEditingOrderId(null);
      setShowAddOrder(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing PO.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrder = (po) => {
    setIsEditingOrder(true);
    setEditingOrderId(po._id);
    setPoForm({
      vendor: po.vendor?._id || po.vendor || '',
      items: po.items && po.items.length > 0
        ? po.items.map(item => ({
          name: item.name || '',
          quantity: item.quantity || 1,
          price: item.price || '',
          taxRate: item.taxRate !== undefined ? item.taxRate : 18
        }))
        : [{ name: '', quantity: 1, price: '', taxRate: 18 }],
      companyId: po.companyId?._id || po.companyId || companyProfiles[0]?._id || '',
      status: po.status || 'Draft',
    });
    setShowAddOrder(true);
  };

  const handleDeleteOrder = async (poId) => {
    if (!window.confirm('Are you sure you want to delete this Purchase Order permanently?')) return;
    try {
      setLoading(true);
      await API.delete(`/purchase-orders/${poId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting Purchase Order.');
    } finally {
      setLoading(false);
    }
  };

  const closePoModal = () => {
    setShowAddOrder(false);
    setIsEditingOrder(false);
    setEditingOrderId(null);
    setPoForm({
      vendor: vendors[0]?._id || '',
      items: [{ name: '', quantity: 1, price: '', taxRate: 18 }],
      companyId: localStorage.getItem('selectedCompanyId') || companyProfiles[0]?._id || '',
    });
  };

  // Automated Inline Calculations for Purchase Entry Form
  const calculateTotals = (form) => {
    let subTotal = 0;
    let totalDiscount = 0;

    const updatedItems = form.items.map(item => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const discountVal = Number(item.discountValue || 0);

      const itemSubtotal = qty * price;
      let discAmt = 0;
      if (item.discountType === 'percentage') {
        discAmt = itemSubtotal * (discountVal / 100);
      } else {
        discAmt = discountVal;
      }

      const totalItemAmount = itemSubtotal - discAmt;

      subTotal += itemSubtotal;
      totalDiscount += discAmt;

      return {
        ...item,
        discountAmount: discAmt,
        totalItemAmount: totalItemAmount >= 0 ? totalItemAmount : 0
      };
    });

    const transportation = Number(form.transportationCharges || 0);
    const packing = Number(form.packingCharges || 0);
    const loading = Number(form.loadingUnloadingCharges || 0);
    const other = Number(form.otherCharges || 0);

    const additionalChargesTotal = transportation + packing + loading + other;
    const grandTotal = subTotal - totalDiscount + additionalChargesTotal;

    // amountPaid is always user-controlled. Auto-derive paymentStatus from amount.
    const paidNum = Math.max(0, Math.min(Number(form.amountPaid || 0), grandTotal));
    const amountDue = grandTotal - paidNum;

    let paymentStatus;
    if (grandTotal <= 0) {
      paymentStatus = form.paymentStatus || 'Unpaid';
    } else if (paidNum <= 0) {
      paymentStatus = 'Unpaid';
    } else if (paidNum >= grandTotal) {
      paymentStatus = 'Paid';
    } else {
      paymentStatus = 'Partial';
    }

    return {
      ...form,
      items: updatedItems,
      subTotal,
      totalDiscount,
      additionalChargesTotal,
      grandTotal,
      amountPaid: form.amountPaid,
      amountDue: amountDue >= 0 ? amountDue : 0,
      paymentStatus,
    };
  };

  // Entry Items Helpers
  const addEntryItem = () => {
    const updated = {
      ...entryForm,
      items: [...entryForm.items, { name: '', code: '', quantity: 1, unit: 'Pcs', price: '', discountType: 'percentage', discountValue: 0, discountAmount: 0, totalItemAmount: 0 }]
    };
    setEntryForm(calculateTotals(updated));
  };

  const updateEntryItem = (index, field, value) => {
    const newItems = [...entryForm.items];
    newItems[index][field] = value;
    const updated = { ...entryForm, items: newItems };
    setEntryForm(calculateTotals(updated));
  };

  const removeEntryItem = (index) => {
    const newItems = entryForm.items.filter((_, i) => i !== index);
    const updated = { ...entryForm, items: newItems };
    setEntryForm(calculateTotals(updated));
  };

  const handleEntryFieldChange = (field, value) => {
    let extra = {};
    if (field === 'vendor') {
      const selectedVen = vendors.find(v => v._id === value);
      if (selectedVen) {
        extra.supplierName = selectedVen.name || '';
        extra.supplierGSTIN = selectedVen.gstNumber || '';
      }
    }
    const updated = { ...entryForm, [field]: value, ...extra };
    setEntryForm(calculateTotals(updated));
  };

  const handlePoRefChange = (poId) => {
    if (!poId) {
      const reset = {
        ...entryForm,
        poRef: '',
        vendor: entryForm.vendor,
        supplierName: entryForm.supplierName,
        supplierGSTIN: entryForm.supplierGSTIN,
        subTotal: 0,
        totalDiscount: 0,
        grandTotal: 0,
        items: [{ name: '', code: '', quantity: 1, unit: 'Pcs', price: '', discountType: 'percentage', discountValue: 0, discountAmount: 0, totalItemAmount: 0 }]
      };
      setEntryForm(calculateTotals(reset));
      return;
    }

    const selectedPo = orders.find(o => o._id === poId);
    if (selectedPo) {
      const poVendorId = selectedPo.vendor?._id || selectedPo.vendor || '';
      const selectedVen = vendors.find(v => v._id === poVendorId);
      const mapped = {
        ...entryForm,
        poRef: poId,
        vendor: poVendorId,
        supplierName: selectedVen?.name || '',
        supplierGSTIN: selectedVen?.gstNumber || '',
        items: selectedPo.items.map(item => ({
          name: item.name,
          code: '',
          quantity: item.quantity,
          unit: 'Pcs',
          price: item.price,
          discountType: 'percentage',
          discountValue: 0,
          discountAmount: 0,
          totalItemAmount: item.quantity * item.price
        }))
      };
      setEntryForm(calculateTotals(mapped));
    }
  };

  // Submit Purchase Entry
  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = new FormData();
      data.append('poRef', entryForm.poRef);
      data.append('vendor', entryForm.vendor);
      data.append('supplierName', entryForm.supplierName);
      data.append('supplierGSTIN', entryForm.supplierGSTIN);
      data.append('invoiceNumber', entryForm.invoiceNumber);
      data.append('invoiceDate', entryForm.invoiceDate);
      data.append('purchaseDate', entryForm.purchaseDate);
      data.append('dueDate', entryForm.dueDate);

      data.append('subTotal', entryForm.subTotal);
      data.append('totalDiscount', entryForm.totalDiscount);
      data.append('transportationCharges', entryForm.transportationCharges);
      data.append('packingCharges', entryForm.packingCharges);
      data.append('loadingUnloadingCharges', entryForm.loadingUnloadingCharges);
      data.append('otherCharges', entryForm.otherCharges);
      data.append('additionalChargesTotal', entryForm.additionalChargesTotal);
      data.append('grandTotal', entryForm.grandTotal);

      data.append('paymentStatus', entryForm.paymentStatus);
      data.append('paymentMode', entryForm.paymentMode);
      data.append('amountPaid', entryForm.amountPaid);
      data.append('amountDue', entryForm.amountDue);
      data.append('paymentReferenceNumber', entryForm.paymentReferenceNumber);
      data.append('notes', entryForm.notes);

      data.append('items', JSON.stringify(entryForm.items));
      if (entryForm.companyId) {
        data.append('companyId', entryForm.companyId);
      }
      if (invoiceFile) {
        data.append('invoice', invoiceFile);
      }

      if (isEditingEntry) {
        await API.put(`/purchase-entries/${editingEntryId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await API.post('/purchase-entries', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setEntryForm({
        poRef: '',
        vendor: vendors[0]?._id || '',
        supplierName: vendors[0]?.name || '',
        supplierGSTIN: vendors[0]?.gstNumber || '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        purchaseDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        subTotal: 0,
        totalDiscount: 0,
        transportationCharges: 0,
        packingCharges: 0,
        loadingUnloadingCharges: 0,
        otherCharges: 0,
        additionalChargesTotal: 0,
        grandTotal: 0,
        paymentStatus: 'Unpaid',
        paymentMode: 'Cash',
        amountPaid: '0',
        amountDue: 0,
        paymentReferenceNumber: '',
        notes: '',
        items: [{ name: '', code: '', quantity: 1, unit: 'Pcs', price: '', discountType: 'percentage', discountValue: 0, discountAmount: 0, totalItemAmount: 0 }],
        companyId: localStorage.getItem('selectedCompanyId') || companyProfiles[0]?._id || '',
      });
      setInvoiceFile(null);
      setIsEditingEntry(false);
      setEditingEntryId(null);
      setShowAddEntry(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing purchase entry.');
    } finally {
      setLoading(false);
    }
  };

  // Edit entry trigger
  const handleEditEntry = (entry) => {
    setIsEditingEntry(true);
    setEditingEntryId(entry._id);
    setEntryForm({
      poRef: entry.poRef?._id || entry.poRef || '',
      vendor: entry.vendor?._id || entry.vendor || '',
      supplierName: entry.supplierName || '',
      supplierGSTIN: entry.supplierGSTIN || '',
      invoiceNumber: entry.invoiceNumber || '',
      invoiceDate: entry.invoiceDate ? new Date(entry.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      purchaseDate: entry.purchaseDate ? new Date(entry.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: entry.dueDate ? new Date(entry.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      subTotal: entry.subTotal || entry.totalAmount || 0,
      totalDiscount: entry.totalDiscount || 0,
      transportationCharges: entry.transportationCharges || 0,
      packingCharges: entry.packingCharges || 0,
      loadingUnloadingCharges: entry.loadingUnloadingCharges || 0,
      otherCharges: entry.otherCharges || 0,
      additionalChargesTotal: entry.additionalChargesTotal || 0,
      grandTotal: entry.grandTotal || entry.totalAmount || 0,
      paymentStatus: entry.paymentStatus || 'Unpaid',
      paymentMode: entry.paymentMode || 'Cash',
      amountPaid: entry.amountPaid !== undefined ? entry.amountPaid.toString() : '0',
      amountDue: entry.amountDue !== undefined ? entry.amountDue : 0,
      paymentReferenceNumber: entry.paymentReferenceNumber || '',
      notes: entry.notes || '',
      items: entry.items && entry.items.length > 0
        ? entry.items.map(item => ({
          name: item.name || '',
          code: item.code || '',
          quantity: item.quantity || 1,
          unit: item.unit || 'Pcs',
          price: item.price || '',
          discountType: item.discountType || 'percentage',
          discountValue: item.discountValue || 0,
          discountAmount: item.discountAmount || 0,
          totalItemAmount: item.totalItemAmount || 0
        }))
        : [{ name: '', code: '', quantity: 1, unit: 'Pcs', price: '', discountType: 'percentage', discountValue: 0, discountAmount: 0, totalItemAmount: 0 }],
      companyId: entry.companyId?._id || entry.companyId || companyProfiles[0]?._id || '',
    });
    setInvoiceFile(null);
    setShowAddEntry(true);
  };

  // Delete entry trigger
  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this purchase entry? This will reverse all supplier ledger and double-entry accounts journal entries.')) return;
    try {
      setLoading(true);
      await API.delete(`/purchase-entries/${entryId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete purchase entry.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Supplier Ledger Transaction Statement
  const openSupplierLedger = async (vendor) => {
    setSelectedVendorForLedger(vendor);
    setLedgerLoading(true);
    setShowLedgerModal(true);
    try {
      const res = await API.get(`/accounting/vendors/${vendor._id}/ledger`);
      setLedgerData(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load supplier audit ledger transactions statement.');
    } finally {
      setLedgerLoading(false);
    }
  };

  // Helper: List invoices of a vendor
  const getVendorInvoices = (vendorId) => {
    const matched = entries.filter(e => (e.vendor?._id || e.vendor) === vendorId);
    if (matched.length === 0) return 'No Invoices';
    return matched.map(e => `#${e.invoiceNumber}`).join(', ');
  };

  // Compute metrics dynamically
  const totalDues = filteredEntries.reduce((sum, item) => sum + (item.amountDue || 0), 0);
  const totalPOAmount = filteredOrders.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

  return (
    <div className="flex-1 bg-slate-50 p-8 text-slate-800 overflow-y-auto max-h-[calc(100vh-80px)]">

      {/* ── PROCUREMENT KPIS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Outstanding Payables</span>
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center text-red-650">
              <AlertTriangle size={16} />
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900">{currencySymbol}{totalDues.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Pending payments to vendors</p>
        </div>


        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registered Vendors</span>
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Building size={16} />
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900">{vendors.length} Vendors</h3>
          <p className="text-[11px] text-slate-500 mt-1">Registered partner profiles</p>
        </div>
      </div>

      {/* ── TAB NAVIGATION ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200 pb-4 mb-8 gap-4">
        <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1.5">
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === 'entries'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-500 hover:text-slate-805 hover:bg-white shadow-sm border border-transparent'
              }`}
          >
            <Landmark size={14} /> Purchase Entries ({filteredEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === 'vendors'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-500 hover:text-slate-805 hover:bg-white shadow-sm border border-transparent'
              }`}
          >
            <Building size={14} /> Vendors ({filteredVendors.length})
          </button>
        </div>

        {/* Action triggers */}
        <div className="flex justify-end">
          {activeTab === 'entries' && (
            <button
              onClick={() => {
                setIsEditingEntry(false);
                setEntryForm({
                  poRef: '',
                  vendor: vendors[0]?._id || '',
                  supplierName: vendors[0]?.name || '',
                  supplierGSTIN: vendors[0]?.gstNumber || '',
                  invoiceNumber: '',
                  invoiceDate: new Date().toISOString().split('T')[0],
                  purchaseDate: new Date().toISOString().split('T')[0],
                  dueDate: new Date().toISOString().split('T')[0],
                  subTotal: 0,
                  totalDiscount: 0,
                  transportationCharges: 0,
                  packingCharges: 0,
                  loadingUnloadingCharges: 0,
                  otherCharges: 0,
                  additionalChargesTotal: 0,
                  grandTotal: 0,
                  paymentStatus: 'Unpaid',
                  paymentMode: 'Cash',
                  amountPaid: '0',
                  amountDue: 0,
                  paymentReferenceNumber: '',
                  notes: '',
                  items: [{ name: '', code: '', quantity: 1, unit: 'Pcs', price: '', discountType: 'percentage', discountValue: 0, discountAmount: 0, totalItemAmount: 0 }],
                  companyId: localStorage.getItem('selectedCompanyId') || companyProfiles[0]?._id || '',
                });
                setInvoiceFile(null);
                setShowAddEntry(true);
              }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/10 hover:-translate-y-0.5"
            >
              <Plus size={14} />Purchase Entry
            </button>
          )}
          {activeTab === 'vendors' && (
            <button
              onClick={() => setShowAddVendor(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/10 hover:-translate-y-0.5"
            >
              <Plus size={14} /> Register Vendor
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-center py-16">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4 font-bold"></div>
          <p className="text-sm font-bold tracking-wide text-slate-550 mt-2">Loading procurement data...</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Reports Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Month Filter</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[140px]"
                >
                  <option value="All">All Months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year Filter</span>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[110px]"
                >
                  <option value="All">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>

            <button
              onClick={downloadCSVReport}
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-emerald-500/10 hover:-translate-y-0.5 transition-all self-end md:self-center"
            >
              <FileSpreadsheet size={14} />
              Download CSV Report
            </button>
          </div>

          {/* TAB 1: Purchase Entries */}
          {activeTab === 'entries' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Goods Received & Purchase Entries</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Physical items processed with linked corporate invoices</p>
                </div>
                <Landmark className="text-blue-600" size={18} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <th className="px-6 py-4">Voucher No & Date</th>
                      <th className="px-6 py-4">Invoice details</th>
                      <th className="px-6 py-4">Financials & Charges</th>
                      <th className="px-6 py-4">Outstanding dues</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-12 text-slate-400 font-medium">
                          No purchase entries matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map((entry) => (
                        <tr key={entry._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-extrabold text-slate-900">{entry.purchaseVoucherNumber || 'N/A'}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Date: {entry.purchaseDate ? new Date(entry.purchaseDate).toLocaleDateString('en-GB') : 'N/A'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">Invoice: #{entry.invoiceNumber}</p>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Supplier: <span className="font-extrabold text-slate-700">{entry.supplierName || entry.vendor?.name}</span> • PO: {entry.poRef?.poNumber || 'Direct Purchase'}
                            </p>
                            {entry.vendor && entry.vendor.bankName && (
                              <p className="text-[9px] text-blue-600 mt-0.5 font-medium select-text">
                                Bank: {entry.vendor.bankName} (A/c: ...{entry.vendor.accountNumber?.slice(-4) || 'N/A'})
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-extrabold text-slate-900">{currencySymbol}{(entry.grandTotal || entry.totalAmount || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Paid: <span className="font-bold text-emerald-600">{currencySymbol}{(entry.amountPaid || 0).toLocaleString()}</span> via <span className="font-semibold text-slate-700">{entry.paymentMode || 'Cash'}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Charges: {currencySymbol}{(entry.additionalChargesTotal || 0).toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-extrabold text-red-650">{currencySymbol}{(entry.amountDue || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-slate-550 mt-0.5 flex items-center gap-1.5">
                              Status:
                              <span className={`inline-flex text-[9px] font-black px-1.5 py-0.5 rounded-full ${entry.paymentStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : entry.paymentStatus === 'Partial'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {entry.paymentStatus}
                              </span>
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedEntry(entry);
                                  setShowEntryPreviewModal(true);
                                }}
                                className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm"
                              >
                                <Eye size={13} className="text-slate-450" />
                                View
                              </button>
                              <button
                                onClick={() => handleEditEntry(entry)}
                                className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry._id)}
                                className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm"
                              >
                                Delete
                              </button>
                              <button
                                disabled={downloadingPvId === entry._id}
                                onClick={() => downloadVoucherPDF(entry._id, entry.purchaseVoucherNumber)}
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-500 font-bold cursor-pointer bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:bg-slate-50"
                              >
                                {downloadingPvId === entry._id ? 'Printing...' : 'Voucher PDF'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}



          {/* TAB 3: Suppliers Registry */}
          {activeTab === 'vendors' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Registered Vendors</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Vendor profiles and billing details</p>
                </div>
                <Building className="text-emerald-600" size={16} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-400 font-medium">
                    No vendors matching the selected filters.
                  </div>
                ) : (
                  filteredVendors.map((ven) => (
                    <div
                      key={ven._id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                          <h5 className="font-bold text-xs text-slate-800 truncate pr-2">{ven.name}</h5>
                          <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 whitespace-nowrap">
                            {ven.paymentTerms}
                          </span>
                        </div>
                        <div className="space-y-2 text-[10px] text-slate-655">
                          <p><span className="font-bold text-slate-400">Contact:</span> {ven.contactPerson || 'N/A'}</p>
                          <p><span className="font-bold text-slate-400">Email:</span> {ven.email}</p>
                          {ven.phone && <p><span className="font-bold text-slate-400">Phone:</span> {ven.phone}</p>}
                          {ven.gstNumber && <p><span className="font-bold text-slate-400">GSTIN:</span> {ven.gstNumber}</p>}

                          {ven.bankName && (
                            <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 mt-2.5 space-y-0.5 text-[9px] text-slate-700 leading-normal">
                              <span className="font-extrabold text-[#002e6e] block mb-1 uppercase tracking-wider text-[8.5px]">Supplier Bank Details:</span>
                              <p><span className="font-bold text-slate-500">Holder:</span> {ven.accountHolderName || ven.contactPerson}</p>
                              <p><span className="font-bold text-slate-500">Bank:</span> {ven.bankName} | <span className="font-bold text-slate-500">A/c:</span> {ven.accountNumber}</p>
                              <p><span className="font-bold text-slate-500">IFSC:</span> {ven.ifscCode}</p>
                            </div>
                          )}

                          <p className="bg-slate-105/80 p-1.5 rounded border border-slate-200/60 mt-2 truncate"><span className="font-bold text-slate-400 block mb-0.5">Invoice Bills:</span> {getVendorInvoices(ven._id)}</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-end">
                        <button
                          onClick={() => openSupplierLedger(ven)}
                          className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 hover:text-slate-900 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                        >
                          <BookOpen size={12} className="text-blue-500" />
                          Audit Ledger
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= MODAL: ADD VENDOR ================= */}
      {showAddVendor && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleVendorSubmit}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800 animate-scale-up"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <h3 className="text-base font-bold text-slate-800">Register Supplier Vendor</h3>
              <button
                type="button"
                onClick={() => setShowAddVendor(false)}
                className="text-slate-400 hover:text-slate-750 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
                  <input
                    type="text"
                    required
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g. Amazon Web Services"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={vendorForm.contactPerson}
                    onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Jane Smith"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="billing@aws.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="+91..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">GSTIN</label>
                  <input
                    type="text"
                    value={vendorForm.gstNumber}
                    onChange={(e) => setVendorForm({ ...vendorForm, gstNumber: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="GSTIN"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Type of Payment</label>
                  <select
                    value={vendorForm.paymentTerms}
                    onChange={(e) => setVendorForm({ ...vendorForm, paymentTerms: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="COD">Cash</option>
                    <option value="Net 15">Credit/Debit Card</option>
                    <option value="Net 30">UPI</option>
                    <option value="Net 60">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Address</label>
                <input
                  type="text"
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                  className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Billing HQ Location"
                />
              </div>

              {/* Supplier Bank Details Section */}
              <div className="border-t border-slate-100 pt-4 mt-2">
                <h4 className="text-[10px] font-extrabold text-blue-650 uppercase tracking-widest mb-3">Supplier Bank Account Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Account Holder Name</label>
                    <input
                      type="text"
                      value={vendorForm.accountHolderName}
                      onChange={(e) => setVendorForm({ ...vendorForm, accountHolderName: e.target.value })}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="e.g. AWS Corp Account"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      value={vendorForm.bankName}
                      onChange={(e) => setVendorForm({ ...vendorForm, bankName: e.target.value })}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="e.g. HDFC Bank"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Account Number</label>
                    <input
                      type="text"
                      value={vendorForm.accountNumber}
                      onChange={(e) => setVendorForm({ ...vendorForm, accountNumber: e.target.value })}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="e.g. 910283478921"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">IFSC Code</label>
                    <input
                      type="text"
                      value={vendorForm.ifscCode}
                      onChange={(e) => setVendorForm({ ...vendorForm, ifscCode: e.target.value })}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="e.g. HDFC0000104"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowAddVendor(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-semibold cursor-pointer transition-all bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer shadow-lg shadow-blue-500/10 transition-colors"
              >
                Add Vendor
              </button>
            </div>
          </form>
        </div>
      )}



          <form
            onSubmit={handlePOSubmit}
            className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800 animate-scale-up"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <h3 className="text-base font-bold text-slate-800">{isEditingOrder ? 'Edit Purchase Order' : 'Draft Purchase Order (PO)'}</h3>
              <button
                type="button"
                onClick={closePoModal}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Supplier Vendor</label>
                  <select
                    required
                    value={poForm.vendor}
                    onChange={(e) => setPoForm({ ...poForm, vendor: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {vendors.map(ven => (
                      <option key={ven._id} value={ven._id}>{ven.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Order Status</label>
                  <select
                    value={poForm.status || 'Draft'}
                    onChange={(e) => setPoForm({ ...poForm, status: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Purchase Items Lists</label>
                  <button
                    type="button"
                    onClick={addPoItem}
                    className="text-xs text-blue-600 hover:text-blue-505 font-bold cursor-pointer transition-colors"
                  >
                    + Add Item Row
                  </button>
                </div>

                <div className="space-y-3">
                  {poForm.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl relative">
                      <div className="md:col-span-6">
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => updatePoItem(index, 'name', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="Item name / specs"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          step="any"
                          required
                          value={item.quantity}
                          onChange={(e) => updatePoItem(index, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="Qty"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          step="any"
                          required
                          value={item.price}
                          onChange={(e) => updatePoItem(index, 'price', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="Price"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center justify-between gap-2">
                        <input
                          type="number"
                          step="any"
                          value={item.taxRate}
                          onChange={(e) => updatePoItem(index, 'taxRate', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          placeholder="GST %"
                        />
                        {poForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePoItem(index)}
                            className="text-red-505 hover:text-red-650 font-semibold cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={closePoModal}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-semibold cursor-pointer transition-all bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer shadow-lg shadow-blue-500/10 transition-colors"
              >
                {loading ? (isEditingOrder ? 'Saving Changes...' : 'Generating official PDF...') : (isEditingOrder ? 'Save Changes' : 'Provision Purchase Order')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: ADD/EDIT PURCHASE ENTRY (VOUCHER) ================= */}
      {showAddEntry && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleEntrySubmit}
            className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden text-slate-800 animate-scale-up"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <h3 className="text-base font-bold text-slate-900">
                {isEditingEntry ? 'Edit Purchase Voucher Details' : 'Log Physical Purchase Entry Voucher'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddEntry(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-white">

              {/* SECTION A: Supplier & Company Profile */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">A. Supplier & Corporate Profiles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Select Supplier Vendor</label>
                    <select
                      required
                      value={entryForm.vendor}
                      onChange={(e) => handleEntryFieldChange('vendor', e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-slate-800 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {vendors.map(ven => (
                        <option key={ven._id} value={ven._id}>{ven.name}</option>
                      ))}
                    </select>
                  </div>



                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Supplier Name</label>
                    <input
                      type="text"
                      required
                      value={entryForm.supplierName}
                      onChange={(e) => handleEntryFieldChange('supplierName', e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      placeholder="e.g. OfficeHub Supplies"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Supplier GSTIN (Optional)</label>
                    <input
                      type="text"
                      value={entryForm.supplierGSTIN}
                      onChange={(e) => handleEntryFieldChange('supplierGSTIN', e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      placeholder="e.g. 29GGSSS1234F1Z5"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: Voucher & Reference Information */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">B. Voucher & Invoices Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Voucher Date</label>
                    <input
                      type="date"
                      required
                      value={entryForm.purchaseDate}
                      onChange={(e) => handleEntryFieldChange('purchaseDate', e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1.5">Supplier Invoice Number</label>
                    <input
                      type="text"
                      required
                      value={entryForm.invoiceNumber}
                      onChange={(e) => handleEntryFieldChange('invoiceNumber', e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      placeholder="e.g. AWS-99234"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1.5">Supplier Invoice Date</label>
                    <input
                      type="date"
                      required
                      value={entryForm.invoiceDate}
                      onChange={(e) => handleEntryFieldChange('invoiceDate', e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1.5">Payment Due Date</label>
                    <input
                      type="date"
                      required
                      value={entryForm.dueDate}
                      onChange={(e) => handleEntryFieldChange('dueDate', e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: Itemsized Details list */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">C. Purchase Items Breakdowns</h4>
                  <button
                    type="button"
                    onClick={addEntryItem}
                    className="text-xs text-blue-600 hover:text-blue-505 font-bold cursor-pointer transition-colors"
                  >
                    + Add Item Line
                  </button>
                </div>

                <div className="space-y-3">
                  {entryForm.items.map((item, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 relative">
                      <div className="grid grid-cols-1 md:grid-cols-13 gap-3" style={{gridTemplateColumns: '3fr 1.5fr 1fr 0.8fr 1.5fr 1fr'}}>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Item Name</label>
                          <input
                            type="text"
                            required
                            value={item.name}
                            onChange={(e) => updateEntryItem(index, 'name', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                            placeholder="e.g. Dell Latitude 7420 Laptop"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Item Code</label>
                          <input
                            type="text"
                            value={item.code}
                            onChange={(e) => updateEntryItem(index, 'code', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                            placeholder="CODE-X"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Qty</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={item.quantity}
                            onChange={(e) => updateEntryItem(index, 'quantity', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Unit</label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateEntryItem(index, 'unit', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                            placeholder="Pcs"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Price / Unit</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={item.price}
                            onChange={(e) => updateEntryItem(index, 'price', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Disc %</label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max="100"
                            value={item.discountValue}
                            onChange={(e) => updateEntryItem(index, 'discountValue', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center gap-4 text-[11px] text-slate-500">
                          {(item.discountAmount || 0) > 0 && (
                            <span>Net Discount: <span className="font-extrabold text-red-500">-{currencySymbol}{(item.discountAmount || 0).toLocaleString()}</span></span>
                          )}
                          <span>Total Item Amount: <span className="font-extrabold text-slate-800">{currencySymbol}{(item.totalItemAmount || 0).toLocaleString()}</span></span>
                        </div>
                        {entryForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEntryItem(index)}
                            className="text-red-500 hover:text-red-650 font-semibold cursor-pointer p-1 text-xs"
                          >
                            Remove Line
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION D: Additional Charges & Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">D. Additional Charges</h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Transportation Charges</label>
                      <input
                        type="number"
                        step="any"
                        value={entryForm.transportationCharges}
                        onChange={(e) => handleEntryFieldChange('transportationCharges', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Packing Charges</label>
                      <input
                        type="number"
                        step="any"
                        value={entryForm.packingCharges}
                        onChange={(e) => handleEntryFieldChange('packingCharges', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Loading/Unloading Charges</label>
                      <input
                        type="number"
                        step="any"
                        value={entryForm.loadingUnloadingCharges}
                        onChange={(e) => handleEntryFieldChange('loadingUnloadingCharges', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">Other Charges</label>
                      <input
                        type="number"
                        step="any"
                        value={entryForm.otherCharges}
                        onChange={(e) => handleEntryFieldChange('otherCharges', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">E. Document Bill Upload</h4>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1.5">Supplier Invoice File Upload</label>
                    <div
                      onClick={() => invoiceFileInput.current.click()}
                      className="w-full bg-white border border-dashed border-slate-300 hover:border-blue-500 rounded-xl py-4 flex items-center justify-center gap-3 cursor-pointer transition-all"
                    >
                      <FolderOpen className="text-blue-500" size={16} />
                      <span className="text-xs font-semibold text-slate-600">
                        {invoiceFile ? invoiceFile.name : (entryForm.invoiceUrl ? 'File already uploaded (Click to change)' : 'Select Invoice Attachment')}
                      </span>
                      <input
                        type="file"
                        ref={invoiceFileInput}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setInvoiceFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Remarks / Internal Audit Notes</label>
                    <textarea
                      rows="2"
                      value={entryForm.notes}
                      onChange={(e) => handleEntryFieldChange('notes', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                      placeholder="Remarks..."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION F: Payment Information */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">F. Payment Details</h4>
                  {entryForm.paymentStatus && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                      entryForm.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      entryForm.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {entryForm.paymentStatus === 'Paid' ? '✓ Fully Paid' :
                       entryForm.paymentStatus === 'Partial' ? '⚡ Partial Payment' :
                       '⏳ Unpaid'}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Amount Paid</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={entryForm.amountPaid}
                      onChange={(e) => handleEntryFieldChange('amountPaid', e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs focus:outline-none focus:border-blue-500 font-bold text-slate-800"
                      placeholder="0"
                    />
                    <p className="text-[9px] text-slate-400 mt-1">Enter amount paid — status updates automatically</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Payment Mode</label>
                    <select
                      value={entryForm.paymentMode}
                      onChange={(e) => handleEntryFieldChange('paymentMode', e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-slate-800 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Cash">Cash Handover</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI Payment</option>
                      <option value="Cheque">Bank Cheque</option>
                      <option value="Credit">Credit Outstanding</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Ref Trans / Cheque Number</label>
                    <input
                      type="text"
                      value={entryForm.paymentReferenceNumber}
                      onChange={(e) => handleEntryFieldChange('paymentReferenceNumber', e.target.value)}
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      placeholder="e.g. TXN9934242"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION G: Summary details */}
              <div className="bg-slate-950 text-slate-100 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Financial Voucher Summary</h4>
                </div>
                <div className="flex flex-wrap gap-6 text-xs text-slate-300">
                  <p>Subtotal: <span className="font-extrabold text-slate-100">{currencySymbol}{(entryForm.subTotal || 0).toLocaleString()}</span></p>
                  <p>Discount: <span className="font-extrabold text-red-400">-{currencySymbol}{(entryForm.totalDiscount || 0).toLocaleString()}</span></p>
                  <p>Charges: <span className="font-extrabold text-slate-100">+{currencySymbol}{(entryForm.additionalChargesTotal || 0).toLocaleString()}</span></p>
                  <p className="border-l border-slate-800 pl-4 text-sm font-extrabold">Grand Total: <span className="text-emerald-400">{currencySymbol}{(entryForm.grandTotal || 0).toLocaleString()}</span></p>
                  <p className="border-l border-slate-800 pl-4 text-sm font-extrabold">Dues Pending: <span className="text-red-400">{currencySymbol}{(Number(entryForm.amountDue) || 0).toLocaleString()}</span></p>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowAddEntry(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-semibold cursor-pointer transition-all bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer shadow-lg shadow-blue-500/10 transition-all"
              >
                {loading ? 'Processing ledger transactions...' : (isEditingEntry ? 'Save Changes' : 'Log Purchase Entry Voucher')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= DOCUMENT VIEWER MODAL ================= */}
      {showDocViewer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 h-[85vh] flex flex-col shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText className="text-blue-500" size={18} /> Document Preview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{docName}</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={docUrl.startsWith('data:') || docUrl.startsWith('http') ? docUrl : `http://localhost:5000${docUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="invoice"
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all"
                >
                  Download Invoice
                </a>
                <button
                  onClick={() => setShowDocViewer(false)}
                  className="text-slate-500 hover:text-slate-700 cursor-pointer px-3 py-2 rounded-xl hover:bg-slate-100 transition-all font-bold text-xs bg-white border border-slate-200"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
              {docUrl.toLowerCase().startsWith('data:application/pdf') || docUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={docUrl.startsWith('data:') || docUrl.startsWith('http') ? docUrl : `http://localhost:5000${docUrl}`}
                  className="w-full h-full border-0"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={docUrl.startsWith('data:') || docUrl.startsWith('http') ? docUrl : `http://localhost:5000${docUrl}`}
                  alt="Document Preview"
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}



        const activeCompany = selectedPo.companyId && typeof selectedPo.companyId === 'object'
          ? selectedPo.companyId
          : (companyProfiles.find(p => p._id === selectedPo.companyId) || companyProfiles[0] || {});

        const linkedEntry = entries.find(e => (e.poRef?._id || e.poRef) === selectedPo._id);

        return (
          <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
            <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowPoPreviewModal(false);
                  setSelectedPo(null);
                }}
                className="absolute top-6 right-6 text-slate-450 hover:text-slate-700 transition-colors cursor-pointer p-1.5 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>

              {/* Header info */}
              <div className="pb-6 mb-6 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">OFFICIAL PURCHASE ORDER LIVE PREVIEW</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ShoppingBag size={20} className="text-blue-500" />
                  PO Document Viewer
                </h3>
              </div>

              {/* HIGH FIDELITY PAPER PO SHEET */}
              <div className="bg-[#FAF9F5] text-black border border-slate-350 p-6 sm:p-10 shadow-2xl rounded-sm space-y-6 select-text max-w-[800px] mx-auto text-left font-sans leading-relaxed">

                {/* Corporate Branding & Meta */}
                <div className="flex flex-row justify-between items-start gap-4 pb-4 border-b border-slate-300">
                  <div className="flex items-center gap-3">
                    {activeCompany.logoSquareUrl ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={activeCompany.logoSquareUrl.startsWith('data:') || activeCompany.logoSquareUrl.startsWith('http') ? activeCompany.logoSquareUrl : `http://localhost:5000${activeCompany.logoSquareUrl}`}
                          alt="Company Logo"
                          className="w-20 h-20 object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        {activeCompany.logoUrl ? (
                          <img
                            src={activeCompany.logoUrl.startsWith('data:') || activeCompany.logoUrl.startsWith('http') ? activeCompany.logoUrl : `http://localhost:5000${activeCompany.logoUrl}`}
                            alt="Brand Logo"
                            className="h-20 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div>
                            <h2 className="text-base font-black text-[#002e6e] uppercase tracking-tight">
                              {activeCompany.companyName || 'CORPORATE PROCUREMENT'}
                            </h2>
                            <p className="text-[7.5px] font-bold text-slate-500 tracking-[0.1em] uppercase leading-none">
                              {activeCompany.gstNumber ? `GSTIN: ${activeCompany.gstNumber} | ` : ''}Official Purchase Requisition
                            </p>
                          </div>
                        )}
                      </div>
                    ) : activeCompany.logoUrl ? (
                      <img
                        src={activeCompany.logoUrl.startsWith('data:') || activeCompany.logoUrl.startsWith('http') ? activeCompany.logoUrl : `http://localhost:5000${activeCompany.logoUrl}`}
                        alt="Brand Logo"
                        className="h-20 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 bg-[#002e6e] flex items-center justify-center font-black text-white text-xs select-none">
                          {(activeCompany.companyName || 'M')[0]}
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-[#002e6e] uppercase tracking-tight">
                            {activeCompany.companyName || 'CORPORATE PROCUREMENT'}
                          </h2>
                          <p className="text-[7.5px] font-bold text-slate-500 tracking-[0.1em] uppercase leading-none">
                            {activeCompany.gstNumber ? `GSTIN: ${activeCompany.gstNumber} | ` : ''}Official Purchase Requisition
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date & PO Info (No Box) */}
                  <div className="text-[9px] font-bold text-black flex flex-col justify-center gap-1 bg-transparent select-none text-right">
                    <div>Date : {new Date(selectedPo.createdAt).toLocaleDateString('en-GB')}</div>
                    <div>PO No : {selectedPo.poNumber}</div>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-xl font-extrabold text-[#002e6e] text-center uppercase tracking-wide my-2 select-none decoration-double underline">
                  PURCHASE VOUCHER
                </h1>

                {/* Vendor & Biller Address Sheets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] border-b border-slate-300 pb-4">
                  {/* Vendor profile */}
                  <div className="space-y-1 bg-white border border-slate-200 p-3">
                    <h4 className="font-extrabold text-[#002e6e] uppercase select-none mb-1 text-[9.5px]">Vendor / Supplier Info:</h4>
                    <p><span className="text-slate-500 font-semibold select-none">Company:</span> <span className="font-bold">{selectedPo.vendor?.name || 'N/A'}</span></p>
                    <p><span className="text-slate-500 font-semibold select-none">Contact:</span> {selectedPo.vendor?.contactPerson || 'N/A'}</p>
                    <p><span className="text-slate-500 font-semibold select-none">Email:</span> {selectedPo.vendor?.email || 'N/A'}</p>
                    <p><span className="text-slate-500 font-semibold select-none">Phone:</span> {selectedPo.vendor?.phone || 'N/A'}</p>
                    <p><span className="text-slate-500 font-semibold select-none">GSTIN:</span> {selectedPo.vendor?.gstNumber || 'N/A'}</p>
                    <p><span className="text-slate-500 font-semibold select-none">Address:</span> {selectedPo.vendor?.address || 'N/A'}</p>
                    {selectedPo.vendor && selectedPo.vendor.bankName && (
                      <div className="mt-2 bg-[#FAF9F5] p-2 border border-slate-200 text-[9px] text-slate-800 space-y-0.5 select-text">
                        <p className="font-bold uppercase text-[9px] text-[#002e6e] tracking-wider mb-1 select-none">Supplier Bank Details:</p>
                        <p><span className="text-slate-500 select-none">Holder:</span> {selectedPo.vendor.accountHolderName || selectedPo.vendor.contactPerson}</p>
                        <p><span className="text-slate-500 select-none">Bank:</span> {selectedPo.vendor.bankName} | <span className="text-slate-500 select-none">A/c:</span> {selectedPo.vendor.accountNumber}</p>
                        <p><span className="text-slate-500 select-none">IFSC Code:</span> {selectedPo.vendor.ifscCode}</p>
                      </div>
                    )}
                    <p><span className="text-slate-500 font-semibold select-none">Invoice Number:</span> <span className="font-bold">{(() => {
                      const linkedEntry = entries.find(e => (e.poRef?._id || e.poRef) === selectedPo._id);
                      return linkedEntry ? linkedEntry.invoiceNumber : (selectedPo.invoiceNumber || 'N/A');
                    })()}</span></p>
                  </div>

                  {/* Corporate headquarters */}
                  <div className="space-y-1 bg-white border border-slate-200 p-3">
                    <h4 className="font-extrabold text-[#002e6e] uppercase select-none mb-1 text-[9.5px]">Deliver To (Corporate Billing):</h4>
                    <p className="font-bold">{activeCompany.companyName}</p>
                    <p className="text-slate-700 leading-normal">{activeCompany.address}</p>
                    {activeCompany.mobile && <p><span className="text-slate-500 font-semibold select-none">Mobile No:</span> {activeCompany.mobile}</p>}
                    <p><span className="text-slate-500 font-semibold select-none">Payment Terms:</span> <span className="font-bold text-slate-800">{selectedPo.vendor?.paymentTerms || 'Net 30'}</span></p>
                    <p><span className="text-slate-500 font-semibold select-none">Requisitioner:</span> Procurement Officer</p>
                  </div>
                </div>

                {/* Items breakdown table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-[10px] text-black bg-white">
                    <thead>
                      <tr className="bg-[#e8e5d3] border-b border-black text-[9px] font-bold text-black select-none">
                        <th className="border-r border-black p-2 text-center w-10">S.NO</th>
                        <th className="border-r border-black p-2 text-left">Description Specs</th>
                        <th className="border-r border-black p-2 text-center w-16">Qty</th>
                        <th className="border-r border-black p-2 text-right w-24">Unit Price</th>
                        <th className="border-r border-black p-2 text-center w-14">GST Rate</th>
                        <th className="p-2 text-right w-28">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPo.items || []).map((item, index) => {
                        const qty = item.quantity || item.qty || 1;
                        const price = item.price || 0;
                        const taxRate = item.taxRate || 18;
                        const rowTotal = qty * price;

                        return (
                          <tr key={index} className="border-b border-slate-200">
                            <td className="border-r border-black p-2 text-center">{index + 1}</td>
                            <td className="border-r border-black p-2 text-left font-medium">{item.name}</td>
                            <td className="border-r border-black p-2 text-center">{qty}</td>
                            <td className="border-r border-black p-2 text-right">{currencySymbol}{price.toLocaleString()}</td>
                            <td className="border-r border-black p-2 text-center">{taxRate}%</td>
                            <td className="p-2 text-right font-semibold">{currencySymbol}{rowTotal.toLocaleString()}</td>
                          </tr>
                        );
                      })}

                      {/* Calculations summary row block */}
                      <tr className="border-t border-black h-8 text-[9.5px]">
                        <td colSpan="3" className="border-r border-black p-2 bg-[#fcfbf9]"></td>
                        <td colSpan="2" className="border-r border-black p-2 text-right font-bold uppercase select-none">Subtotal:</td>
                        <td className="p-2 text-right font-semibold">
                          {currencySymbol}{(selectedPo.totalAmount - (selectedPo.taxAmount || 0)).toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-t border-slate-300 h-8 text-[9.5px]">
                        <td colSpan="3" className="border-r border-black p-2 bg-[#fcfbf9]"></td>
                        <td colSpan="2" className="border-r border-black p-2 text-right font-bold uppercase select-none">Tax (GST Amt):</td>
                        <td className="p-2 text-right font-semibold">
                          {currencySymbol}{(selectedPo.taxAmount || 0).toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-[#e8e5d3] font-bold border-t border-black h-8 text-black text-[10px]">
                        <td colSpan="3" className="border-r border-black p-2"></td>
                        <td colSpan="2" className="border-r border-black p-2 text-right uppercase tracking-wider select-none">Grand Total Cost:</td>
                        <td className="p-2 text-right">{currencySymbol}{selectedPo.totalAmount.toLocaleString()}</td>
                      </tr>
                      {linkedEntry && (
                        <>
                          <tr className="border-t border-black h-8 text-[9.5px]">
                            <td colSpan="3" className="border-r border-black p-2 bg-[#fcfbf9]"></td>
                            <td colSpan="2" className="border-r border-black p-2 text-right font-bold uppercase select-none text-emerald-700">Amount Paid ({linkedEntry.paymentMode || 'Cash'}):</td>
                            <td className="p-2 text-right font-semibold text-emerald-700">
                              -{currencySymbol}{(linkedEntry.amountPaid || 0).toLocaleString()}
                            </td>
                          </tr>
                          <tr className="bg-[#e8e5d3] font-bold border-t border-black h-8 text-black text-[10px]">
                            <td colSpan="3" className="border-r border-black p-2"></td>
                            <td colSpan="2" className="border-r border-black p-2 text-right uppercase tracking-wider select-none text-red-650">Outstanding Due:</td>
                            <td className="p-2 text-right text-red-650">{currencySymbol}{(linkedEntry.amountDue || 0).toLocaleString()}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Spell-out & signature */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-[9.5px] text-black pt-4 border-t border-slate-300">
                  <div className="md:col-span-7 space-y-2">
                    <div>
                      <p className="text-slate-500 font-semibold uppercase select-none">Amount in Words ({activeCurrency} Speller):</p>
                      <p className="font-extrabold text-black pr-2">{priceToWords(selectedPo.totalAmount, activeCurrency)}</p>
                    </div>
                    {activeCompany.bankName && (
                      <div className="pt-2 border-t border-slate-200/60 mt-2 space-y-0.5">
                        <p className="text-[#002e6e] font-bold uppercase select-none">Payment Bank Details:</p>
                        <p><span className="text-slate-500">A/c Holder:</span> {activeCompany.accountHolderName}</p>
                        <p><span className="text-slate-500">Bank:</span> {activeCompany.bankName} | <span className="text-slate-500">A/c No:</span> {activeCompany.accountNumber}</p>
                        <p><span className="text-slate-500">IFS Code:</span> {activeCompany.ifscCode}</p>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-5 flex flex-col justify-end space-y-1 pl-4 border-l border-slate-200">
                    <p className="text-slate-500 font-bold uppercase select-none mb-1">Corporate Authorizations</p>
                    <p className="text-[#333333]"><span className="text-slate-400 select-none">Authorized Signatory:</span> Chief Procurement Officer</p>
                    <div className="border-t border-dashed border-slate-400 mt-4 pt-1 w-32 text-center text-slate-500 italic select-none">
                      {activeCompany.companyName || 'Procurement Seal'}
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  disabled={downloadingPoId === selectedPo._id}
                  onClick={() => downloadPO(selectedPo._id, selectedPo.poNumber)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {downloadingPoId === selectedPo._id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Download size={13} />
                  )}
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    setShowPoPreviewModal(false);
                    setSelectedPo(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer transition-colors bg-white"
                >
                  Close Preview
                </button>
              </div>

            </div>
          </div>
        );
      })()
      }

      {/* ================= MODAL: PURCHASE ENTRY SPECS VIEWER ================= */}
      {showEntryPreviewModal && selectedEntry && (() => {
        const activeCompany = selectedEntry.companyId && typeof selectedEntry.companyId === 'object'
          ? selectedEntry.companyId
          : (companyProfiles.find(p => p._id === selectedEntry.companyId) || companyProfiles[0] || {});

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
            <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">

              <button
                onClick={() => {
                  setShowEntryPreviewModal(false);
                  setSelectedEntry(null);
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1.5 hover:bg-slate-105 rounded-lg"
              >
                <X size={20} />
              </button>

              <div className="pb-6 mb-6 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-emerald-650 uppercase tracking-widest">REAL-TIME PURCHASE ENTRY SPECIFICATIONS AUDITOR</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Landmark size={20} className="text-blue-500" />
                  Goods Inward Specification Auditor
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch text-slate-800">

                {/* LEFT SIDE: ASSETS SPECS AND AUDIT INFORMATION */}
                <div className="lg:col-span-6 space-y-6">

                  {/* Meta details card */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">Entry Metadata Details</h4>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-500 font-medium">Voucher Number</p>
                        <p className="font-extrabold text-blue-600 mt-0.5">{selectedEntry.purchaseVoucherNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Voucher Date</p>
                        <p className="font-extrabold text-slate-800 mt-0.5">
                          {selectedEntry.purchaseDate ? new Date(selectedEntry.purchaseDate).toLocaleDateString('en-GB') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Supplier Reference Invoice</p>
                        <p className="font-extrabold text-slate-850 mt-0.5">#{selectedEntry.invoiceNumber} ({selectedEntry.invoiceDate ? new Date(selectedEntry.invoiceDate).toLocaleDateString('en-GB') : 'N/A'})</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Company Profile</p>
                        <p className="font-extrabold text-slate-800 mt-0.5">{activeCompany.companyName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Supplier Name</p>
                        <p className="font-extrabold text-slate-800 mt-0.5">{selectedEntry.supplierName || selectedEntry.vendor?.name || 'N/A'}</p>
                      </div>
                      {selectedEntry.supplierGSTIN && (
                        <div>
                          <p className="text-slate-505 font-medium">Supplier GSTIN</p>
                          <p className="font-extrabold text-slate-800 mt-0.5">{selectedEntry.supplierGSTIN}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-slate-505 font-medium">Linked PO Reference</p>
                        <p className="font-semibold text-blue-600 mt-0.5">{selectedEntry.poRef?.poNumber || 'Direct Purchase / No PO'}</p>
                      </div>
                      <div>
                        <p className="text-slate-550 font-medium">Payment Due Date</p>
                        <p className="font-semibold text-slate-700 mt-0.5">
                          {selectedEntry.dueDate ? new Date(selectedEntry.dueDate).toLocaleDateString('en-GB') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Ledger Audit */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">Financial Allocation Audit</h4>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Total Bill Amt</p>
                        <p className="font-black text-slate-900 text-sm mt-1">{currencySymbol}{(selectedEntry.grandTotal || selectedEntry.totalAmount || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Paid amount</p>
                        <p className="font-black text-emerald-600 text-sm mt-1">{currencySymbol}{(selectedEntry.amountPaid || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Outstanding</p>
                        <p className={`font-black text-sm mt-1 ${selectedEntry.amountDue > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {currencySymbol}{(selectedEntry.amountDue || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs pt-2 text-slate-600">
                      <div className="flex justify-between">
                        <span>Payment Status:</span>
                        <span className={`inline-flex text-[9px] font-black px-2 py-0.5 rounded-full border ${selectedEntry.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedEntry.paymentStatus === 'Partial'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                          {selectedEntry.paymentStatus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Mode:</span>
                        <span className="font-bold text-slate-800">{selectedEntry.paymentMode || 'Cash'}</span>
                      </div>
                      {selectedEntry.paymentReferenceNumber && (
                        <div className="flex justify-between">
                          <span>Ref Reference Number:</span>
                          <span className="font-mono text-slate-800">{selectedEntry.paymentReferenceNumber}</span>
                        </div>
                      )}
                      {(selectedEntry.additionalChargesTotal > 0) && (
                        <div className="flex justify-between border-t border-slate-200 pt-2">
                          <span>Additional Charges total:</span>
                          <span className="font-bold text-slate-805">{currencySymbol}{(selectedEntry.additionalChargesTotal || 0).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acquired Assets Specs Breakdown */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">Acquired Assets Specifications</h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 uppercase text-[9px] font-bold tracking-wider border-b border-slate-200">
                            <th className="p-3">Asset Description</th>
                            <th className="p-3 text-center">Acquired Qty</th>
                            <th className="p-3 text-right">Acquisition Unit cost</th>
                            <th className="p-3 text-right">Net Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                          {(selectedEntry.items || []).map((item, index) => {
                            return (
                              <tr key={index} className="hover:bg-slate-55">
                                <td className="p-3 leading-tight">
                                  <p className="font-semibold text-slate-900">{item.name}</p>
                                  <p className="text-[9px] text-slate-450 font-mono mt-0.5">Code: {item.code || 'N/A'}</p>
                                </td>
                                <td className="p-3 text-center font-bold text-slate-600">
                                  {item.quantity} {item.unit || 'Pcs'}
                                </td>
                                <td className="p-3 text-right font-bold text-slate-900">
                                  <p>{currencySymbol}{(item.price || 0).toLocaleString()}</p>
                                  {item.discountValue > 0 && (
                                    <p className="text-[9px] text-red-500 font-normal">Discount: -{currencySymbol}{(item.discountAmount || 0).toLocaleString()}</p>
                                  )}
                                </td>
                                <td className="p-3 text-right font-black text-slate-950">
                                  {currencySymbol}{(item.totalItemAmount || 0).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* RIGHT SIDE: CORRESPONDING SUPPLIER INVOICE DOCUMENT PREVIEW */}
                <div className="lg:col-span-6 flex flex-col space-y-4">
                  <div className="flex items-center justify-between text-slate-800">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="text-blue-500" size={14} /> Supporting Physical Bill PDF / Image
                    </h4>
                    {selectedEntry.invoiceUrl && (
                      <a
                        href={selectedEntry.invoiceUrl.startsWith('data:') || selectedEntry.invoiceUrl.startsWith('http') ? selectedEntry.invoiceUrl : `http://localhost:5000${selectedEntry.invoiceUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-extrabold text-blue-600 hover:text-blue-500 hover:underline cursor-pointer"
                      >
                        Open Fullscreen ↗
                      </a>
                    )}
                  </div>

                  <div className="flex-1 min-h-[400px] bg-white rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative shadow-sm">
                    {selectedEntry.invoiceUrl ? (
                      selectedEntry.invoiceUrl.toLowerCase().startsWith('data:application/pdf') || selectedEntry.invoiceUrl.toLowerCase().endsWith('.pdf') ? (
                        <iframe
                          src={selectedEntry.invoiceUrl.startsWith('data:') || selectedEntry.invoiceUrl.startsWith('http') ? selectedEntry.invoiceUrl : `http://localhost:5000${selectedEntry.invoiceUrl}`}
                          className="w-full h-full border-0"
                          title="Supplier Invoice Preview"
                        />
                      ) : (
                        <img
                          src={selectedEntry.invoiceUrl.startsWith('data:') || selectedEntry.invoiceUrl.startsWith('http') ? selectedEntry.invoiceUrl : `http://localhost:5000${selectedEntry.invoiceUrl}`}
                          alt="Supplier Invoice Preview"
                          className="max-w-full max-h-full object-contain p-2"
                        />
                      )
                    ) : (
                      <div className="text-center text-xs text-slate-450 font-semibold p-6 select-none">
                        No supporting physical supplier bill document uploaded for this entry.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  disabled={downloadingPvId === selectedEntry._id}
                  onClick={() => downloadVoucherPDF(selectedEntry._id, selectedEntry.purchaseVoucherNumber)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {downloadingPvId === selectedEntry._id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Download size={13} />
                  )}
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    setShowEntryPreviewModal(false);
                    setSelectedEntry(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-750 text-xs font-semibold cursor-pointer transition-colors bg-white animate-fade-in"
                >
                  Close Specs Auditor
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ================= MODAL: SUPPLIER AUDIT LEDGER TRANSACTION STATEMENT ================= */}
      {showLedgerModal && selectedVendorForLedger && (
        <div className="fixed inset-0 bg-slate-955 /80 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">

            <button
              onClick={() => {
                setShowLedgerModal(false);
                setSelectedVendorForLedger(null);
                setLedgerData([]);
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1.5 hover:bg-slate-100 rounded-lg animate-fade-in"
            >
              <X size={20} />
            </button>

            <div className="pb-4 mb-6 border-b border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">REAL-TIME DOUBLE-ENTRY GENERAL LEDGER AUDITOR</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BookOpen size={18} className="text-blue-500" />
                Supplier Audit Ledger: {selectedVendorForLedger.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold">GSTIN: {selectedVendorForLedger.gstNumber || 'N/A'} • Address: {selectedVendorForLedger.address || 'N/A'}</p>
            </div>

            {ledgerLoading ? (
              <div className="text-slate-500 text-center py-16">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4 font-bold"></div>
                <p className="text-xs font-bold tracking-wide text-slate-500 mt-2">Reassembling supplier ledger transactions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white">
                  <table className="w-full text-left border-collapse text-xs text-slate-700">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-bold text-slate-505 border-b border-slate-205 uppercase tracking-wider">
                        <th className="p-3.5">Transaction Date</th>
                        <th className="p-3.5">Voucher Reference</th>
                        <th className="p-3.5">Description</th>
                        <th className="p-3.5 text-right">Debit (Payments Out)</th>
                        <th className="p-3.5 text-right">Credit (Purchases In)</th>
                        <th className="p-3.5 text-right bg-slate-100">Running Balance (Owed)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                      {ledgerData.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-12 text-slate-550 font-bold">
                            No ledger transactions logged yet for this vendor partner.
                          </td>
                        </tr>
                      ) : (
                        ledgerData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3.5 font-semibold text-slate-500">
                              {new Date(item.date).toLocaleDateString('en-GB')}
                            </td>
                            <td className="p-3.5 font-bold text-blue-600">{item.voucherNo}</td>
                            <td className="p-3.5 text-slate-500 font-medium">{item.notes}</td>
                            <td className="p-3.5 text-right font-extrabold text-emerald-600">
                              {item.debit > 0 ? `${currencySymbol}${item.debit.toLocaleString()}` : '—'}
                            </td>
                            <td className="p-3.5 text-right font-extrabold text-red-650">
                              {item.credit > 0 ? `${currencySymbol}${item.credit.toLocaleString()}` : '—'}
                            </td>
                            <td className="p-3.5 text-right font-black text-slate-900 bg-slate-50">
                              {currencySymbol}{item.balance.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-bold">CURRENT TOTAL OUTSTANDING LIABILITY</span>
                  <span className="text-sm font-black text-red-650">
                    {currencySymbol}{(ledgerData[ledgerData.length - 1]?.balance || 0).toLocaleString()}/-
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowLedgerModal(false);
                  setSelectedVendorForLedger(null);
                  setLedgerData([]);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close Statement
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Purchases;
