import { apiRequest, type ApiDataResponse, unwrapApiResponseData } from '../client/base'
import { ContactRequest, ContactResponse } from '../../types/api'

export async function submitContact(contact: ContactRequest): Promise<ContactResponse> {
  const result = await apiRequest<ApiDataResponse<ContactResponse>>(
    '/contact',
    {
      method: 'POST',
      body: JSON.stringify(contact),
      requireAuth: false,
    }
  )

  return unwrapApiResponseData(result)
}

export async function fetchContacts(): Promise<ContactResponse[]> {
  const result = await apiRequest<ApiDataResponse<ContactResponse[]>>(
    '/contact',
    { requireAuth: true, cache: 'no-store' }
  )

  return unwrapApiResponseData(result)
}

export async function updateContactRead(id: number, isRead: boolean): Promise<ContactResponse> {
  const result = await apiRequest<ApiDataResponse<ContactResponse>>(
    `/contact/${id}/read`,
    {
      method: 'PATCH',
      body: JSON.stringify({ isRead }),
    }
  )

  return unwrapApiResponseData(result)
}
