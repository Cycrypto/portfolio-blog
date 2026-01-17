export type PostContentType = 'markdown' | 'tiptap';

export interface PostHeading {
  level: number;
  text: string;
  id: string;
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
  tags?: string[];
  status: string;
  author: string;
  category: string;
  publishDate: string;
  views: number;
  comments: number;
  readTime: number;
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
  tags?: string[];
  status: string;
  author: string;
  category: string;
  publishDate: string;
  readTime: number;
}

export interface CreatePostRequest {
  title: string;
  slug?: string;
  excerpt?: string;
  contentType: PostContentType;
  contentJson?: Record<string, unknown>;
  contentMarkdown?: string;
  image?: string;
  tags?: string[];
  status: string;
  author: string;
  category: string;
  publishDate: string;
  readTime?: number;
}

export interface UpdatePostRequest {
  title?: string;
  slug?: string;
  excerpt?: string;
  contentType?: PostContentType;
  contentJson?: Record<string, unknown>;
  contentMarkdown?: string;
  image?: string;
  tags?: string[];
  status?: string;
  author?: string;
  category?: string;
  publishDate?: string;
  readTime?: number;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorName: string;
  authorEmail: string;
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
  authorEmail: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface Tag {
  id: number;
  name: string;
  usageCount: number;
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  longDescription?: string;
  category?: string;
  status: string;
  progress: number;
  techStack: string[];
  features: string[];
  startDate?: string;
  endDate?: string;
  githubUrl?: string;
  liveUrl?: string;
  images: string[];
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  longDescription?: string;
  category?: string;
  status?: string;
  progress?: number;
  techStack?: string[];
  features?: string[];
  startDate?: string;
  endDate?: string;
  githubUrl?: string;
  liveUrl?: string;
  images?: string[];
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}

export interface Experience {
  id: number;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface CreateExperienceRequest {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description?: string;
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
