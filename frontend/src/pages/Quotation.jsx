import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  Edit,
  Trash,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  X,
  Download,
  Phone,
  Mail,
  MapPin,
  Trash2
} from 'lucide-react';

const INITIAL_QUOTATIONS = [
  {
    id: 'Q-2024-0056',
    vendor: 'Tech Solutions Pvt. Ltd.',
    clientName: 'Amit Verma',
    clientPhone: '+91-987-654-3210',
    clientEmail: 'amit.verma@techsolutions.com',
    clientAddress: '404, Tech Park, Phase-1, Guntur-522002',
    date: '2024-05-20',
    validUntil: '2024-05-30',
    items: [
      { service: 'Web Application Development & SEO setup', quantity: 1, rate: 30000 },
      { service: 'Cloud Server Configuration & Deployment', quantity: 1, rate: 15000 }
    ],
    amount: 45000,
    status: 'Sent'
  },
  {
    id: 'Q-2024-0055',
    vendor: 'Creative Minds',
    clientName: 'Sanjay Kumar',
    clientPhone: '+91-987-001-2345',
    clientEmail: 'sanjay@creativeminds.in',
    clientAddress: 'Vaarahi Enclave, 2nd Floor, Brodipet, Guntur-2',
    date: '2024-05-18',
    validUntil: '2024-05-28',
    items: [
      { service: 'Brand Logo Design & Corporate Identity', quantity: 1, rate: 12500 },
      { service: 'Responsive landing Page Design', quantity: 1, rate: 10000 }
    ],
    amount: 22500,
    status: 'Pending'
  },
  {
    id: 'Q-2024-0054',
    vendor: 'Office Needs Co.',
    clientName: 'Priya Reddy',
    clientPhone: '+91-988-555-1234',
    clientEmail: 'priya@officeneeds.com',
    clientAddress: '123, Business Park, 3rd Floor, MG Road, Guntur-522001',
    date: '2024-05-16',
    validUntil: '2024-05-26',
    items: [
      { service: 'Office Stationary Packs', quantity: 5, rate: 1550 },
      { service: 'Ergonomic Executive Office Chairs', quantity: 2, rate: 2500 }
    ],
    amount: 12750,
    status: 'Sent'
  },
  {
    id: 'Q-2024-0053',
    vendor: 'Prime Suppliers',
    clientName: 'Anil Gupta',
    clientPhone: '+91-995-111-9999',
    clientEmail: 'anil@primesuppliers.co.in',
    clientAddress: 'Subhash Road, Kothapet, Guntur-522001',
    date: '2024-05-15',
    validUntil: '2024-05-25',
    items: [
      { service: 'Enterprise Dedicated Server Rack Hosting (1 Year)', quantity: 1, rate: 78900 }
    ],
    amount: 78900,
    status: 'Accepted'
  },
  {
    id: 'Q-2024-0052',
    vendor: 'Global Traders',
    clientName: 'Vikram Singh',
    clientPhone: '+91-912-345-6789',
    clientEmail: 'vikram.singh@globaltraders.com',
    clientAddress: 'Plot 89, Port Road, Guntur-522015',
    date: '2024-05-13',
    validUntil: '2024-05-23',
    items: [
      { service: 'Logistics Distribution & Bulk Freight Shipping Services', quantity: 1, rate: 33600 }
    ],
    amount: 33600,
    status: 'Rejected'
  },
  {
    id: 'Q-2024-0051',
    vendor: 'IT Hub Solutions',
    clientName: 'Rajesh Naidu',
    clientPhone: '+91-984-802-2334',
    clientEmail: 'rajesh@ithubsolutions.net',
    clientAddress: 'Ring Road Junction, Guntur-522006',
    date: '2024-05-10',
    validUntil: '2024-05-20',
    items: [
      { service: 'Managed Firewall & Network Router Configurations', quantity: 2, rate: 28000 }
    ],
    amount: 56000,
    status: 'Accepted'
  },
  {
    id: 'Q-2024-0050',
    vendor: 'Stationery World',
    clientName: 'Kalyan Chakravarthy',
    clientPhone: '+91-900-333-8888',
    clientEmail: 'kalyan@stationeryworld.co',
    clientAddress: 'Bazar Street, Brodipet, Guntur-522002',
    date: '2024-05-08',
    validUntil: '2024-05-18',
    items: [
      { service: 'Premium Quality GSM 80 A4 Printer Paper Reams', quantity: 10, rate: 645 }
    ],
    amount: 6450,
    status: 'Sent'
  },
  {
    id: 'Q-2024-0049',
    vendor: 'Build Right Pvt. Ltd.',
    clientName: 'Ramesh Babu',
    clientPhone: '+91-944-012-3456',
    clientEmail: 'ramesh@buildright.com',
    clientAddress: 'Amaravathi Road, Gorantla, Guntur-522034',
    date: '2024-05-06',
    validUntil: '2024-05-16',
    items: [
      { service: 'Office Renovation & Modular Desk Cabin Partitions', quantity: 1, rate: 125000 }
    ],
    amount: 125000,
    status: 'Pending'
  },
  {
    id: 'Q-2024-0048',
    vendor: 'Digital Point',
    clientName: 'Suresh Kumar',
    clientPhone: '+91-986-666-7777',
    clientEmail: 'suresh@digitalpoint.in',
    clientAddress: 'Beside HDFC Bank, Kothapet, Guntur-522001',
    date: '2024-05-04',
    validUntil: '2024-05-14',
    items: [
      { service: 'Targeted PPC Ads Leads Campaign Setup & Copywriting', quantity: 1, rate: 18700 }
    ],
    amount: 18700,
    status: 'Accepted'
  },
  {
    id: 'Q-2024-0047',
    vendor: 'Green Energy Co.',
    clientName: 'Nageswara Rao',
    clientPhone: '+91-950-222-1111',
    clientEmail: 'nageswararao@greenenergy.org',
    clientAddress: 'Tenali Road, Guntur-522020',
    date: '2024-05-02',
    validUntil: '2024-05-12',
    items: [
      { service: 'Industrial Solar Plant Mechanical Design & Consulting', quantity: 1, rate: 64300 }
    ],
    amount: 64300,
    status: 'Rejected'
  },
  
  // Extra 14 entries to total 24 entries and match exact card values
  {
    id: 'Q-2024-0046',
    vendor: 'Apex Industries',
    clientName: 'J. Srinivas',
    clientPhone: '+91-998-998-1122',
    clientEmail: 'srinivas@apexind.com',
    clientAddress: 'Auto Nagar Phase-3, Guntur-522007',
    date: '2024-04-30',
    validUntil: '2024-05-10',
    items: [{ service: 'Fabricated Steel Structures Design Consult', quantity: 1, rate: 89000 }],
    amount: 89000,
    status: 'Accepted'
  },
  {
    id: 'Q-2024-0045',
    vendor: 'Orion Systems',
    clientName: 'Venkat Rao',
    clientPhone: '+91-987-123-0987',
    clientEmail: 'venkat@orionsys.com',
    clientAddress: 'L.B. Nagar, Guntur-522004',
    date: '2024-04-28',
    validUntil: '2024-05-08',
    items: [{ service: 'IT Infrastructure Networking Audit Service', quantity: 1, rate: 15000 }],
    amount: 15000,
    status: 'Sent'
  },
  {
    id: 'Q-2024-0044',
    vendor: 'Zenith Enterprises',
    clientName: 'M. Krishna',
    clientPhone: '+91-990-880-7700',
    clientEmail: 'krishna@zenithent.in',
    clientAddress: 'Arundelpet 4th Line, Guntur-522002',
    date: '2024-04-25',
    validUntil: '2024-05-05',
    items: [{ service: 'Consultancy Service: ISO Audit Prep', quantity: 1, rate: 43000 }],
    amount: 43000,
    status: 'Pending'
  },
  {
    id: 'Q-2024-0043',
    vendor: 'Horizon Traders',
    clientName: 'Satish Kumar',
    clientPhone: '+91-917-771-2233',
    clientEmail: 'satish@horizontraders.com',
    clientAddress: 'Pattabhipuram Main Road, Guntur-522006',
    date: '2024-04-22',
    validUntil: '2024-05-02',
    items: [{ service: 'Bulk Office Electronics Equipment supply', quantity: 1, rate: 67000 }],
    amount: 67000,
    status: 'Sent'
  },
  {
    id: 'Q-2024-0042',
    vendor: 'Vertex Solutions',
    clientName: 'Ch. Prasad',
    clientPhone: '+91-944-123-5566',
    clientEmail: 'prasad@vertexsol.co',
    clientAddress: 'Syndicate Bank Colony, Guntur-522007',
    date: '2024-04-20',
    validUntil: '2024-04-30',
    items: [{ service: 'CRM Custom Dashboard Software Modules', quantity: 1, rate: 31500 }],
    amount: 31500,
    status: 'Accepted'
  },
  {
    id: 'Q-2024-0041',
    vendor: 'Alpha & Omega Co.',
    clientName: 'A. Subba Rao',
    clientPhone: '+91-984-909-8877',
    clientEmail: 'subbarao@alphaomega.com',
    clientAddress: 'G.T. Road, Kothapet, Guntur-522001',
    date: '2024-04-18',
    validUntil: '2024-04-28',
    items: [{ service: 'Business Accounting Integration & Support', quantity: 1, rate: 98000 }],
    amount: 98000,
    status: 'Accepted'
  },
  {
    id: 'Q-2024-0040',
    vendor: 'Matrix Corp',
    clientName: 'Srinivas Reddy',
    clientPhone: '+91-998-505-4321',
    clientEmail: 'srinivas@matrixcorp.net',
    clientAddress: 'Syama Prasad Nagar, Guntur-522006',
    date: '2024-04-15',
    validUntil: '2024-04-25',
    items: [{ service: 'Database migration & cloud integration', quantity: 1, rate: 54200 }],
    amount: 54200,
    status: 'Pending'
  },
  {
    id: 'Q-2024-0039',
    vendor: 'Quantum Logistics',
    clientName: 'Md. Ali',
    clientPhone: '+91-901-020-3040',
    clientEmail: 'ali@quantumlog.com',
    clientAddress: 'Vidya Nagar 1st Lane, Guntur-522007',
    date: '2024-04-12',
    validUntil: '2024-04-22',
    items: [{ service: 'Supply Chain Optimization Consultation Package', quantity: 1, rate: 120000 }],
    amount: 120000,
    status: 'Sent'
  },
  {
    id: 'Q-2024-0038',
    vendor: 'Genesis Tech',
    clientName: 'T. Harish',
    clientPhone: '+91-995-995-1234',
    clientEmail: 'harish@genesistech.org',
    clientAddress: 'Koritepadu, Guntur-522007',
    date: '2024-04-10',
    validUntil: '2024-04-20',
    items: [{ service: 'Software Quality Testing Services & Auditing', quantity: 1, rate: 25400 }],
    amount: 25400,
    status: 'Sent'
  },
  {
    id: 'Q-2024-0037',
    vendor: 'Phoenix Co.',
    clientName: 'D. Anil Kumar',
    clientPhone: '+91-988-512-3450',
    clientEmail: 'anil@phoenixco.com',
    clientAddress: 'Lakshmipuram 5th line, Guntur-522007',
    date: '2024-04-08',
    validUntil: '2024-04-18',
    items: [{ service: 'Brand PR & Digital Outreach Campaign (1 Month)', quantity: 1, rate: 75000 }],
    amount: 75000,
    status: 'Pending'
  },
  {
    id: 'Q-2024-0036',
    vendor: 'Delta Partners',
    clientName: 'K. Srinivasa Rao',
    clientPhone: '+91-944-044-8899',
    clientEmail: 'ksrao@deltapartners.co',
    clientAddress: 'Chandramouli Nagar, Guntur-522007',
    date: '2024-04-05',
    validUntil: '2024-04-15',
    items: [{ service: 'Tax Audit Structuring Services', quantity: 1, rate: 19200 }],
    amount: 19200,
    status: 'Sent'
  },
  {
    id: 'Q-2024-0035',
    vendor: 'Echo Dynamics',
    clientName: 'G. Madhav',
    clientPhone: '+91-984-888-9990',
    clientEmail: 'madhav@echodynamics.com',
    clientAddress: 'Nallapadu Road, Guntur-522005',
    date: '2024-04-02',
    validUntil: '2024-04-12',
    items: [{ service: 'Dynamic Content Marketing Services', quantity: 1, rate: 38500 }],
    amount: 38500,
    status: 'Pending'
  },
  {
    id: 'Q-2024-0034',
    vendor: 'Sigma Solutions',
    clientName: 'P. Venu Gopal',
    clientPhone: '+91-996-333-2211',
    clientEmail: 'venu@sigmasol.com',
    clientAddress: 'Nagarjuna Nagar, Guntur-522510',
    date: '2024-03-30',
    validUntil: '2024-04-09',
    items: [{ service: 'Corporate Cybersecurity Risk Audits', quantity: 1, rate: 51000 }],
    amount: 51000,
    status: 'Sent'
  },
  {
    id: 'Q-2024-0033',
    vendor: 'Infinity Web',
    clientName: 'B. R. Naidu',
    clientPhone: '+91-988-500-1122',
    clientEmail: 'brnaidu@infinityweb.in',
    clientAddress: 'Guntur Vary Road, Pedakakani, Guntur-522509',
    date: '2024-03-28',
    validUntil: '2024-04-07',
    items: [{ service: 'E-commerce Custom Portal & Payments Setup', quantity: 1, rate: 92000 }],
    amount: 92000,
    status: 'Sent'
  }
];

