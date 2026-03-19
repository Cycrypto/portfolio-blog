export type PostContentType = 'markdown' | 'tiptap';

export interface PostHeading {
  level: number;
  text: string;
  id: string;
}

export interface LinkedProjectSummary {
  id: number;
  title: string;
  slug?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface LinkedExperienceSummary {
  id: number;
  type: ExperienceType;
  title: string;
  organization: string;
  startDate: string;
  endDate?: string;
}

export interface LinkedPostSummary {
  id: number;
  title: string;
  slug?: string;
  excerpt?: string;
  category?: string;
  publishDate?: string;
  readTime?: number;
  status?: string;
  tags?: string[];
}

export interface Post {
  id: number;
  title: string;
  slug?: string;
  excerpt?: string;
  contentType: PostContentType;
  contentHtml?: string;
  headings?: PostHeading[];
  plainText?: string;
  wordCount?: number;
  image?: string;
  isFeatured: boolean;
  featuredOrder: number;
  tags?: string[];
  status: string;
  author: string;
  category: string;
  publishDate: string;
  views: number;
  likes: number;
  comments: number;
  readTime: number;
  projectId?: number | null;
  project?: LinkedProjectSummary | null;
}

export interface PostEdit {
  id: number;
  title: string;
  slug?: string;
  excerpt?: string;
  contentType: PostContentType;
  contentJson?: Record<string, unknown> | null;
  contentMarkdown?: string | null;
  contentHtml?: string | null;
  image?: string;
  isFeatured: boolean;
  featuredOrder: number;
  tags?: string[];
  status: string;
  author: string;
  category: string;
  publishDate: string;
  readTime: number;
  projectId?: number | null;
  project?: LinkedProjectSummary | null;
}

export interface CreatePostRequest {
  title: string;
  slug?: string;
  excerpt?: string;
  contentType: PostContentType;
  contentJson?: Record<string, unknown>;
  contentMarkdown?: string;
  image?: string;
  isFeatured?: boolean;
  featuredOrder?: number;
  tags?: string[];
  status: string;
  author: string;
  category: string;
  publishDate: string;
  readTime?: number;
  ideaCandidateId?: number;
}

export interface UpdatePostRequest {
  title?: string;
  slug?: string;
  excerpt?: string;
  contentType?: PostContentType;
  contentJson?: Record<string, unknown>;
  contentMarkdown?: string;
  image?: string;
  isFeatured?: boolean;
  featuredOrder?: number;
  tags?: string[];
  status?: string;
  author?: string;
  category?: string;
  publishDate?: string;
  readTime?: number;
}

export type IdeaCandidateStatus = 'open' | 'used';
export type IdeaGeneratorMode = 'fallback' | 'worker';

export interface IdeaCandidate {
  id: number;
  title: string;
  category: string;
  tags: string[];
  keywords: string[];
  evidenceSnippet: string;
  score: number;
  status: IdeaCandidateStatus;
  sourceUrl: string;
  createdAt: string;
  generator: IdeaGeneratorMode;
  continuationBrief?: string | null;
  sourceMessageRefs: number[];
}

export interface ImportIdeaMessage {
  order: number;
  role: 'user' | 'assistant' | 'unknown';
  text: string;
}

export interface ImportChatGptIdeaRequest {
  sourceTitle: string;
  sourceUrl: string;
  extractedAt: string;
  messages: ImportIdeaMessage[];
}

export interface ImportChatGptIdeaResponse {
  importId: number;
  mode: 'worker' | 'fallback';
  deduped: boolean;
  candidates: IdeaCandidate[];
}

export interface AiStatusResponse {
  mode: 'worker' | 'fallback' | 'unavailable';
  assistantAvailable: boolean;
  draftAvailable: boolean;
  workerAvailable: boolean;
  model?: string | null;
  reason?: string | null;
}

export interface AssistantSession {
  sessionId: number;
  starterMessage: string;
}

export interface AssistantReply {
  reply: string;
  suggestions: string[];
  continuationBrief: string;
}

export interface DraftGenerationResponse {
  generationId: number;
  title: string;
  category: string;
  tags: string[];
  markdown: string;
  contentJson: Record<string, unknown>;
}

export interface Comment {
  id: string;
  postId: string | number;
  postTitle?: string;
  postSlug?: string | null;
  content: string;
  authorName: string;
  parentId?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface CreateCommentRequest {
  postId: string;
  parentId?: string;
  content: string;
  authorName: string;
  password: string;
}

export interface UpdateCommentRequest {
  content: string;
  password: string;
}

export interface Tag {
  id: number;
  name: string;
  usageCount: number;
}

export interface Project {
  id: number;
  title: string;
  slug?: string;
  description?: string;
  longDescription?: string;
  category?: string;
  status: string;
  isFeatured: boolean;
  featuredOrder: number;
  progress: number;
  techStack: string[];
  features: string[];
  role?: string;
  problem?: string;
  approach?: string;
  outcomes?: string;
  impactMetrics: string[];
  resumeTitle?: string;
  resumeSummary?: string;
  resumeHighlights: string[];
  startDate?: string;
  endDate?: string;
  githubUrl?: string;
  liveUrl?: string;
  experienceId?: number | null;
  experience?: LinkedExperienceSummary | null;
  images: string[];
  linkedPosts?: LinkedPostSummary[];
}

export interface CreateProjectRequest {
  title: string;
  slug?: string;
  description?: string;
  longDescription?: string;
  category?: string;
  status?: string;
  isFeatured?: boolean;
  featuredOrder?: number;
  progress?: number;
  techStack?: string[];
  features?: string[];
  role?: string;
  problem?: string;
  approach?: string;
  outcomes?: string;
  impactMetrics?: string[];
  resumeTitle?: string;
  resumeSummary?: string;
  resumeHighlights?: string[];
  startDate?: string;
  endDate?: string;
  githubUrl?: string;
  liveUrl?: string;
  experienceId?: number | null;
  images?: string[];
  linkedPostIds?: number[];
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}

export type ExperienceType = 'career' | 'team_project' | 'club'

export interface Experience {
  id: number;
  type: ExperienceType;
  title: string;
  organization: string;
  startDate: string;
  endDate?: string;
  description?: string;
  resumeVisible: boolean;
  resumeOrder: number;
  resumeHighlights: string[];
  linkedProjects?: LinkedProjectSummary[];
}

export interface CreateExperienceRequest {
  type: ExperienceType;
  title: string;
  organization: string;
  startDate: string;
  endDate?: string;
  description?: string;
  resumeVisible?: boolean;
  resumeOrder?: number;
  resumeHighlights?: string[];
  linkedProjectIds?: number[];
}

export interface UpdateExperienceRequest extends Partial<CreateExperienceRequest> {}

export interface ContactRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface ContactResponse {
  id: number;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ResumeSettings {
  id: number;
  name: string;
  title: string;
  headline: string;
  email: string;
  location: string;
  github: string;
  linkedin: string;
  photoUrl: string;
  showPhoto: boolean;
  summaryBullets: string[];
  featuredSkillNames: string[];
  selectedProjectIds: number[];
}

export interface UpdateResumeSettingsRequest {
  name?: string;
  title?: string;
  headline?: string;
  email?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  photoUrl?: string;
  showPhoto?: boolean;
  summaryBullets?: string[];
  featuredSkillNames?: string[];
  selectedProjectIds?: number[];
}
