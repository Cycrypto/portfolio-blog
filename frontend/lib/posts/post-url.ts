interface PostUrlTarget {
  id: number | string;
  slug?: string | null;
}

export function getPostPath(post: PostUrlTarget): string {
  const postIdentifier =
    post.slug && post.slug !== 'null' ? post.slug : String(post.id);

  return `/blog/${postIdentifier}`;
}
