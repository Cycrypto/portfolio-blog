import { apiRequest } from '../client/base';
import { Post, PostEdit, CreatePostRequest, UpdatePostRequest } from '../../types/api';
import { 
  PostNotFoundException, 
  PostAlreadyExistsException,
  PostCreateException, 
  PostUpdateException, 
  PostDeleteException,
  PostValidationException 
} from '../../posts/exceptions';
import { ApiError } from '../client/base';

export async function getPosts(page: number = 1, pageSize: number = 9): Promise<{ posts: Post[], totalCount: number }> {
  try {
    const result = await apiRequest<{ data: { data: Post[], totalCount: number } }>(
      `/posts?page=${page}&pageSize=${pageSize}`,
      { requireAuth: false }
    );
    
    return {
      posts: result.data?.data || [],
      totalCount: result.data?.totalCount || 0
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        throw new PostNotFoundException();
      }
    }
    throw error;
  }
}

export async function createPost(postData: CreatePostRequest): Promise<Post> {
  // 입력 데이터 검증
  if (!postData.title?.trim()) {
    throw new PostValidationException('title', postData.title);
  }
  if (!postData.category?.trim()) {
    throw new PostValidationException('category', postData.category);
  }
  if (!postData.contentType) {
    throw new PostValidationException('contentType', postData.contentType);
  }
  if (postData.contentType === 'tiptap' && !postData.contentJson) {
    throw new PostValidationException('contentJson', postData.contentJson);
  }
  if (postData.contentType === 'markdown' && !postData.contentMarkdown) {
    throw new PostValidationException('contentMarkdown', postData.contentMarkdown);
  }

  try {
    const result = await apiRequest<{ data: Post }>('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
    
    return result.data;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 409) {
        throw new PostAlreadyExistsException(postData.title, postData.slug);
      }
      if (error.status === 400) {
        throw new PostValidationException('data', postData);
      }
    }
    throw new PostCreateException(error instanceof Error ? error : undefined, { postData });
  }
}

export async function getPost(id: string): Promise<Post> {
  try {
    const result = await apiRequest<{ data: Post }>(`/posts/${id}`, { requireAuth: false });
    return result.data;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        throw new PostNotFoundException(id);
      }
    }
    throw error;
  }
}

export async function getPostForEdit(id: string): Promise<PostEdit> {
  try {
    const result = await apiRequest<{ data: PostEdit }>(`/posts/${id}/edit`);
    return result.data;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        throw new PostNotFoundException(id);
      }
    }
    throw error;
  }
}

export async function updatePost(id: string, postData: UpdatePostRequest): Promise<Post> {
  try {
    const result = await apiRequest<{ data: Post }>(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(postData),
    });
    
    return result.data;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        throw new PostNotFoundException(id);
      }
      if (error.status === 400) {
        throw new PostValidationException('data', postData);
      }
    }
    throw new PostUpdateException(id, error instanceof Error ? error : undefined, { postData });
  }
}

export async function deletePost(id: string): Promise<void> {
  try {
    await apiRequest(`/posts/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        throw new PostNotFoundException(id);
      }
    }
    throw new PostDeleteException(id, error instanceof Error ? error : undefined);
  }
}

export async function getTopTags(limit: number = 5): Promise<{ id: number; name: string; usageCount: number }[]> {
  try {
    const result = await apiRequest<{ data: { id: number; name: string; usageCount: number }[] }>(
      `/tags/top?limit=${limit}`
    );
    return result.data || [];
  } catch (error) {
    throw error;
  }
}
