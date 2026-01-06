import {
    Controller,
    Get,
    Post as HttpPost,
    Body,
    Param,
    NotFoundException,
    Patch,
    Delete,
    Query,
    UseGuards
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from "../service/posts.service";
import { PostResponseDTO } from "../dto/response/post-response.dto";
import { PostListResponseDTO } from "../dto/response/post-list-response.dto";
import { Post } from "../entity/post.entity";
import { CreatePostRequestDTO } from "../dto/request/create-post-request.dto";
import { UpdatePostRequestDTO } from "../dto/request/update-post-request.dto";
import { Roles } from "../../auth/decorator/auth-role.decorator";
import { JwtRoleGuard } from "../../auth/common/jwt-role.guard";
import { PostEditResponseDTO } from "../dto/response/post-edit-response.dto";

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Get()
    @ApiOperation({ summary: '포스트 목록 조회', description: '키워드, 태그, 페이지네이션을 이용해 포스트 목록을 조회합니다.' })
    @ApiQuery({ name: 'keyword', required: false, description: '검색할 키워드' })
    @ApiQuery({ name: 'tag', required: false, description: '필터링할 태그' })
    @ApiQuery({ name: 'page', required: false, description: '페이지 번호', example: 1 })
    @ApiQuery({ name: 'pageSize', required: false, description: '페이지 당 포스트 수', example: 10 })
    @ApiResponse({ status: 200, description: '성공', type: PostListResponseDTO })
    async getPosts(
        @Query('keyword') keyword: string = '',
        @Query('tags') tag: string = '',
        @Query('page') page: string = '1',
        @Query('pageSize') pageSize: string = '10'
    ): Promise<PostListResponseDTO> {
        const pageNum = parseInt(page);
        const pageSizeNum = parseInt(pageSize);

        const [posts, totalCount] = await Promise.all([
            this.postsService.getPosts(keyword, tag, pageNum, pageSizeNum),
            this.postsService.getPostsCount(keyword, tag)
        ]);

        return {
            data: posts,
            totalCount
        };
    }

    @Get(':id')
    @ApiOperation({ summary: '특정 포스트 상세 조회' })
    @ApiParam({ name: 'id', description: '포스트 ID' })
    @ApiResponse({ status: 200, description: '성공', type: PostResponseDTO })
    @ApiResponse({ status: 404, description: '포스트를 찾을 수 없음' })
    async getDetailPost(@Param('id') id: string): Promise<PostResponseDTO> {
        const post = await this.postsService.getPostById(parseInt(id));
        if (!post) {
            throw new NotFoundException(`Post with id '${id}' not found`);
        }
        return this.toPostResponseDTO(post);
    }

    @Get(':id/edit')
    @ApiBearerAuth('JWT-auth')
    @UseGuards(JwtRoleGuard)
    @Roles('admin')
    @ApiOperation({ summary: '포스트 편집 데이터 조회 (Admin Only)' })
    @ApiParam({ name: 'id', description: '포스트 ID' })
    @ApiResponse({ status: 200, description: '성공', type: PostEditResponseDTO })
    async getPostForEdit(@Param('id') id: string): Promise<PostEditResponseDTO> {
        const post = await this.postsService.getPostById(parseInt(id));
        if (!post) {
            throw new NotFoundException(`Post with id '${id}' not found`);
        }
        return this.toPostEditResponseDTO(post);
    }

    @HttpPost()
    @ApiBearerAuth('JWT-auth')
    @UseGuards(JwtRoleGuard)
    @Roles('admin')
    @ApiOperation({ summary: '새 포스트 생성 (Admin Only)', description: '새로운 포스트를 생성합니다. 관리자 권한이 필요합니다.' })
    @ApiBody({ type: CreatePostRequestDTO })
    @ApiResponse({ status: 201, description: '성공적으로 생성됨', type: PostResponseDTO })
    @ApiResponse({ status: 401, description: '인증 실패' })
    @ApiResponse({ status: 403, description: '접근 권한이 없습니다.' })
    async createPost(@Body() createPostDTO: CreatePostRequestDTO) {
        const post = await this.postsService.createPost(createPostDTO)
        return this.toPostResponseDTO(post);
    }

    @Patch(':id')
    @ApiBearerAuth('JWT-auth')
    @UseGuards(JwtRoleGuard)
    @Roles('admin')
    @ApiOperation({ summary: '포스트 수정 (Admin Only)', description: '기존 포스트를 수정합니다. 관리자 권한이 필요합니다.' })
    @ApiParam({ name: 'id', description: '수정할 포스트 ID' })
    @ApiBody({ type: UpdatePostRequestDTO })
    @ApiResponse({ status: 200, description: '성공적으로 수정됨', type: PostResponseDTO })
    @ApiResponse({ status: 403, description: '접근 권한이 없습니다.' })
    @ApiResponse({ status: 404, description: '포스트를 찾을 수 없음' })
    async updatePost(
        @Param('id') id: string,
        @Body() updatePostDTO: UpdatePostRequestDTO
    ): Promise<PostResponseDTO> {
        const post = await this.postsService.updatePost(parseInt(id), updatePostDTO);
        if (!post) {
            throw new NotFoundException(`Post with id '${id}' not found`);
        }
        return this.toPostResponseDTO(post)
    }

    @Delete(':id')
    @ApiBearerAuth('JWT-auth')
    @UseGuards(JwtRoleGuard)
    @Roles('admin')
    @ApiOperation({ summary: '포스트 삭제 (Admin Only)', description: '포스트를 삭제합니다. 관리자 권한이 필요합니다.' })
    @ApiParam({ name: 'id', description: '삭제할 포스트 ID' })
    @ApiResponse({ status: 200, description: '성공적으로 삭제됨' })
    @ApiResponse({ status: 403, description: '접근 권한이 없습니다.' })
    @ApiResponse({ status: 404, description: '포스트를 찾을 수 없음' })
    async deletePost(@Param('id') id: string): Promise<{ message: string }> {
        const result = await this.postsService.deletePost(parseInt(id));
        if (!result) {
            throw new NotFoundException(`Post with id '${id}' not found`);
        }
        return { message: `Post with id '${id}' successfully deleted` };
    }


    private toPostResponseDTO(post: Post): PostResponseDTO {
        const postResponseDTO = new PostResponseDTO();
        postResponseDTO.id = post.id;
        postResponseDTO.title = post.title;
        postResponseDTO.slug = post.slug;
        postResponseDTO.excerpt = post.excerpt;
        postResponseDTO.contentType = post.contentType;
        postResponseDTO.contentHtml = post.contentHtml ?? undefined;
        postResponseDTO.plainText = post.plainText ?? undefined;
        postResponseDTO.headings = post.headings || [];
        postResponseDTO.wordCount = post.wordCount ?? undefined;
        postResponseDTO.image = post.image;
        postResponseDTO.tags = post.tags ? post.tags.map(tag => tag.name) : [];
        postResponseDTO.status = post.status;
        postResponseDTO.author = post.author;
        postResponseDTO.category = post.category;
        postResponseDTO.publishDate = post.publishDate;
        postResponseDTO.views = post.views;
        postResponseDTO.comments = post.comments;
        postResponseDTO.readTime = post.readTime;

        return postResponseDTO;
    }

    private toPostEditResponseDTO(post: Post): PostEditResponseDTO {
        const postEditResponseDTO = new PostEditResponseDTO();
        postEditResponseDTO.id = post.id;
        postEditResponseDTO.title = post.title;
        postEditResponseDTO.slug = post.slug;
        postEditResponseDTO.excerpt = post.excerpt;
        postEditResponseDTO.contentType = post.contentType;
        postEditResponseDTO.contentJson = post.contentJson;
        postEditResponseDTO.contentMarkdown = post.contentMarkdown;
        postEditResponseDTO.contentHtml = post.contentHtml;
        postEditResponseDTO.image = post.image;
        postEditResponseDTO.tags = post.tags ? post.tags.map(tag => tag.name) : [];
        postEditResponseDTO.status = post.status;
        postEditResponseDTO.author = post.author;
        postEditResponseDTO.category = post.category;
        postEditResponseDTO.publishDate = post.publishDate;
        postEditResponseDTO.readTime = post.readTime;

        return postEditResponseDTO;
    }
}
