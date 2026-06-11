import { create } from 'zustand';

interface AdminStoreState {
  // Master Data
  activeMasterDataCategoryId: string | null;
  setActiveMasterDataCategoryId: (id: string | null) => void;

  // Offices & Hierarchy
  selectedOfficeId: string | null;
  setSelectedOfficeId: (id: string | null) => void;
  selectedHierarchyLevelId: string | null;
  setSelectedHierarchyLevelId: (id: string | null) => void;

  // Sections
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
}

export const useAdminStore = create<AdminStoreState>((set) => ({
  activeMasterDataCategoryId: null,
  setActiveMasterDataCategoryId: (id) => set({ activeMasterDataCategoryId: id }),

  selectedOfficeId: null,
  setSelectedOfficeId: (id) => set({ selectedOfficeId: id }),
  
  selectedHierarchyLevelId: null,
  setSelectedHierarchyLevelId: (id) => set({ selectedHierarchyLevelId: id }),

  selectedSectionId: null,
  setSelectedSectionId: (id) => set({ selectedSectionId: id }),
}));
