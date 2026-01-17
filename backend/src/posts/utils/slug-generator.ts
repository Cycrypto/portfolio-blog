/**
 * 제목에서 URL-safe slug를 생성합니다.
 * 한글, 영문, 숫자를 하이픈으로 연결된 소문자 문자열로 변환합니다.
 */
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        // 한글, 영문, 숫자가 아닌 문자를 하이픈으로 변환
        .replace(/[^\w\s가-힣-]/g, '-')
        // 공백을 하이픈으로 변환
        .replace(/\s+/g, '-')
        // 연속된 하이픈을 하나로 변환
        .replace(/-+/g, '-')
        // 앞뒤 하이픈 제거
        .replace(/^-+|-+$/g, '');
}