const Quotation = () => {
  // Master Quotations list
  const [quotations, setQuotations] = useState(INITIAL_QUOTATIONS);

  // Filter toolbar states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [vendorFilter, setVendorFilter] = useState('All Vendors');
  
  // Custom Date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & selected state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(null);

  // Form inputs
  const [formVendor, setFormVendor] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formClientEmail, setFormClientEmail] = useState('');
  const [formClientAddress, setFormClientAddress] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formValidUntil, setFormValidUntil] = useState('');
  const [formStatus, setFormStatus] = useState('Sent');
  
  // Dynamic form items (array of {service, quantity, rate})
  const [formItems, setFormItems] = useState([{ service: '', quantity: 1, rate: '' }]);

  // Format Helper for Currency
  const formatAmount = (num) => {
    if (num === undefined || num === null) return '₹ 0.00';
    const val = Number(num);
    return '₹ ' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format Date for display e.g., "20 May 2024"
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    const day = dateObj.getDate();
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']; // Simple month mappings
    // Let's use dynamic standard date library month
    const standardMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = standardMonths[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day < 10 ? '0' + day : day} ${month} ${year}`;
  };

  // Helper to extract unique vendors for dropdown list
  const uniqueVendorsList = useMemo(() => {
    const list = new Set(quotations.map(q => q.vendor));
    return Array.from(list).sort();
  }, [quotations]);

  // Derived KPI Stats (calculated dynamically based on the CURRENT dataset)
  const stats = useMemo(() => {
    const total = quotations.length;
    const sent = quotations.filter(q => q.status === 'Sent').length;
    const pending = quotations.filter(q => q.status === 'Pending').length;
    const accepted = quotations.filter(q => q.status === 'Accepted').length;
    const rejected = quotations.filter(q => q.status === 'Rejected').length;
    return { total, sent, pending, accepted, rejected };
  }, [quotations]);

  // Handle opening of Create modal
  const openCreateModal = () => {
    setIsEditing(false);
    setFormVendor('');
    setFormClientName('');
    setFormClientPhone('+91-987-654-3210');
    setFormClientEmail('client@example.com');
    setFormClientAddress('123, Business Park, 3rd Floor MG Road, Guntur-522001');
    setFormDate(new Date().toISOString().split('T')[0]);
    
    // Default valid until date is +10 days
    const tenDaysLater = new Date();
    tenDaysLater.setDate(tenDaysLater.getDate() + 10);
    setFormValidUntil(tenDaysLater.toISOString().split('T')[0]);
    
    setFormStatus('Sent');
    setFormItems([{ service: '', quantity: 1, rate: '' }]);
    setShowFormModal(true);
  };

  // Handle opening of Edit modal
  const openEditModal = (quote) => {
    setIsEditing(true);
    setSelectedQuote(quote);
    setFormVendor(quote.vendor);
    setFormClientName(quote.clientName || '');
    setFormClientPhone(quote.clientPhone || '');
    setFormClientEmail(quote.clientEmail || '');
    setFormClientAddress(quote.clientAddress || '');
    setFormDate(quote.date);
    setFormValidUntil(quote.validUntil);
    setFormStatus(quote.status);
    
    // Load items or default one row if none exist
    if (quote.items && quote.items.length > 0) {
      setFormItems(quote.items.map(item => ({
        service: item.service,
        quantity: item.quantity,
        rate: item.rate.toString()
      })));
    } else {
      setFormItems([{ service: 'Digital Marketing Services', quantity: 1, rate: quote.amount.toString() }]);
    }
    
    setShowFormModal(true);
    setDropdownIndex(null);
  };

  // Item list builders helpers
  const handleAddItemRow = () => {
    setFormItems([...formItems, { service: '', quantity: 1, rate: '' }]);
  };

  const handleRemoveItemRow = (idx) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleUpdateItemRow = (idx, field, val) => {
    const updated = [...formItems];
    updated[idx][field] = val;
    setFormItems(updated);
  };

  // Handle form submission (Create or Edit)
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formVendor || !formDate || !formValidUntil) {
      alert('Please fill out all fields.');
      return;
    }

    // Verify all item details are correct
    for (let item of formItems) {
      if (!item.service || !item.rate || Number(item.rate) <= 0) {
        alert('Please provide valid descriptions and rates for all items.');
        return;
      }
    }

    const compiledItems = formItems.map(item => ({
      service: item.service,
      quantity: Number(item.quantity || 1),
      rate: Number(item.rate)
    }));

    const calculatedAmount = compiledItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

    if (isEditing && selectedQuote) {
      // Edit existing quotation
      setQuotations(prev =>
        prev.map(q =>
          q.id === selectedQuote.id
            ? {
                ...q,
                vendor: formVendor,
                clientName: formClientName,
                clientPhone: formClientPhone,
                clientEmail: formClientEmail,
                clientAddress: formClientAddress,
                date: formDate,
                validUntil: formValidUntil,
                items: compiledItems,
                amount: calculatedAmount,
                status: formStatus
              }
            : q
        )
      );
    } else {
      // Generate new sequential Quote ID Q-2024-XXXX
      const currentYear = new Date(formDate).getFullYear();
      
      // Get maximum existing suffix index
      const ids = quotations.map(q => {
        const parts = q.id.split('-');
        return parts.length === 3 ? parseInt(parts[2]) : 0;
      });
      const maxId = ids.length > 0 ? Math.max(...ids) : 56;
      const nextId = String(maxId + 1).padStart(4, '0');
      const newQuoteId = `Q-${currentYear}-${nextId}`;

      const newQuote = {
        id: newQuoteId,
        vendor: formVendor,
        clientName: formClientName,
        clientPhone: formClientPhone,
        clientEmail: formClientEmail,
        clientAddress: formClientAddress,
        date: formDate,
        validUntil: formValidUntil,
        items: compiledItems,
        amount: calculatedAmount,
        status: formStatus
      };

      setQuotations(prev => [newQuote, ...prev]);
    }

    setShowFormModal(false);
    setSelectedQuote(null);
  };

  // Handle deletion of quotation
  const handleDeleteQuote = (id) => {
    if (window.confirm(`Are you sure you want to delete quotation ${id}?`)) {
      setQuotations(prev => prev.filter(q => q.id !== id));
      setDropdownIndex(null);
      // Adjust pagination page if necessary
      const newTotal = quotations.length - 1;
      const totalPages = Math.ceil(newTotal / pageSize);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    }
  };

  // Filter Logic
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      // Search text filter
      const matchesSearch =
        q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.vendor.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === 'All Status' || q.status === statusFilter;

      // Vendor filter
      const matchesVendor =
        vendorFilter === 'All Vendors' || q.vendor === vendorFilter;

      // Date range filter
      let matchesDates = true;
      if (startDate) {
        matchesDates = matchesDates && new Date(q.date) >= new Date(startDate);
      }
      if (endDate) {
        matchesDates = matchesDates && new Date(q.date) <= new Date(endDate);
      }

      return matchesSearch && matchesStatus && matchesVendor && matchesDates;
    });
  }, [quotations, searchQuery, statusFilter, vendorFilter, startDate, endDate]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All Status');
    setVendorFilter('All Vendors');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Paginated dataset
  const paginatedQuotations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredQuotations.slice(startIndex, startIndex + pageSize);
  }, [filteredQuotations, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredQuotations.length / pageSize));
  }, [filteredQuotations, pageSize]);

  // Go to previous page
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Go to next page
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="flex-1 bg-slate-50 p-6 md:p-8 text-slate-800 overflow-y-auto max-h-[calc(100vh-80px)] dark:bg-slate-900 dark:text-slate-100 font-sans">
      
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Quotations</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 dark:text-slate-400">Manage and track all your quotations</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-[#0b5c3a] hover:bg-[#073c26] text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all duration-200 cursor-pointer active:scale-95 self-start sm:self-center"
        >
          <Plus size={16} />
          New Quotation
        </button>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Quotations */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 dark:bg-slate-800 dark:border-slate-700">
          <div className="w-12 h-12 bg-green-50 border border-green-150 rounded-xl flex items-center justify-center text-green-600 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-400">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-850 dark:text-slate-100 leading-tight">{stats.total}</p>
            <p className="text-xs text-slate-550 font-medium dark:text-slate-400 mt-0.5">Total Quotations</p>
          </div>
        </div>

        {/* Sent */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 dark:bg-slate-800 dark:border-slate-700">
          <div className="w-12 h-12 bg-blue-50 border border-blue-150 rounded-xl flex items-center justify-center text-blue-600 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-400">
            <Send size={20} className="transform -rotate-12 translate-x-0.5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-850 dark:text-slate-100 leading-tight">{stats.sent}</p>
            <p className="text-xs text-slate-550 font-medium dark:text-slate-400 mt-0.5">Sent</p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 dark:bg-slate-800 dark:border-slate-700">
          <div className="w-12 h-12 bg-amber-50 border border-amber-150 rounded-xl flex items-center justify-center text-amber-600 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-400">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-850 dark:text-slate-100 leading-tight">{stats.pending}</p>
            <p className="text-xs text-slate-550 font-medium dark:text-slate-400 mt-0.5">Pending</p>
          </div>
        </div>

        {/* Accepted */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 dark:bg-slate-800 dark:border-slate-700">
          <div className="w-12 h-12 bg-violet-50 border border-violet-150 rounded-xl flex items-center justify-center text-violet-600 dark:bg-violet-950/30 dark:border-violet-900/40 dark:text-violet-400">
            <CheckCircle size={21} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-855 dark:text-slate-100 leading-tight">{stats.accepted}</p>
            <p className="text-xs text-slate-550 font-medium dark:text-slate-400 mt-0.5">Accepted</p>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 dark:bg-slate-800 dark:border-slate-700">
          <div className="w-12 h-12 bg-rose-50 border border-rose-150 rounded-xl flex items-center justify-center text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-400">
            <XCircle size={21} />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-850 dark:text-slate-100 leading-tight">{stats.rejected}</p>
            <p className="text-xs text-slate-550 font-medium dark:text-slate-400 mt-0.5">Rejected</p>
          </div>
        </div>
      </div>

      {/* ================= FILTER TOOLBAR ================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xs min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
              <input
                type="text"
                placeholder="Search quotation, vendor..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0b5c3a] focus:bg-white transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:border-emerald-500"
              />
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-[#0b5c3a] cursor-pointer transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 min-w-[120px]"
            >
              <option value="All Status">All Status</option>
              <option value="Sent">Sent</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Vendors Dropdown */}
            <select
              value={vendorFilter}
              onChange={(e) => {
                setVendorFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-[#0b5c3a] cursor-pointer transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 min-w-[145px]"
            >
              <option value="All Vendors">All Vendors</option>
              {uniqueVendorsList.map((vendor, i) => (
                <option key={i} value={vendor}>{vendor}</option>
              ))}
            </select>

            {/* Date Range inputs */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-650 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
              <Calendar size={14} className="text-slate-450 mr-1" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none p-0 focus:outline-none text-[11px] text-slate-800 dark:text-slate-100 cursor-pointer h-7"
                placeholder="Start"
              />
              <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none p-0 focus:outline-none text-[11px] text-slate-800 dark:text-slate-100 cursor-pointer h-7"
                placeholder="End"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Reset Button */}
            {(searchQuery || statusFilter !== 'All Status' || vendorFilter !== 'All Vendors' || startDate || endDate) && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            
            {/* Mock Filter Trigger Button */}
            <button className="inline-flex items-center gap-1.5 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-750">
              <Filter size={13} className="text-slate-500" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* ================= DATA TABLE SECTION ================= */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider dark:bg-slate-850/50 dark:border-slate-700 dark:text-slate-400">
                <th className="px-6 py-4">Quote No.</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Valid Until</th>
                <th className="px-6 py-4">Amount (₹)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm dark:divide-slate-700">
              {paginatedQuotations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-slate-500 font-medium dark:text-slate-400">
                    No quotation entries found. Try adjusting filters.
                  </td>
                </tr>
              ) : (
                paginatedQuotations.map((quote, index) => {
                  const absoluteIndex = (currentPage - 1) * pageSize + index;
                  return (
                    <tr key={quote.id} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-750/30">
                      
                      {/* Quote No */}
                      <td className="px-6 py-4 font-bold text-[#0b5c3a] dark:text-emerald-400 font-mono tracking-wide">
                        {quote.id}
                      </td>

                      {/* Vendor */}
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                        {quote.vendor}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-350 text-xs">
                        {formatDate(quote.date)}
                      </td>

                      {/* Valid Until */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-350 text-xs">
                        {formatDate(quote.validUntil)}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">
                        {formatAmount(quote.amount)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          quote.status === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-300' :
                          quote.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-300' :
                          quote.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300' :
                          'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-300'
                        }`}>
                          {quote.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 relative">
                          <button
                            onClick={() => {
                              setSelectedQuote(quote);
                              setShowViewModal(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-[#0b5c3a] dark:hover:text-emerald-400 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>
                          
                          <button
                            onClick={() => openEditModal(quote)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            title="Edit Quotation"
                          >
                            <Edit size={15} />
                          </button>

                          {/* Options dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setDropdownIndex(dropdownIndex === absoluteIndex ? null : absoluteIndex)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {dropdownIndex === absoluteIndex && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setDropdownIndex(null)}
                                />
                                <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 dark:bg-slate-800 dark:border-slate-700 text-left">
                                  <button
                                    onClick={() => handleDeleteQuote(quote.id)}
                                    className="w-full px-3 py-2 text-xs text-red-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 dark:text-rose-450 hover:text-red-700 flex items-center gap-1.5 cursor-pointer font-semibold"
                                  >
                                    <Trash size={12} />
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => {
                                      // Toggle status shortcut
                                      const statuses = ['Sent', 'Pending', 'Accepted', 'Rejected'];
                                      const nextStatusIdx = (statuses.indexOf(quote.status) + 1) % statuses.length;
                                      const nextStatus = statuses[nextStatusIdx];
                                      setQuotations(prev =>
                                        prev.map(q => q.id === quote.id ? { ...q, status: nextStatus } : q)
                                      );
                                      setDropdownIndex(null);
                                    }}
                                    className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    Cycle Status
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION & FOOTER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/20">
          
          {/* Entries Counter */}
          <div className="text-xs text-slate-550 dark:text-slate-400">
            {filteredQuotations.length === 0 ? (
              'Showing 0 entries'
            ) : (
              `Showing ${Math.min(filteredQuotations.length, (currentPage - 1) * pageSize + 1)} to ${Math.min(
                filteredQuotations.length,
                currentPage * pageSize
              )} of ${filteredQuotations.length} entries`
            )}
          </div>

          <div className="flex items-center gap-4 self-center">
            {/* Page selection buttons */}
            <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden dark:bg-slate-800 dark:border-slate-700">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-2 border-r border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-slate-700 cursor-pointer"
              >
                <ChevronLeft size={14} className="text-slate-650 dark:text-slate-350" />
              </button>
              
              {/* Generate page numbers list */}
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isActive = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-xs font-semibold cursor-pointer border-r last:border-r-0 border-slate-200 dark:border-slate-700 ${
                      isActive
                        ? 'bg-[#0b5c3a] text-white'
                        : 'text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-slate-700 cursor-pointer"
              >
                <ChevronRight size={14} className="text-slate-650 dark:text-slate-350" />
              </button>
            </div>

            {/* Page Size Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-[#0b5c3a] cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* ================= MODAL: CREATE / EDIT FORM ================= */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleFormSubmit}
            className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 flex flex-col max-h-[90vh] animate-fade-in"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? `Edit Quotation - ${selectedQuote?.id}` : 'Create New Quotation'}
              </h3>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Fields (Scrollable) */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Billed To/Client Details Title */}
              <div className="border-b border-slate-100 pb-2 dark:border-slate-700">
                <h4 className="text-xs font-bold text-[#0b5c3a] dark:text-emerald-400 uppercase tracking-wide">Client Details (TO)</h4>
              </div>

              {/* Vendor & Client Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
                    Client Company Name (Vendor)
                  </label>
                  <input
                    type="text"
                    required
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0b5c3a] focus:bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:border-emerald-500"
                    placeholder="e.g. Creative Minds"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0b5c3a] focus:bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:border-emerald-500"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              {/* Client Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
                    Client Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formClientPhone}
                    onChange={(e) => setFormClientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0b5c3a] focus:bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:border-emerald-500"
                    placeholder="+91-987-654-3210"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
                    Client Corporate Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formClientEmail}
                    onChange={(e) => setFormClientEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0b5c3a] focus:bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:border-emerald-500"
                    placeholder="client@example.com"
                  />
                </div>
              </div>

              {/* Client Address */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
                  Client Full Address
                </label>
                <textarea
                  required
                  value={formClientAddress}
                  onChange={(e) => setFormClientAddress(e.target.value)}
                  rows="2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0b5c3a] focus:bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:border-emerald-500"
                  placeholder="123, Business Park, 3rd Floor MG Road, Guntur-522001"
                />
              </div>

              {/* Items Section Title */}
              <div className="border-b border-slate-100 pb-2 pt-2 dark:border-slate-700 flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#0b5c3a] dark:text-emerald-400 uppercase tracking-wide">Quoted Service Items</h4>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="text-xs font-bold text-blue-600 hover:text-blue-500 cursor-pointer"
                >
                  + Add Item
                </button>
              </div>

              {/* Dynamic Items Builder rows */}
              <div className="space-y-3">
                {formItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col md:grid md:grid-cols-12 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 items-end">
                    
                    {/* Service Description */}
                    <div className="col-span-6 w-full text-left">
                      <label className="block md:hidden text-[9px] font-bold text-slate-450 uppercase mb-1">Service Description</label>
                      <input
                        type="text"
                        required
                        placeholder="Service Description / Item detail"
                        value={item.service}
                        onChange={(e) => handleUpdateItemRow(idx, 'service', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#0b5c3a] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 h-9"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2 w-full">
                      <label className="block md:hidden text-[9px] font-bold text-slate-450 uppercase mb-1">Qty</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItemRow(idx, 'quantity', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#0b5c3a] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-center h-9"
                      />
                    </div>

                    {/* Rate */}
                    <div className="col-span-3 w-full">
                      <label className="block md:hidden text-[9px] font-bold text-slate-450 uppercase mb-1">Rate (₹)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => handleUpdateItemRow(idx, 'rate', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#0b5c3a] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 h-9"
                      />
                    </div>

                    {/* Delete Action */}
                    <div className="col-span-1 flex justify-center w-full pb-1 md:pb-0">
                      <button
                        type="button"
                        disabled={formItems.length === 1}
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-500 hover:text-red-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors disabled:opacity-40 disabled:hover:bg-white h-9 w-9 flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Settings Section Title */}
              <div className="border-b border-slate-100 pb-2 pt-2 dark:border-slate-700">
                <h4 className="text-xs font-bold text-[#0b5c3a] dark:text-emerald-400 uppercase tracking-wide">Quotation Settings</h4>
              </div>

              {/* Dates & Status grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
                    Quotation Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:border-[#0b5c3a] focus:bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    required
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:border-[#0b5c3a] focus:bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-855 focus:outline-none focus:border-[#0b5c3a] cursor-pointer dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  >
                    <option value="Sent">Sent</option>
                    <option value="Pending">Pending</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Modal Buttons Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850/50">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-550 text-xs font-semibold cursor-pointer dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-350"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#0b5c3a] hover:bg-[#073c26] text-white rounded-xl px-5 py-2 text-xs font-semibold cursor-pointer shadow-sm shadow-[#0b5c3a]/10"
              >
                {isEditing ? 'Save Changes' : 'Create Quotation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: DETAILED DOCUMENT VIEW (MANUEN INFOTECH TEMPLATE) ================= */}
      {showViewModal && selectedQuote && (() => {
        // Calculate items
        const quoteItems = selectedQuote.items && selectedQuote.items.length > 0 
          ? selectedQuote.items 
          : [{ service: 'Digital Marketing Services', quantity: 1, rate: selectedQuote.amount }];
        
        const subtotal = quoteItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        const gstTotal = subtotal * 0.18;
        const grandTotal = subtotal + gstTotal;

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 animate-fade-in font-sans">
              
              {/* View Header Control Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850/50">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#0b5c3a] dark:text-emerald-400" />
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">Quotation Invoice Template</span>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* View Body Document Sheet (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100 dark:bg-slate-900/60 custom-scrollbar">
                
                {/* Visual Printable Invoice Canvas */}
                <div className="bg-white border border-slate-200 shadow-lg p-6 md:p-10 dark:bg-slate-800 dark:border-slate-700 relative overflow-hidden max-w-[800px] mx-auto text-left select-text">
                  
                  {/* Decorative Corner Angled Shapes (Top Right / Top Left) */}
                  <div className="absolute top-0 right-0 w-36 h-8 bg-[#0b5c3a] transform rotate-12 translate-x-12 -translate-y-4" />
                  <div className="absolute top-0 left-0 w-36 h-2 bg-[#0b5c3a] transform -rotate-12 -translate-x-12 -translate-y-1" />

                  {/* ================= 1. BRAND HEADER SECTION ================= */}
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 pb-6 border-b border-slate-200 dark:border-slate-700 mt-2">
                    
                    {/* Left Brand Details Logo */}
                    <div className="flex items-center gap-3.5">
                      {/* Stylized Logo SVG Matching template */}
                      <div className="w-12 h-12 bg-[#0b5c3a] rounded-xl flex items-center justify-center text-white shadow-md relative overflow-hidden shrink-0">
                        <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="50" cy="30" r="16" fill="white" />
                          <path d="M25 75C25 55 35 48 50 48C65 48 75 55 75 75H25Z" fill="white" />
                          <rect x="42" y="42" width="16" height="30" rx="3" fill="#0b5c3a" />
                          <circle cx="50" cy="52" r="5" fill="white" />
                        </svg>
                      </div>

                      {/* Brand name and subtitles */}
                      <div className="flex flex-col">
                        <h1 className="text-xl font-black text-slate-800 tracking-wider leading-none dark:text-white">
                          MANUEN
                        </h1>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="h-[1.5px] bg-slate-300 dark:bg-slate-600 w-3"></div>
                          <span className="bg-[#0b5c3a] text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                            INFOTECH
                          </span>
                          <div className="h-[1.5px] bg-slate-300 dark:bg-slate-600 w-3"></div>
                        </div>
                        <span className="text-[7.5px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                          DIGITAL SERVICES & IT SOLUTIONS
                        </span>
                      </div>
                    </div>

                    {/* Right Title Block with dots grid */}
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:block h-14 w-[1px] bg-slate-300 dark:bg-slate-600"></div>
                      <div className="shrink-0">
                        <span className="text-[10px] uppercase font-extrabold text-slate-600 dark:text-slate-400 tracking-widest block mb-0.5">DIGITAL MARKETING</span>
                        <h2 className="text-2xl font-black text-[#0b5c3a] dark:text-emerald-400 tracking-widest leading-none">QUOTATION</h2>
                      </div>
                      
                      {/* Dots Grid (3 rows x 4 cols) */}
                      <div className="grid grid-cols-4 gap-1 opacity-50 shrink-0">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#0b5c3a]"></div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* ================= 2. DATE & QUOTE NO SECTION ================= */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-100 dark:border-slate-700 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-emerald-50 text-[#0b5c3a] flex items-center justify-center dark:bg-emerald-950/20 dark:text-emerald-400"><Calendar size={11} /></div>
                      <span className="font-bold text-slate-500 min-w-[75px] dark:text-slate-400">Date</span>
                      <span className="text-slate-400 mr-1">:</span>
                      <span className="flex-1 pb-0.5 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(selectedQuote.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-emerald-50 text-[#0b5c3a] flex items-center justify-center dark:bg-emerald-950/20 dark:text-emerald-400"><FileText size={11} /></div>
                      <span className="font-bold text-slate-500 min-w-[75px] dark:text-slate-400">Quote No</span>
                      <span className="text-slate-400 mr-1">:</span>
                      <span className="flex-1 pb-0.5 border-b border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {selectedQuote.id}
                      </span>
                    </div>
                  </div>

                  {/* ================= 3. FROM & TO CONTACT SECTION ================= */}
                  <div className="grid grid-cols-1 md:grid-cols-9 gap-4 md:gap-2 py-6 border-b border-slate-200 dark:border-slate-700 text-xs">
                    
                    {/* FROM Details (Left 4 cols) */}
                    <div className="md:col-span-4 space-y-2">
                      <span className="text-[10px] uppercase font-black text-[#0b5c3a] border-b-2 border-[#0b5c3a] pb-0.5 block w-fit mb-3 tracking-wider dark:text-emerald-400 dark:border-emerald-400">FROM</span>
                      <p className="font-black text-slate-800 dark:text-white leading-tight">MANUEN INFOTECH</p>
                      <p className="text-[9px] uppercase font-bold text-slate-550 dark:text-slate-400 leading-tight">DIGITAL SERVICES & IT SOLUTIONS</p>
                      
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center gap-2.5 text-slate-650 dark:text-slate-300">
                          <div className="w-5 h-5 rounded-full bg-[#0b5c3a] text-white flex items-center justify-center shrink-0 shadow-xs"><Phone size={10} /></div>
                          <span>+91-799-700-1144</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-650 dark:text-slate-300">
                          <div className="w-5 h-5 rounded-full bg-[#0b5c3a] text-white flex items-center justify-center shrink-0 shadow-xs"><Mail size={10} /></div>
                          <span className="break-all">connect@manuen.com</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-slate-650 dark:text-slate-300">
                          <div className="w-5 h-5 rounded-full bg-[#0b5c3a] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs"><MapPin size={10} /></div>
                          <div className="leading-tight">
                            <p>Vaarahi Enclave, 6/13</p>
                            <p>Brodipet, Guntur-2</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle Separator (1 col) */}
                    <div className="hidden md:flex md:col-span-1 justify-center py-2 relative">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0b5c3a] dark:bg-emerald-400"></div>
                      <div className="w-[1px] h-full bg-slate-205 dark:bg-slate-700 my-1.5"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0b5c3a] dark:bg-emerald-400 absolute bottom-2"></div>
                    </div>

                    {/* TO Details (Right 4 cols) */}
                    <div className="md:col-span-4 space-y-2">
                      <span className="text-[10px] uppercase font-black text-[#0b5c3a] border-b-2 border-[#0b5c3a] pb-0.5 block w-fit mb-3 tracking-wider dark:text-emerald-400 dark:border-emerald-400">TO</span>
                      <p className="font-black text-slate-800 dark:text-white leading-tight">
                        {selectedQuote.clientName || 'CLIENT NAME'}
                      </p>
                      <p className="text-[9px] uppercase font-bold text-slate-550 dark:text-slate-400 leading-tight">
                        {selectedQuote.vendor || 'COMPANY NAME'}
                      </p>
                      
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center gap-2.5 text-slate-650 dark:text-slate-300">
                          <div className="w-5 h-5 rounded-full bg-[#0b5c3a] text-white flex items-center justify-center shrink-0 shadow-xs"><Phone size={10} /></div>
                          <span>{selectedQuote.clientPhone || '+91-987-654-3210'}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-650 dark:text-slate-300">
                          <div className="w-5 h-5 rounded-full bg-[#0b5c3a] text-white flex items-center justify-center shrink-0 shadow-xs"><Mail size={10} /></div>
                          <span className="break-all">{selectedQuote.clientEmail || 'client@example.com'}</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-slate-650 dark:text-slate-300">
                          <div className="w-5 h-5 rounded-full bg-[#0b5c3a] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs"><MapPin size={10} /></div>
                          <div className="leading-tight">
                            <p>{selectedQuote.clientAddress || '123, Business Park, 3rd Floor'}</p>
                            {!selectedQuote.clientAddress && <p>MG Road, Guntur-522001</p>}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* ================= 4. SERVICE DELIVERABLES TABLE ================= */}
                  <div className="my-6">
                    <div className="overflow-hidden border border-slate-150 rounded-xl dark:border-slate-700">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-[#e3edd9] text-[#0b5c3a] font-black uppercase dark:bg-[#0b5c3a]/25 dark:text-emerald-300">
                            <th className="py-3.5 px-4 text-left font-extrabold tracking-wider">SERVICE</th>
                            <th className="py-3.5 px-4 text-center font-extrabold tracking-wider w-20">QUANTITY</th>
                            <th className="py-3.5 px-4 text-right font-extrabold tracking-wider w-32">GST (18%)</th>
                            <th className="py-3.5 px-4 text-right font-extrabold tracking-wider w-32">SUBTOTAL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {quoteItems.map((item, i) => {
                            const itemSubtotal = item.quantity * item.rate;
                            const itemGst = itemSubtotal * 0.18;
                            return (
                              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30">
                                <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 leading-normal">
                                  {item.service}
                                </td>
                                <td className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300 font-mono">
                                  {item.quantity}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold text-slate-600 dark:text-slate-350 font-mono">
                                  {formatAmount(itemGst)}
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200 font-mono">
                                  {formatAmount(itemSubtotal)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ================= 5. TOTAL ROW ================= */}
                  <div className="flex border border-slate-200 rounded-xl overflow-hidden mt-4 dark:border-slate-700">
                    <div className="flex-1 bg-white dark:bg-slate-800 px-6 py-3.5 flex items-center justify-between">
                      <span className="font-extrabold text-[#0b5c3a] text-sm dark:text-emerald-400 tracking-wider">TOTAL</span>
                    </div>
                    <div className="w-48 bg-[#e3edd9] dark:bg-[#0b5c3a]/25 px-6 py-3.5 text-right flex items-center justify-end font-black text-[#0b5c3a] dark:text-emerald-300 text-sm font-mono">
                      {formatAmount(grandTotal)}
                    </div>
                  </div>

                  {/* ================= 6. BANK DETAILS BOX ================= */}
                  <div className="mt-8">
                    {/* Bank Details Header Separator */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700 relative">
                        <span className="absolute -top-1.5 right-0 w-3 h-3 rounded-full bg-[#0b5c3a] border-2 border-white dark:border-slate-800"></span>
                      </div>
                      <span className="text-xs font-black text-[#0b5c3a] dark:text-emerald-400 tracking-wider uppercase">Bank Details</span>
                      <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700 relative">
                        <span className="absolute -top-1.5 left-0 w-3 h-3 rounded-full bg-[#0b5c3a] border-2 border-white dark:border-slate-800"></span>
                      </div>
                    </div>
                    
                    {/* Rounded Rectangle Details Card */}
                    <div className="border border-[#0b5c3a]/30 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-800/50 shadow-xs">
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs text-slate-700 dark:text-slate-350">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0b5c3a] mt-1.5 shrink-0"></div>
                          <div>
                            <span className="font-extrabold text-slate-650 dark:text-slate-300">A/c Holder's Name:</span> MANUEN INFOTECH (OPC)
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0b5c3a] mt-1.5 shrink-0"></div>
                          <div>
                            <span className="font-extrabold text-slate-650 dark:text-slate-300">Bank Name:</span> HDFC BANK
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0b5c3a] mt-1.5 shrink-0"></div>
                          <div>
                            <span className="font-extrabold text-slate-650 dark:text-slate-300">Account No:</span> 50200118677718
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0b5c3a] mt-1.5 shrink-0"></div>
                          <div>
                            <span className="font-extrabold text-slate-650 dark:text-slate-300">Branch & IFS Code:</span> Kothapet & HDFC0004266
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* ================= 7. FOOTER BANNER ================= */}
                  <div className="mt-8 text-center relative">
                    <div className="bg-[#0b5c3a] text-white py-3.5 px-6 rounded-xl flex items-center justify-center font-bold tracking-widest text-[11px] uppercase shadow-sm">
                      <span className="opacity-70 mr-3.5 text-xs">\ | /</span>
                      THANK YOU FOR YOUR BUSINESS
                      <span className="opacity-70 ml-3.5 text-xs">/ | \</span>
                    </div>
                    {/* Corner decorative angled borders at the bottom */}
                    <div className="absolute bottom-0 left-0 w-16 h-2 bg-[#0b5c3a] transform rotate-12 -translate-x-12 translate-y-10" />
                    <div className="absolute bottom-0 right-0 w-16 h-2 bg-[#0b5c3a] transform -rotate-12 translate-x-12 translate-y-10" />
                  </div>

                </div>
              </div>

              {/* View Modal Action Buttons Footer */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850/50">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                  selectedQuote.status === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40 dark:text-blue-300' :
                  selectedQuote.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-300' :
                  selectedQuote.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300' :
                  'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-300'
                }`}>
                  Quotation Status: {selectedQuote.status}
                </span>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      alert('PDF print request compiled successfully! Ready for printing.');
                      window.print();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-500 text-xs font-semibold cursor-pointer dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-350 transition-colors"
                  >
                    <Download size={13} />
                    Print / Save PDF
                  </button>
                  
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2.5 bg-slate-700 hover:bg-slate-650 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                  >
                    Close Document
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default Quotation;
