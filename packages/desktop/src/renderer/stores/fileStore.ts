import { create } from 'zustand';
import type { Artifact } from '@clawwork/shared';
import type { ArtifactKindFilter } from '@/lib/artifact-labels';

export interface ArtifactSearchResult {
  id: string;
  taskId: string;
  name: string;
  type: Artifact['type'];
  localPath: string;
  mimeType: string;
  size: number;
  createdAt: string;
  filePath: string;
  messageId: string;
  contentSnippet?: string;
}

interface FileState {
  artifacts: Artifact[];
  selectedArtifactId: string | null;
  searchQuery: string;
  searchResults: ArtifactSearchResult[] | null;
  isSearching: boolean;
  typeFilter: ArtifactKindFilter;

  setArtifacts: (artifacts: Artifact[]) => void;
  addArtifact: (artifact: Artifact) => void;
  addArtifactIfNew: (artifact: Artifact) => void;
  setSelectedArtifact: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: ArtifactSearchResult[] | null) => void;
  setIsSearching: (v: boolean) => void;
  setTypeFilter: (filter: ArtifactKindFilter) => void;
}

export const useFileStore = create<FileState>((set) => ({
  artifacts: [],
  selectedArtifactId: null,
  searchQuery: '',
  searchResults: null,
  isSearching: false,
  typeFilter: 'all',

  setArtifacts: (artifacts) => set({ artifacts }),

  addArtifact: (artifact) => set((s) => ({ artifacts: [artifact, ...s.artifacts] })),

  addArtifactIfNew: (artifact) =>
    set((s) => {
      if (s.artifacts.some((a) => a.id === artifact.id)) return s;
      return { artifacts: [artifact, ...s.artifacts] };
    }),

  setSelectedArtifact: (id) => set({ selectedArtifactId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSearchResults: (results) => set({ searchResults: results }),

  setIsSearching: (v) => set({ isSearching: v }),

  setTypeFilter: (filter) => set({ typeFilter: filter }),
}));
