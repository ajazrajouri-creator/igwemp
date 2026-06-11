import React from 'react';
import { useMasterDataCategories, useMasterDataItems } from '../../hooks/queries/useMasterData';
import { useAdminStore } from '../../core/admin/useAdminStore';
import { Plus, Database, ChevronRight } from 'lucide-react';

export function AdminMasterDataPage() {
  const { data: categories, isLoading: loadingCats } = useMasterDataCategories();
  
  const activeCategoryId = useAdminStore((s) => s.activeMasterDataCategoryId);
  const setActiveCategoryId = useAdminStore((s) => s.setActiveMasterDataCategoryId);
  
  // Find the active category code based on ID
  const activeCategory = categories?.find(c => c.id === activeCategoryId);
  
  // Set default selection if none selected
  React.useEffect(() => {
    if (!activeCategoryId && categories && categories.length > 0) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId, setActiveCategoryId]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Master Data Engine</h1>
          <p className="text-sm text-ink-muted">Hybrid reference data configuration.</p>
        </div>
        <button className="btn-primary btn-sm">
          <Plus size={16} /> New Category
        </button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Categories Sidebar */}
        <div className="w-1/3 card p-0 overflow-y-auto border-surface-4 flex flex-col">
          <div className="p-4 border-b border-surface-4 bg-surface-2 sticky top-0">
            <h3 className="font-semibold text-sm text-ink-primary">Categories</h3>
          </div>
          <div className="flex-1 p-2 space-y-1">
            {loadingCats && <div className="p-4 text-ink-muted text-sm">Loading...</div>}
            {categories?.map((cat) => {
              const isActive = cat.id === activeCategoryId;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-colors text-left ${
                    isActive 
                      ? 'bg-brand/10 border border-brand/30 text-brand' 
                      : 'hover:bg-surface-3 text-ink-secondary border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Database size={16} className={isActive ? 'text-brand' : 'text-ink-disabled'} />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <ChevronRight size={16} className={isActive ? 'opacity-100' : 'opacity-0'} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Items Pane */}
        <div className="w-2/3 card p-0 flex flex-col border-surface-4 overflow-hidden">
          {activeCategory ? (
            <MasterDataItemsPane category={activeCategory} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-ink-muted">
              Select a category to view items
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MasterDataItemsPane({ category }: { category: { id: string, code: string, name: string } }) {
  const { data: items, isLoading } = useMasterDataItems(category.code);

  return (
    <>
      <div className="p-4 border-b border-surface-4 bg-surface-2 flex items-center justify-between sticky top-0">
        <div>
          <h3 className="font-semibold text-sm text-ink-primary">{category.name}</h3>
          <p className="text-xs text-ink-muted font-mono">{category.code}</p>
        </div>
        <button className="btn-primary btn-sm h-8">
          <Plus size={14} /> Add Item
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-ink-muted">Loading items...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-0 border-b border-surface-4 text-ink-secondary sticky top-0">
              <tr>
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-4">
              {items?.map((item) => (
                <tr key={item.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-ink-secondary">{item.code}</td>
                  <td className="px-6 py-3 font-medium text-ink-primary">{item.name}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.is_active ? 'bg-green-500/10 text-green-500' : 'bg-surface-4 text-ink-muted'
                    }`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button className="text-brand hover:text-brand-light text-xs font-medium">Edit</button>
                  </td>
                </tr>
              ))}
              {(!items || items.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-ink-muted border border-dashed border-surface-4 m-4 rounded-lg">
                    No items configured for {category.name}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
