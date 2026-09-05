import React, { useState } from 'react';
import {
  FolderTree, Plus, Search, Edit2, Trash2, CheckCircle2,
  Image, Sparkles, Layers, ArrowUpRight, Check, X, Eye, ExternalLink, HelpCircle
} from 'lucide-react';
import { StoreCategory, StoreProduct } from '../../types/store.ts';
import { getStoredCategories, saveStoredCategories, getStoredProducts } from '../../data/storeProducts.ts';

export const AdminCategoriesDesk: React.FC = () => {
  const [categories, setCategories] = useState<StoreCategory[]>(getStoredCategories);
  const [products] = useState<StoreProduct[]>(getStoredProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    slug: string;
    icon: string;
    description: string;
    parentId: string;
    ageTag: string;
    thumbnailImage: string;
    bannerImage: string;
    isFeatured: boolean;
    displayOrder: number;
    subcategoriesText: string;
  }>({
    id: '',
    name: '',
    slug: '',
    icon: '📦',
    description: '',
    parentId: '',
    ageTag: 'All Ages',
    thumbnailImage: '',
    bannerImage: '',
    isFeatured: false,
    displayOrder: 1,
    subcategoriesText: ''
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Open modal for new category
  const handleOpenNew = () => {
    setEditingCategory(null);
    setFormData({
      id: 'cat-' + Date.now(),
      name: '',
      slug: '',
      icon: '✨',
      description: '',
      parentId: '',
      ageTag: 'All Ages',
      thumbnailImage: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&auto=format&fit=crop&q=80',
      bannerImage: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      displayOrder: categories.length + 1,
      subcategoriesText: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (cat: StoreCategory) => {
    setEditingCategory(cat);
    setFormData({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || '📦',
      description: cat.description || '',
      parentId: cat.parentId || '',
      ageTag: cat.ageTag || 'All Ages',
      thumbnailImage: cat.thumbnailImage || '',
      bannerImage: cat.bannerImage || '',
      isFeatured: !!cat.isFeatured,
      displayOrder: cat.displayOrder || 1,
      subcategoriesText: (cat.subcategories || []).join(', ')
    });
    setIsModalOpen(true);
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === '' || !editingCategory ? slug : prev.slug
    }));
  };

  // Save Category
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const subcategories = formData.subcategoriesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const parentCat = categories.find(c => c.id === formData.parentId);

    const updatedCategory: StoreCategory = {
      id: editingCategory ? editingCategory.id : (formData.slug || 'cat-' + Date.now()),
      name: formData.name.trim(),
      slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: formData.icon.trim() || '📦',
      description: formData.description.trim(),
      parentId: formData.parentId || undefined,
      parentName: parentCat?.name || undefined,
      ageTag: formData.ageTag.trim() || 'All Ages',
      thumbnailImage: formData.thumbnailImage.trim() || undefined,
      bannerImage: formData.bannerImage.trim() || undefined,
      isFeatured: formData.isFeatured,
      displayOrder: Number(formData.displayOrder) || 1,
      subcategories: subcategories.length > 0 ? subcategories : undefined
    };

    let updatedList: StoreCategory[];
    if (editingCategory) {
      updatedList = categories.map(c => c.id === editingCategory.id ? updatedCategory : c);
      showNotification(`Category "${updatedCategory.name}" updated successfully.`);
    } else {
      updatedList = [...categories, updatedCategory];
      showNotification(`New category "${updatedCategory.name}" created.`);
    }

    setCategories(updatedList);
    saveStoredCategories(updatedList);
    setIsModalOpen(false);
  };

  // Delete Category
  const handleDelete = (catId: string, catName: string) => {
    if (catId === 'all') {
      alert('The root "All Products" category cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete the category "${catName}"? Products in this category will remain in the catalog.`)) {
      const updated = categories.filter(c => c.id !== catId);
      setCategories(updated);
      saveStoredCategories(updated);
      showNotification(`Category "${catName}" deleted.`);
    }
  };

  // Calculate real product counts per category
  const getCategoryProductCount = (category: StoreCategory) => {
    if (category.id === 'all') return products.length;
    return products.filter(p => 
      p.category?.toLowerCase() === category.name.toLowerCase() ||
      p.category?.toLowerCase() === category.slug.toLowerCase() ||
      category.name.toLowerCase().includes(p.category?.toLowerCase() || '___')
    ).length;
  };

  // Filtered Categories
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn" id="admin-categories-desk">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-teal-600" />
            <h2 className="font-bold text-base text-slate-900">WooCommerce Category Manager</h2>
            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
              {categories.length} Categories
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize products into hierarchical departments, customize thumbnails, subcategories, and age tags.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-teal-500 font-medium w-48 sm:w-60"
            />
          </div>
          <button
            type="button"
            onClick={handleOpenNew}
            className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Categories Grid / Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Fast Add Category Form (WooCommerce side panel style) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs h-fit space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900">Quick Add Category</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Category Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kids Food & Nutrition"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-teal-500 font-medium"
              />
              <span className="text-[10.5px] text-slate-400">The name is how it appears on your site.</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Slug</label>
              <input
                type="text"
                placeholder="e.g. kids-food"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-teal-500 font-mono"
              />
              <span className="text-[10.5px] text-slate-400">URL-friendly version of the name.</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Icon / Emoji</label>
                <input
                  type="text"
                  placeholder="🥑"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden text-center text-base"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Age Tag</label>
                <input
                  type="text"
                  placeholder="6m - 10y"
                  value={formData.ageTag}
                  onChange={(e) => setFormData({ ...formData, ageTag: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Parent Category</label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden font-medium"
              >
                <option value="">None (Top-Level Category)</option>
                {categories.filter(c => c.id !== 'all' && (!editingCategory || c.id !== editingCategory.id)).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Description of products in this category..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-teal-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Thumbnail Image URL</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={formData.thumbnailImage}
                onChange={(e) => setFormData({ ...formData, thumbnailImage: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Subcategories (comma-separated)</label>
              <input
                type="text"
                placeholder="Sprouted Porridges, Fruit Melts, Teething Rusks"
                value={formData.subcategoriesText}
                onChange={(e) => setFormData({ ...formData, subcategoriesText: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden font-medium"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isFeaturedCat"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="isFeaturedCat" className="font-bold text-slate-700 cursor-pointer">
                Feature on Store Homepage &amp; Top Navigation
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>{editingCategory ? 'Update Category' : 'Add New Category'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Categories List Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px]">
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description &amp; Subcategories</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map(cat => {
                    const count = getCategoryProductCount(cat);
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-lg">
                              {cat.thumbnailImage ? (
                                <img src={cat.thumbnailImage} alt={cat.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{cat.icon || '📦'}</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <strong className="text-slate-900 font-bold">{cat.name}</strong>
                                {cat.isFeatured && (
                                  <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                    Featured
                                  </span>
                                )}
                              </div>
                              {cat.ageTag && (
                                <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 inline-block mt-0.5">
                                  Age: {cat.ageTag}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-600 text-xs line-clamp-1">{cat.description}</p>
                          {cat.subcategories && cat.subcategories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {cat.subcategories.slice(0, 3).map((sub, i) => (
                                <span key={i} className="bg-slate-100 text-slate-600 text-[9.5px] px-1.5 py-0.2 rounded font-medium">
                                  {sub}
                                </span>
                              ))}
                              {cat.subcategories.length > 3 && (
                                <span className="text-[9.5px] text-slate-400">+{cat.subcategories.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {cat.slug}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
                            {count}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {cat.id !== 'all' && (
                            <button
                              type="button"
                              onClick={() => handleDelete(cat.id, cat.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
