import { TokenManager } from '../../auth/token-manager'

export async function uploadMedia(file: File): Promise<string> {
  const authHeader = TokenManager.getAuthorizationHeader()

  if (!authHeader) {
    throw new Error('로그인이 필요합니다. 먼저 로그인해주세요.')
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/media/upload`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
    },
    body: formData,
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.')
    }
    throw new Error('업로드에 실패했습니다.')
  }

  const result = await response.json()
  return result?.data?.url || result?.url
}
