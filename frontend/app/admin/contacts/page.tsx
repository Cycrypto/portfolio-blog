"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { fetchContacts, updateContactRead } from "@/lib/api"
import { ContactResponse } from "@/lib/types/api"
import { CheckCircle2, Mail, RefreshCw, XCircle } from "lucide-react"
import { toast } from "sonner"

export default function AdminContacts() {
  const [contacts, setContacts] = useState<ContactResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const loadContacts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchContacts()
      setContacts(data)
    } catch (err) {
      console.error('Failed to fetch contacts', err)
      setError('문의 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  const filteredContacts = useMemo(() => {
    if (filter === 'all') return contacts
    return contacts.filter((c) => c.isRead === (filter === 'read'))
  }, [contacts, filter])

  const handleToggleRead = async (contact: ContactResponse, target: boolean) => {
    try {
      setUpdatingId(contact.id)
      const updated = await updateContactRead(contact.id, target)
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? updated : c)))
      toast.success(target ? '읽음 처리했습니다.' : '안읽음으로 변경했습니다.')
    } catch (err) {
      console.error('Failed to update contact read state', err)
      toast.error('상태 변경에 실패했습니다.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      <div className="flex">
        <AdminSidebar active="contacts" />

        <div className="flex-1 p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-700 to-brand-blue-900">
                  문의 메시지
                </h1>
                <p className="text-neutral-slate-600 mt-2 text-lg">방문자가 보낸 메시지를 확인하고 읽음 상태를 관리하세요</p>
              </div>
              <Button
                variant="outline"
                onClick={loadContacts}
                disabled={loading}
                className="border-brand-indigo-500/50 hover:bg-brand-blue-50 hover:border-brand-blue-500"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
            </div>
          </div>

          <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-brand-blue-900">문의 목록</CardTitle>
                  <CardDescription className="text-neutral-slate-600 mt-1">총 {filteredContacts.length}건</CardDescription>
                </div>
                <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
                  <SelectTrigger className="w-32 border-brand-indigo-500/50">
                    <SelectValue placeholder="필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="unread">안읽음</SelectItem>
                    <SelectItem value="read">읽음</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex flex-col justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mb-4"></div>
                  <div className="text-neutral-slate-500">불러오는 중...</div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-12">{error}</div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 mx-auto text-neutral-slate-300 mb-4" />
                  <p className="text-neutral-slate-500 text-lg">표시할 메시지가 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-brand-blue-50/50 border-brand-indigo-500/20">
                        <TableHead className="w-32 font-bold text-brand-blue-900">상태</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">보낸 사람</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">제목</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">메시지</TableHead>
                        <TableHead className="w-40 font-bold text-brand-blue-900">받은 시각</TableHead>
                        <TableHead className="text-right w-32 font-bold text-brand-blue-900">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact) => (
                        <TableRow
                          key={contact.id}
                          className={`hover:bg-brand-blue-50/30 transition-colors border-brand-indigo-500/10 ${
                            !contact.isRead ? 'bg-brand-blue-50/40' : ''
                          }`}
                        >
                          <TableCell>
                            {contact.isRead ? (
                              <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-200 bg-green-50">
                                <CheckCircle2 className="w-4 h-4" /> 읽음
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex items-center gap-1 text-brand-blue-700 border-brand-blue-500 bg-brand-blue-50">
                                <Mail className="w-4 h-4" /> 새 메시지
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-brand-blue-900">{contact.name}</div>
                            <div className="text-sm text-neutral-slate-500">{contact.email}</div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate font-medium text-neutral-slate-800">{contact.subject || '제목 없음'}</div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="text-sm text-neutral-slate-700 line-clamp-2 whitespace-pre-line">{contact.message}</div>
                          </TableCell>
                          <TableCell className="text-sm text-neutral-slate-600">
                            {new Date(contact.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {contact.isRead ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleRead(contact, false)}
                                  disabled={updatingId === contact.id}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 hover:border-orange-300"
                                >
                                  <XCircle className="w-4 h-4 mr-1" /> 안읽음
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleRead(contact, true)}
                                  disabled={updatingId === contact.id}
                                  className="text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200 hover:border-green-300"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" /> 읽음 처리
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
