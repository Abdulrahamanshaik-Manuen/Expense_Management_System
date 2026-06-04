import PurchaseRequest from '../models/PurchaseRequest.js';

// @desc    Create a new purchase request
// @route   POST /api/purchase-requests
// @access  Private
export const createPurchaseRequest = async (req, res) => {
  try {
    const { itemDescription, category, estimatedBudget, priority, remarks } = req.body;

    const request = new PurchaseRequest({
      itemDescription,
      category,
      estimatedBudget,
      priority,
      remarks,
      requestedBy: req.user._id,
    });

    const createdRequest = await request.save();
    res.status(201).json(createdRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all purchase requests
// @route   GET /api/purchase-requests
// @access  Private
export const getPurchaseRequests = async (req, res) => {
  try {
    let query = {};

    const requests = await PurchaseRequest.find(query)
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });
      
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/Reject a purchase request
// @route   PUT /api/purchase-requests/:id/status
// @access  Private (Admin Only)
export const updatePurchaseRequestStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body; // Approved or Rejected

    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }

    request.status = status;
    request.approvedBy = req.user._id;
    if (remarks) request.remarks = remarks;

    const updatedRequest = await request.save();
    res.json(updatedRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a purchase request
// @route   DELETE /api/purchase-requests/:id
// @access  Private
export const deletePurchaseRequest = async (req, res) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }

    // Only allow deletion if the user is Admin or the Manager who created it (and it is still pending)
    if (req.user.role !== 'admin' && request.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }

    if (req.user.role === 'manager' && request.status !== 'Pending') {
      return res.status(400).json({ message: 'Cannot delete an already processed request' });
    }

    await request.deleteOne();
    res.json({ message: 'Purchase request removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
