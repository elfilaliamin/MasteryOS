import { getCategoriesByUser, createCategory, deleteCategory } from '../models/category.model.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await getCategoriesByUser(req.user.id);
    res.status(200).json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

export const addCategory = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }
    const category = await createCategory(req.user.id, name.trim(), color);
    res.status(201).json({ category });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category.' });
  }
};

export const removeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteCategory(req.user.id, id);
    res.status(200).json({ message: 'Category removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category.' });
  }
};
