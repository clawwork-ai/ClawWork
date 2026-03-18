import { create } from 'zustand';
import type { Artifact } from '@clawwork/shared';

const EMPTY_ARTIFACTS: Artifact[] = [];
export { EMPTY_ARTIFACTS };

type SortBy = 'date' | 'name' | 'type';

export interface ArtifactSearchResult {
  id: string;
  taskId: string;
  name: string;
  type: string;
  localPath: string;
  mimeType: string;
  size: number;
  createdAt: string;
  gitSha: string;
  filePath: string;
  messageId: string;
  contentSnippet?: string;
}

interface FileState {
  artifacts: Artifact[];
  filterTaskId: string | null;
  sortBy: SortBy;
  selectedArtifactId: string | null;
  searchQuery: string;
  searchResults: ArtifactSearchResult[] | null;
  isSearching: boolean;

  setArtifacts: (artifacts: Artifact[]) => void;
  addArtifact: (artifact: Artifact) => void;
  addArtifactIfNew: (artifact: Artifact) => void;
  setFilterTaskId: (taskId: string | null) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSelectedArtifact: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: ArtifactSearchResult[] | null) => void;
  setIsSearching: (v: boolean) => void;
}

export const useFileStore = create<FileState>((set) => ({
  artifacts: [],
  filterTaskId: null,
  sortBy: 'date',
  selectedArtifactId: null,
  searchQuery: '',
  searchResults: null,
  isSearching: false,

  setArtifacts: (artifacts) => set({ artifacts }),

  addArtifact: (artifact) => set((s) => ({ artifacts: [artifact, ...s.artifacts] })),

  addArtifactIfNew: (artifact) =>
    set((s) => {
      if (s.artifacts.some((a) => a.id === artifact.id)) return s;
      return { artifacts: [artifact, ...s.artifacts] };
    }),

  setFilterTaskId: (taskId) => set({ filterTaskId: taskId }),

  setSortBy: (sortBy) => set({ sortBy }),

  setSelectedArtifact: (id) => set({ selectedArtifactId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSearchResults: (results) => set({ searchResults: results }),

  setIsSearching: (v) => set({ isSearching: v }),
}));
