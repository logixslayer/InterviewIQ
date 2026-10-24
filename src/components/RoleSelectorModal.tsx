import React, { useState, useMemo } from 'react';
import { ROLE_CATEGORIES } from '../data/taxonomy';

interface RoleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRole: string;
  onSelectRole: (roleTitle: string) => void;
}

export const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedRole,
  onSelectRole,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ROLE_CATEGORIES.map(category => {
      // Filter roles within category
      const matchingRoles = category.roles.filter(role => {
        if (!q) return true;
        return (
          role.title.toLowerCase().includes(q) ||
          role.description.toLowerCase().includes(q) ||
          category.name.toLowerCase().includes(q)
        );
      });

      return {
        ...category,
        roles: matchingRoles,
      };
    }).filter(cat => {
      if (selectedCategory !== 'all' && cat.id !== selectedCategory) return false;
      return cat.roles.length > 0;
    });
  }, [search, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Engineering Roles Taxonomy
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Select Your Target Interview Role
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Currently active: <strong className="text-primary font-bold">{selectedRole}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 space-y-3">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by role name or technology (e.g. React Developer, Cloud Security, SRE)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all shadow-2xs"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-medium cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Categories
            </button>
            {ROLE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Roles Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-slate-50/30">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">No roles match "{search}"</p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                }}
                className="mt-3 px-3 py-1.5 text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredCategories.map(category => (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {category.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    ({category.roles.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {category.roles.map(role => {
                    const isSelected = selectedRole.toLowerCase() === role.title.toLowerCase();

                    return (
                      <div
                        key={role.id}
                        onClick={() => {
                          onSelectRole(role.title);
                          onClose();
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-50 border-primary text-primary shadow-xs ring-1 ring-primary'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-bold tracking-tight ${isSelected ? 'text-primary' : 'text-slate-900'}`}>
                              {role.title}
                            </span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {role.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
