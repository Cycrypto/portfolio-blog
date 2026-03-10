"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Mail, RefreshCw, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchContacts, updateContactRead } from "@/lib/api"
import { ContactResponse } from "@/lib/types/api"
import { toast } from "sonner"
import { AdminShell } from "@/components/admin/AdminShell"

export default function AdminContacts() {
  const [contacts, setContacts] = useState<ContactResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const loadContacts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchContacts()
      setContacts(data)
    } catch (err) {
      console.error("Failed to fetch contacts", err)
      setError("문의 목록을 불러오지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  const filteredContacts = useMemo(() => {
    if (filter === "all") return contacts
    return contacts.filter((c) => c.isRead === (filter === "read"))
  }, [contacts, filter])

  const handleToggleRead = async (contact: ContactResponse, target: boolean) => {
    try {
      setUpdatingId(contact.id)
      const updated = await updateContactRead(contact.id, target)
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? updated : c)))
      toast.success(target ? "읽음 처리했습니다." : "안읽음으로 변경했습니다.")
    } catch (err) {
      console.error("Failed to update contact read state", err)
      toast.error("상태 변경에 실패했습니다.")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <AdminShell
      active="contacts"
      title="문의 메시지"
      description="방문자 메시지 확인 및 읽음 상태 관리"
      actions={
        <Button variant="outline" onClick={loadContacts} disabled={loading} className="border-brand-blue-200">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      }
    >
      <Card className="surface-default shadow-none">
        <CardHeader className="border-b border-brand-blue-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl text-neutral-slate-800">문의 목록</CardTitle>
              <CardDescription>총 {filteredContacts.length}건</CardDescription>
            </div>
            <Select value={filter} onValueChange={(value) => setFilter(value as "all" | "unread" | "read")}>
              <SelectTrigger className="w-full sm:w-36">
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
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-brand-blue-600" />
              <div className="text-neutral-slate-500">불러오는 중...</div>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">{error}</div>
          ) : filteredContacts.length === 0 ? (
            <div className="py-12 text-center">
              <Mail className="mx-auto mb-4 h-14 w-14 text-neutral-slate-300" />
              <p className="text-neutral-slate-500">표시할 메시지가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">상태</TableHead>
                    <TableHead>보낸 사람</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>메시지</TableHead>
                    <TableHead className="w-40">받은 시각</TableHead>
                    <TableHead className="w-32 text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id} className={!contact.isRead ? "bg-brand-blue-50/30" : ""}>
                      <TableCell>
                        {contact.isRead ? (
                          <Badge variant="outline" className="gap-1 text-green-700 border-green-200 bg-green-50">
                            <CheckCircle2 className="h-4 w-4" /> 읽음
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-brand-blue-700 border-brand-blue-500 bg-brand-blue-50">
                            <Mail className="h-4 w-4" /> 새 메시지
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-neutral-slate-800">{contact.name}</div>
                        <div className="text-sm text-neutral-slate-500">{contact.email}</div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate font-medium text-neutral-slate-800">{contact.subject || "제목 없음"}</div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="line-clamp-2 whitespace-pre-line text-sm text-neutral-slate-700">{contact.message}</div>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-slate-600">{new Date(contact.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {contact.isRead ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleRead(contact, false)}
                            disabled={updatingId === contact.id}
                            className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                          >
                            <XCircle className="mr-1 h-4 w-4" /> 안읽음
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleRead(contact, true)}
                            disabled={updatingId === contact.id}
                            className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" /> 읽음 처리
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  )
}
