import { apiRequest } from '../client/base'
import { ContactRequest, ContactResponse } from '../../types/api'

export async function submitContact(contact: ContactRequest): Promise<ContactResponse> {
  const result = await apiRequest<{ data: ContactResponse } | { data: { data: ContactResponse } }>(
    '/contact',
    {
      method: 'POST',
      body: JSON.stringify(contact),
      requireAuth: false,
    }
  )

  return (result as any)?.data?.data || (result as any)?.data || (result as any)
}

export async function fetchContacts(): Promise<ContactResponse[]> {
  const result = await apiRequest<{ data: ContactResponse[] } | { data: { data: ContactResponse[] } }>(
    '/contact',
    { requireAuth: true, cache: 'no-store' }
  )

  return (result as any)?.data?.data || (result as any)?.data || (result as any)
}

export async function updateContactRead(id: number, isRead: boolean): Promise<ContactResponse> {
  const result = await apiRequest<{ data: ContactResponse } | { data: { data: ContactResponse } }>(
    `/contact/${id}/read`,
    {
      method: 'PATCH',
      body: JSON.stringify({ isRead }),
    }
  )

  return (result as any)?.data?.data || (result as any)?.data || (result as any)
}
