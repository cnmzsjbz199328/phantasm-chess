export interface CastMember {
  role: string;
  name: string;
}

export interface SceneMeta {
  title: string;
  subtitle?: string;
  description: string[];
  cast: CastMember[];
  director?: string;
  writer?: string;
  tools?: string[];
  nextEpisode?: string;
  commentarySegments?: number;
}
