import Product from '../models/Product.js';

// @desc    Create a predefined product/service
// @route   POST /api/products
// @access  Private (Admin Only)
export const createProduct = async (req, res) => {
  try {
    const { name, category, price, description } = req.body;

    const product = new Product({
      name,
      category,
      price,
      description,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all predefined products/services
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a predefined product/service
// @route   PUT /api/products/:id
// @access  Private (Admin Only)
export const updateProduct = async (req, res) => {
  try {
    const { name, category, price, description } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product/Service not found' });
    }

    product.name = name || product.name;
    product.category = category || product.category;
    product.price = price || product.price;
    product.description = description || product.description;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a predefined product/service
// @route   DELETE /api/products/:id
// @access  Private (Admin Only)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product/Service not found' });
    }

    await product.deleteOne();
    res.json({ message: 'Product/Service removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
