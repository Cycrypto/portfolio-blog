import { DataSource } from 'typeorm';
import { Post } from '../entity/post.entity';
import { generateSlug } from '../utils/slug-generator';

/**
 * 기존 포스트의 slug를 업데이트하는 스크립트
 * slug가 null인 포스트의 제목에서 slug를 생성합니다.
 */
async function updatePostSlugs() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'blog',
        entities: [Post],
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log('Database connection established');

        const postRepository = dataSource.getRepository(Post);

        // slug가 null인 포스트 찾기
        const postsWithoutSlug = await postRepository
            .createQueryBuilder('post')
            .where('post.slug IS NULL')
            .getMany();

        console.log(`Found ${postsWithoutSlug.length} posts without slug`);

        // 각 포스트의 slug 업데이트
        for (const post of postsWithoutSlug) {
            const slug = generateSlug(post.title);
            post.slug = slug;
            await postRepository.save(post);
            console.log(`Updated post ${post.id}: "${post.title}" -> slug: "${slug}"`);
        }

        console.log('All posts updated successfully');
    } catch (error) {
        console.error('Error updating post slugs:', error);
        throw error;
    } finally {
        await dataSource.destroy();
    }
}

// 스크립트 실행
updatePostSlugs()
    .then(() => {
        console.log('Script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });