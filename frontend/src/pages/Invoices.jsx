import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  User, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  Loader2,
  Eye,
  X,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';


/** Indian Currency Number-to-Words */
function priceToWords(price) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ',
    'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ',
    'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  let num = Math.floor(price);
  if (num === 0) return 'Zero Rupees only';
  if ((num = num.toString()).length > 9) return 'Overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees ' : 'Rupees ';
  return str.trim() + ' only';
}

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadType, setDownloadType] = useState(null); // 'docx' or 'pdf'
  const [companyProfiles, setCompanyProfiles] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const [invRes, settingsRes] = await Promise.all([
        API.get('/invoices'),
        API.get('/settings')
      ]);
      setInvoices(invRes.data);
      setCompanyProfiles(settingsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const download = async (id, invoiceNumber, format) => {
    try {
      setDownloadingId(id);
      setDownloadType(format);
      const res = await API.get(`/invoices/${id}/download?format=${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      const filename = `${invoiceNumber || 'invoice'}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to generate or download the requested document format.');
    } finally {
      setDownloadingId(null);
      setDownloadType(null);
    }
  };

  // Filter States
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterYear, setFilterYear] = useState('All');

  const activeCurrency = companyProfiles[0]?.currency || 'INR';
  const currencySymbol = activeCurrency === 'USD' ? '$' : '₹';

  const filteredInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.invoiceDate || inv.date || inv.createdAt);
    const matchSearch = 
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.customerCompany && inv.customerCompany.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchMonth = filterMonth === 'All' || (invDate.getMonth() + 1) === parseInt(filterMonth);
    const matchYear = filterYear === 'All' || invDate.getFullYear() === parseInt(filterYear);
    
    return matchSearch && matchMonth && matchYear;
  });

  const downloadCSVReport = () => {
    const headers = ['Invoice Number', 'Date', 'Customer Name', 'Customer Email', 'Customer Company', 'Subtotal', 'Tax Amount', 'Total Amount', 'Currency', 'Amount Paid', 'Amount Due', 'Payment Status'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      new Date(inv.invoiceDate || inv.date || inv.createdAt).toLocaleDateString(),
      inv.customerName,
      inv.customerEmail,
      inv.customerCompany || '',
      (inv.totalAmount - inv.taxAmount).toFixed(2),
      inv.taxAmount.toFixed(2),
      inv.totalAmount.toFixed(2),
      activeCurrency,
      inv.amountPaid.toFixed(2),
      inv.amountDue.toFixed(2),
      inv.paymentStatus
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Invoices_Report_${filterMonth === 'All' ? 'All_Months' : 'Month_' + filterMonth}_${filterYear === 'All' ? 'All_Years' : filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 bg-slate-50 p-8 text-slate-800 overflow-y-auto max-h-[calc(100vh-80px)] select-none">
      
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-200 pb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search Input Bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute left-3.5 top-3 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by invoice #, client or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Month & Year Selection dropdowns */}
          <div className="flex items-center gap-3">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-white border border-slate-200 text-xs rounded-xl px-3 py-2.5 text-slate-850 focus:outline-none focus:border-blue-500 cursor-pointer min-w-36 shadow-sm"
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

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-white border border-slate-200 text-xs rounded-xl px-3 py-2.5 text-slate-855 focus:outline-none focus:border-blue-500 cursor-pointer min-w-28 shadow-sm"
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
          className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-emerald-500/10 hover:-translate-y-0.5 transition-all w-full md:w-auto animate-duration-200"
        >
          <FileSpreadsheet size={14} />
          Download CSV Report
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Main Content Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-semibold tracking-wide">Compiling document pipeline records...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="px-6 py-4">Invoice details</th>
                  <th className="px-6 py-4">Client Contact</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status & Dues</th>
                  <th className="px-6 py-4 text-right">Download Formats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-16 text-slate-500 font-medium">
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const isDownloading = downloadingId === inv._id;
                    return (
                      <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors duration-250">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 tracking-tight">{inv.invoiceNumber}</p>
                              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                <Calendar size={12} className="text-slate-400" />
                                Issued: {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : new Date(inv.date || inv.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 text-xs">
                              {inv.customerName ? inv.customerName.charAt(0) : (inv.client ? inv.client.charAt(0) : 'C')}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{inv.customerName || inv.client}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {inv.customerEmail || 'no-email@domain.com'} {inv.customerCompany && `• ${inv.customerCompany}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-slate-800 tracking-wide">
                            {currencySymbol}{(inv.totalAmount || inv.total || 0).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            GST (18% included)
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full border ${
                            inv.paymentStatus === 'Paid' 
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                              : inv.paymentStatus === 'Partial' 
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                              : 'bg-red-500/10 text-red-600 border-red-500/20'
                          }`}>
                            {inv.paymentStatus === 'Paid' ? <CheckCircle size={10} /> : <Clock size={10} />}
                            {inv.paymentStatus || 'Pending'}
                          </span>
                          {inv.amountDue > 0 && (
                            <p className="text-[10px] text-slate-500 mt-1">
                              Due: <span className="text-red-500 font-semibold">{currencySymbol}{inv.amountDue.toLocaleString()}</span>
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* In-browser dynamic Preview Button */}
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setSelectedCompanyId(companyProfiles[0]?._id || '');
                                setShowPreviewModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer"
                            >
                              <Eye size={13} className="text-slate-500" />
                              View
                            </button>

                            {/* Word Document Download Button */}
                            <button
                              disabled={isDownloading}
                              onClick={() => download(inv._id, inv.invoiceNumber, 'docx')}
                              className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-100 text-blue-600 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isDownloading && downloadType === 'docx' ? (
                                <Loader2 size={12} className="animate-spin text-blue-600" />
                              ) : (
                                <FileText size={13} className="text-blue-600" />
                              )}
                              Word (.docx)
                            </button>

                            {/* PDF Document Download Button */}
                            <button
                              disabled={isDownloading}
                              onClick={() => download(inv._id, inv.invoiceNumber, 'pdf')}
                              className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100/80 border border-red-100 text-red-600 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isDownloading && downloadType === 'pdf' ? (
                                <Loader2 size={12} className="animate-spin text-red-600" />
                              ) : (
                                <FileText size={13} className="text-red-600" />
                              )}
                              PDF (.pdf)
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: IN-BROWSER TAX INVOICE LIVE VIEWER ================= */}
      {showPreviewModal && selectedInvoice && (() => {
        // Resolve active company biller profile from the invoice's saved company details
        const activeBiller = (selectedInvoice.companyId && typeof selectedInvoice.companyId === 'object' && selectedInvoice.companyId.companyName)
          ? selectedInvoice.companyId
          : companyProfiles.find(c => c._id === selectedCompanyId) || companyProfiles[0] || {
            companyName: 'SYSTEM DEFAULT BILLER',
            gstNumber: 'N/A',
            companyEmail: 'billing@biller.com',
            companyPhone: 'N/A',
            companyAddress: 'Registered Business Address',
            bankName: 'N/A',
            bankAccountNumber: 'N/A',
            ifscCode: 'N/A'
          };

        // Self-heal and normalize line items: support both SaleInvoice and standard Invoice
        const itemsList = (selectedInvoice.items || []).map((item) => {
          const name = item.name || item.description || 'Line Item';
          const qty = item.quantity || 1;
          const price = item.price || item.unitPrice || 0;
          const discount = item.discount || 0;
          const taxRate = item.taxRate !== undefined ? item.taxRate : 18;
          
          const subtotal = (qty * price) - discount;
          const taxAmount = subtotal * (taxRate / 100);
          const total = subtotal + taxAmount;

          return { name, qty, price, discount, taxRate, subtotal, taxAmount, total };
        });

        const totalAmountVal = Number(selectedInvoice.totalAmount || selectedInvoice.total || itemsList.reduce((acc, item) => acc + item.total, 0)) || 0;
        const taxAmountVal   = Number(selectedInvoice.taxAmount)   || (totalAmountVal * 18 / 118);
        const cgstVal        = taxAmountVal / 2;
        const sgstVal        = taxAmountVal / 2;
        const baseAmountVal  = totalAmountVal - taxAmountVal;
        const totalQuantity  = (selectedInvoice.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

        return (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
            <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">
              
              {/* Close Button top corner */}
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedInvoice(null);
                }}
                className="absolute top-6 right-6 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer p-1.5 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>

              {/* Title & Biller Header (Selector Removed) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">In-Browser PDF Document Live Preview</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <FileText size={20} className="text-blue-500" />
                    Tax Invoice Preview
                  </h3>
                </div>
              </div>

              {/* HIGH FIDELITY PAPER SHEET (MATCHES PDF EXACTLY) */}
              <div className="bg-[#FAF9F5] text-black border border-slate-350 p-6 sm:p-12 shadow-2xl rounded-sm space-y-6 select-text max-w-[800px] mx-auto text-left font-sans leading-relaxed">
                
                {/* Meta details & branding header */}
                <div className="flex flex-row justify-between items-start gap-4 pb-4">
                  {/* Company Logo or Fallback vector branding */}
                  <div>
                    {activeBiller.logoSquareUrl ? (
                      <div className="flex items-center gap-3">
                        <img 
                          src={activeBiller.logoSquareUrl.startsWith('http') ? activeBiller.logoSquareUrl : `http://localhost:5000${activeBiller.logoSquareUrl}`} 
                          alt="Company Logo" 
                          className="w-10 h-10 object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        {activeBiller.logoUrl ? (
                          <img 
                            src={activeBiller.logoUrl.startsWith('http') ? activeBiller.logoUrl : `http://localhost:5000${activeBiller.logoUrl}`} 
                            alt="Brand Logo" 
                            className="h-10 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <h2 className="text-sm font-bold text-[#002e6e]">{activeBiller.companyName}</h2>
                        )}
                      </div>
                    ) : activeBiller.logoUrl ? (
                      <img 
                        src={activeBiller.logoUrl.startsWith('http') ? activeBiller.logoUrl : `http://localhost:5000${activeBiller.logoUrl}`} 
                        alt="Brand Logo" 
                        className="h-10 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      /* Exact Vector Fallback matched to drawVectorLogo */
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 bg-[#002e6e] flex items-center justify-center">
                          <div className="absolute top-1.5 w-2 h-2 bg-[#2fa64f] rounded-full"></div>
                          <div className="absolute bottom-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white"></div>
                          <div className="absolute bottom-1 w-1.5 h-2.5 bg-[#2fa64f]"></div>
                        </div>
                        <div>
                          <h2 className="text-[17px] font-black text-[#002e6e] leading-none select-none tracking-tight">{activeBiller.companyName.toUpperCase()}</h2>
                          <div className="h-[1.5px] bg-[#002e6e] mt-1.5 w-32"></div>
                          <div className="h-[1.5px] bg-[#2fa64f] mt-[1px] w-32"></div>
                          <p className="text-[8px] font-black text-[#2fa64f] tracking-[0.25em] mt-1 text-center w-32 uppercase leading-none">i n f o t e c h</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date & Invoice Rectangular Box */}
                  <div className="border border-black px-3.5 py-2 w-44 text-[10px] font-bold text-black flex flex-col justify-center divide-y divide-black gap-1.5 bg-white select-none">
                    <div className="pb-1">Date : {new Date(selectedInvoice.invoiceDate || selectedInvoice.date || selectedInvoice.createdAt).toLocaleDateString('en-GB')}</div>
                    <div className="pt-1">Invoice No : {selectedInvoice.invoiceNumber || 'N/A'}</div>
                  </div>
                </div>

                {/* Big centered title */}
                <h1 className="text-2xl font-black text-[#00b4d8] text-center uppercase tracking-wider my-4 select-none">
                  INVOICE
                </h1>

                {/* FROM / BILL TO boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] text-black">
                  {/* FROM section */}
                  <div className="border border-[#cccccc] rounded-none overflow-hidden flex flex-col bg-white">
                    <div className="bg-[#e8e5d3] border-b border-[#cccccc] px-3 py-1 text-[9px] font-bold text-black uppercase select-none">
                      FROM
                    </div>
                    <div className="p-3 leading-relaxed space-y-1">
                      <p className="font-bold text-[10.5px] text-black uppercase">{activeBiller.companyName}</p>
                      <p className="text-[#333333] whitespace-pre-line">{activeBiller.companyAddress || activeBiller.address || 'Address N/A'}</p>
                      <p className="text-[#333333]">Mobile No : {activeBiller.companyPhone || activeBiller.mobile || 'N/A'}</p>
                      <p className="text-[#333333]">GST No : {activeBiller.gstNumber || 'N/A'}</p>
                    </div>
                  </div>

                  {/* BILL TO section */}
                  <div className="border border-[#cccccc] rounded-none overflow-hidden flex flex-col bg-white">
                    <div className="bg-[#e8e5d3] border-b border-[#cccccc] px-3 py-1 text-[9px] font-bold text-black uppercase select-none">
                      BILL TO
                    </div>
                    <div className="p-3 leading-relaxed space-y-1">
                      <p className="font-bold text-[10.5px] text-black uppercase">{selectedInvoice.customerName || selectedInvoice.client || 'N/A'}</p>
                      <p className="text-[#333333] whitespace-pre-line">{selectedInvoice.customerAddress || 'N/A'}</p>
                      <p className="text-[#333333]">GST NO : {selectedInvoice.customerGst || 'N/A'}</p>
                      <p className="text-[#333333]">Phone No : {selectedInvoice.customerPhone || selectedInvoice.phone || 'N/A'}</p>
                      <p className="text-[#333333]">Mobile No : {selectedInvoice.customerPhone || selectedInvoice.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Main Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-[10px] text-black bg-white">
                    <thead>
                      <tr className="bg-[#e8e5d3] border-b border-black text-[9px] font-bold text-black select-none">
                        <th className="border-r border-black p-2 text-center w-12">S NO</th>
                        <th className="border-r border-black p-2 text-left">Description of Services</th>
                        <th className="border-r border-black p-2 text-center w-24">HSN Code</th>
                        <th className="border-r border-black p-2 text-center w-24">Quantity</th>
                        <th className="p-2 text-right w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {itemsList.map((item, idx) => {
                        const itemBaseAmount = item.qty * item.price;
                        return (
                          <tr key={idx} className="h-7">
                            <td className="border-r border-black p-2 text-center">{idx + 1}</td>
                            <td className="border-r border-black p-2 text-left">{item.name}</td>
                            <td className="border-r border-black p-2 text-center">{activeBiller.defaultHsnCode || 'N/A'}</td>
                            <td className="border-r border-black p-2 text-center">{item.qty} Months</td>
                            <td className="p-2 text-right">{itemBaseAmount.toLocaleString()}/-</td>
                          </tr>
                        );
                      })}
                      {/* CGST Row */}
                      <tr className="h-7 font-bold text-black">
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2 text-left">CGST (9%)</td>
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2"></td>
                        <td className="p-2 text-right">{cgstVal.toLocaleString()}/-</td>
                      </tr>
                      {/* SGST Row */}
                      <tr className="h-7 font-bold text-black">
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2 text-left">SGST (9%)</td>
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2"></td>
                        <td className="p-2 text-right">{sgstVal.toLocaleString()}/-</td>
                      </tr>
                      {/* Total Row */}
                      <tr className="bg-[#e8e5d3] font-bold border-t border-black h-7 text-black">
                        <td className="border-r border-black p-2 text-left">Total:</td>
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2 text-center">{totalQuantity} Months</td>
                        <td className="p-2 text-right">{totalAmountVal.toLocaleString()}/-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* GST Tax Summary Table */}
                <div className="space-y-1">
                  <p className="text-[9.5px] font-bold text-black select-none">GST Tax Summary</p>
                  <table className="w-full border-collapse border border-black text-[9px] text-black bg-white">
                    <thead>
                      <tr className="bg-[#e8e5d3] border-b border-black font-bold text-black select-none">
                        <th className="border-r border-black p-1.5 text-center w-20">HSN</th>
                        <th className="border-r border-black p-1.5 text-right">Amount</th>
                        <th className="border-r border-black p-1.5 text-right">CGST (9%)</th>
                        <th className="border-r border-black p-1.5 text-right">SGST (9%)</th>
                        <th className="p-1.5 text-right">Total Tax Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      <tr className="h-6">
                        <td className="border-r border-black p-1.5 text-center">{activeBiller.defaultHsnCode || 'N/A'}</td>
                        <td className="border-r border-black p-1.5 text-right">{baseAmountVal.toLocaleString()}/-</td>
                        <td className="border-r border-black p-1.5 text-right">{cgstVal.toLocaleString()}/-</td>
                        <td className="border-r border-black p-1.5 text-right">{sgstVal.toLocaleString()}/-</td>
                        <td className="p-1.5 text-right">{taxAmountVal.toLocaleString()}/-</td>
                      </tr>
                      <tr className="bg-[#e8e5d3] font-bold h-6 text-black">
                        <td className="border-r border-black p-1.5 text-center">Total</td>
                        <td className="border-r border-black p-1.5 text-right">{baseAmountVal.toLocaleString()}/-</td>
                        <td className="border-r border-black p-1.5 text-right">{cgstVal.toLocaleString()}/-</td>
                        <td className="border-r border-black p-1.5 text-right">{sgstVal.toLocaleString()}/-</td>
                        <td className="p-1.5 text-right">{taxAmountVal.toLocaleString()}/-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Amount in words & Bank details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-[10px] text-black pt-4 border-t border-slate-200">
                  {/* Amount in words (Left - 7 cols) */}
                  <div className="md:col-span-6 space-y-1">
                    <p className="text-slate-500 font-medium select-none">Total Amount (in words):</p>
                    <p className="font-bold text-black pr-4">{priceToWords(totalAmountVal)}</p>
                  </div>
                  
                  {/* Banking Details (Right - 5 cols) */}
                  <div className="md:col-span-6 space-y-1">
                    <h5 className="font-bold text-black uppercase tracking-wide select-none">Company's Bank Details</h5>
                    <div className="pl-2 space-y-0.5 text-slate-800">
                      <p><span className="text-slate-500 select-none">A/c Holder's Name :</span> <span className="font-bold text-black">{activeBiller.accountHolderName || 'N/A'}</span></p>
                      <p><span className="text-slate-500 select-none">Bank Name :</span> <span className="font-semibold text-black">{activeBiller.bankName || 'N/A'}</span></p>
                      <p><span className="text-slate-500 select-none">Account No :</span> <span className="font-bold text-black tracking-wider">{activeBiller.bankAccountNumber || activeBiller.accountNumber || 'N/A'}</span></p>
                      <p><span className="text-slate-500 select-none">Branch & IFS Code :</span> <span className="font-bold text-black">{activeBiller.ifscCode || 'N/A'}</span></p>
                    </div>
                  </div>
                </div>

                {/* Note section */}
                <div className="border border-black rounded-none overflow-hidden bg-white">
                  <div className="bg-[#e8e5d3] border-b border-black text-center py-1 text-[9px] font-bold text-black select-none">
                    Note
                  </div>
                  <p className="text-[9px] text-[#333333] italic text-center py-2 px-4 whitespace-pre-line leading-relaxed">
                    {activeBiller.noteText || 'Thank you for your business!'}
                  </p>
                </div>

              </div>

              {/* Action buttons footer */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close Preview
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Invoices;
