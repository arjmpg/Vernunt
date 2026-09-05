import React, { useState } from 'react';
import {
  Tag, Plus, Search, Edit2, Trash2, CheckCircle2,
  Sliders, Sparkles, Layers, Check, X, Eye, Settings, HelpCircle, Palette
} from 'lucide-react';
import { StoreAttribute, StoreAttributeTerm } from '../../types/store.ts';
import { getStoredAttributes, saveStoredAttributes } from '../../data/storeProducts.ts';

export const AdminAttributesDesk: React.FC = () => {
  const [attributes, setAttributes] = useState<StoreAttribute[]>(getStoredAttributes);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttributeForTerms, setSelectedAttributeForTerms] = useState<StoreAttribute | null>(null);

  // Form State for new Attribute
  const [attrForm, setAttrForm] = useState<{
    id: string;
    name: string;
    slug: string;
    type: 'select' | 'button' | 'color' | 'text';
    description: string;
    visibleOnProductPage: boolean;
  }>({
    id: '',
    name: '',
    slug: '',
    type: 'select',
    description: '',
    visibleOnProductPage: true
  });

  // Form State for new Term
  const [newTermName, setNewTermName] = useState('');
  const [newTermSlug, setNewTermSlug] = useState('');
  const [newTermColor, setNewTermColor] = useState('#2563eb');
  const [newTermDesc, setNewTermDesc] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Add / Edit Attribute
  const handleSaveAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrForm.name.trim()) return;

    const slug = attrForm.slug.trim() || attrForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existingIndex = attributes.findIndex(a => a.id === attrForm.id);

    let updated: StoreAttribute[];
    if (existingIndex >= 0) {
      updated = attributes.map(a => a.id === attrForm.id ? {
        ...a,
        name: attrForm.name.trim(),
        slug,
        type: attrForm.type,
        description: attrForm.description.trim(),
        visibleOnProductPage: attrForm.visibleOnProductPage
      } : a);
      showNotification(`Attribute "${attrForm.name}" updated.`);
    } else {
      const newAttr: StoreAttribute = {
        id: 'attr-' + Date.now(),
        name: attrForm.name.trim(),
        slug,
        type: attrForm.type,
        isGlobal: true,
        terms: [],
        description: attrForm.description.trim(),
        visibleOnProductPage: attrForm.visibleOnProductPage
      };
      updated = [...attributes, newAttr];
      showNotification(`New attribute "${newAttr.name}" created.`);
    }

    setAttributes(updated);
    saveStoredAttributes(updated);
    setAttrForm({
      id: '',
      name: '',
      slug: '',
      type: 'select',
      description: '',
      visibleOnProductPage: true
    });
  };

  // Delete Attribute
  const handleDeleteAttribute = (id: string, name: string) => {
    if (confirm(`Delete attribute "${name}" and all its assigned options?`)) {
      const updated = attributes.filter(a => a.id !== id);
      setAttributes(updated);
      saveStoredAttributes(updated);
      if (selectedAttributeForTerms?.id === id) {
        setSelectedAttributeForTerms(null);
      }
      showNotification(`Attribute "${name}" deleted.`);
    }
  };

  // Add Term to selected Attribute
  const handleAddTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttributeForTerms || !newTermName.trim()) return;

    const termSlug = newTermSlug.trim() || newTermName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newTerm: StoreAttributeTerm = {
      id: 'term-' + Date.now(),
      name: newTermName.trim(),
      slug: termSlug,
      colorHex: selectedAttributeForTerms.type === 'color' ? newTermColor : undefined,
      description: newTermDesc.trim() || undefined
    };

    const updated = attributes.map(attr => {
      if (attr.id === selectedAttributeForTerms.id) {
        const terms = [...attr.terms, newTerm];
        const updatedAttr = { ...attr, terms };
        setSelectedAttributeForTerms(updatedAttr);
        return updatedAttr;
      }
      return attr;
    });

    setAttributes(updated);
    saveStoredAttributes(updated);
    setNewTermName('');
    setNewTermSlug('');
    setNewTermDesc('');
    showNotification(`Added term "${newTerm.name}".`);
  };

  // Delete Term
  const handleDeleteTerm = (termId: string) => {
    if (!selectedAttributeForTerms) return;

    const updated = attributes.map(attr => {
      if (attr.id === selectedAttributeForTerms.id) {
        const terms = attr.terms.filter(t => t.id !== termId);
        const updatedAttr = { ...attr, terms };
        setSelectedAttributeForTerms(updatedAttr);
        return updatedAttr;
      }
      return attr;
    });

    setAttributes(updated);
    saveStoredAttributes(updated);
    showNotification('Term deleted.');
  };

  // Filtered attributes
  const filteredAttributes = attributes.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn" id="admin-attributes-desk">
      {/* Toast */}
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
            <Tag className="w-5 h-5 text-teal-600" />
            <h2 className="font-bold text-base text-slate-900">WooCommerce Product Attributes</h2>
            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
              {attributes.length} Global Attributes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure reusable variations and specifications like Flavors, Pack Sizes, Dietary Standards, and Toy Materials.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search attributes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-teal-500 font-medium w-48 sm:w-60"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Add Attribute */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs h-fit space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">
              {attrForm.id ? 'Edit Attribute' : 'Add New Attribute'}
            </h3>
          </div>

          <form onSubmit={handleSaveAttribute} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Attribute Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Flavor / Taste"
                value={attrForm.name}
                onChange={(e) => setAttrForm({ ...attrForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-teal-500 font-medium"
              />
              <span className="text-[10.5px] text-slate-400">Name shown to customers (e.g. Flavor, Size).</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Slug</label>
              <input
                type="text"
                placeholder="e.g. flavor"
                value={attrForm.slug}
                onChange={(e) => setAttrForm({ ...attrForm, slug: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Display Type</label>
              <select
                value={attrForm.type}
                onChange={(e) => setAttrForm({ ...attrForm, type: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden font-medium"
              >
                <option value="select">Select Dropdown</option>
                <option value="button">Pill / Button Swatch</option>
                <option value="color">Color Swatch</option>
                <option value="text">Custom Text</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="How this attribute is used..."
                value={attrForm.description}
                onChange={(e) => setAttrForm({ ...attrForm, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="visibleOnProd"
                checked={attrForm.visibleOnProductPage}
                onChange={(e) => setAttrForm({ ...attrForm, visibleOnProductPage: e.target.checked })}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="visibleOnProd" className="font-bold text-slate-700 cursor-pointer">
                Visible on product details &amp; variation selector
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{attrForm.id ? 'Save Changes' : 'Add Attribute'}</span>
              </button>
              {attrForm.id && (
                <button
                  type="button"
                  onClick={() => setAttrForm({ id: '', name: '', slug: '', type: 'select', description: '', visibleOnProductPage: true })}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Middle & Right: Attributes List & Terms Inspector */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                Available Global Attributes ({filteredAttributes.length})
              </h3>
              <span className="text-[11px] text-slate-500">Click "Configure Terms" to add or edit choices</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredAttributes.map(attr => (
                <div key={attr.id} className="p-4 hover:bg-slate-50/70 transition space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{attr.name}</h4>
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                          {attr.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{attr.description || `Slug: ${attr.slug}`}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedAttributeForTerms(attr)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          selectedAttributeForTerms?.id === attr.id
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Configure Terms ({attr.terms.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAttrForm({
                          id: attr.id,
                          name: attr.name,
                          slug: attr.slug,
                          type: attr.type,
                          description: attr.description || '',
                          visibleOnProductPage: attr.visibleOnProductPage
                        })}
                        className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                        title="Edit Attribute"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAttribute(attr.id, attr.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Attribute"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Terms Preview Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {attr.terms.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">No terms configured yet. Click "Configure Terms" to add.</span>
                    ) : (
                      attr.terms.map(t => (
                        <span
                          key={t.id}
                          className="bg-white border border-slate-200 text-slate-800 text-[11px] font-medium px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1"
                        >
                          {t.colorHex && (
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.colorHex }}></span>
                          )}
                          <span>{t.name}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Attribute Terms Inspector Drawer / Card */}
          {selectedAttributeForTerms && (
            <div className="bg-white p-5 rounded-xl border border-teal-300 shadow-md space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-teal-600" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Configure Terms for "{selectedAttributeForTerms.name}"
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Add specific values (e.g. "Alphonso Mango", "300g Jar") available for products to select.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAttributeForTerms(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Add Term Form */}
              <form onSubmit={handleAddTerm} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-wrap items-end gap-3 text-xs">
                <div className="flex-1 min-w-[140px]">
                  <label className="font-bold text-slate-700 block mb-1">New Term Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardamom & Jaggery"
                    value={newTermName}
                    onChange={(e) => setNewTermName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-teal-500 font-medium"
                  />
                </div>

                <div className="w-36">
                  <label className="font-bold text-slate-700 block mb-1">Slug</label>
                  <input
                    type="text"
                    placeholder="cardamom-jaggery"
                    value={newTermSlug}
                    onChange={(e) => setNewTermSlug(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-teal-500 font-mono text-[11px]"
                  />
                </div>

                {selectedAttributeForTerms.type === 'color' && (
                  <div className="w-24">
                    <label className="font-bold text-slate-700 block mb-1">Color</label>
                    <input
                      type="color"
                      value={newTermColor}
                      onChange={(e) => setNewTermColor(e.target.value)}
                      className="w-full h-8 bg-white border border-slate-200 rounded-lg p-1 cursor-pointer"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Term</span>
                </button>
              </form>

              {/* Terms List */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-700">Existing Terms ({selectedAttributeForTerms.terms.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedAttributeForTerms.terms.map(term => (
                    <div key={term.id} className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {term.colorHex && (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs" style={{ backgroundColor: term.colorHex }}></span>
                        )}
                        <div>
                          <strong className="font-bold text-slate-900 block">{term.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">{term.slug}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTerm(term.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Delete Term"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
