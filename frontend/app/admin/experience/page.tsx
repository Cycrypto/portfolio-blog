"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { createExperience, deleteExperience, getExperiences, updateExperience } from "@/lib/api"
import { Experience } from "@/lib/types/api"
import { useToast } from "@/hooks/use-toast"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default function AdminExperience() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ title: "", company: "", startDate: "", endDate: "", description: "" })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    try {
      const data = await getExperiences()
      setExperiences(data)
    } catch (e) {
      toast({ title: '로드 실패', description: '경력을 불러오지 못했습니다.', variant: 'destructive' })
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.company.trim() || !form.startDate.trim()) {
      toast({ title: '필수 입력 누락', description: '제목, 회사, 시작일을 입력하세요.', variant: 'destructive' })
      return
    }
    try {
      setLoading(true)
      if (editingId) {
        await updateExperience(editingId.toString(), form)
        toast({ title: '수정 완료', description: '경력이 수정되었습니다.' })
      } else {
        await createExperience(form)
        toast({ title: '등록 완료', description: '경력이 추가되었습니다.' })
      }
      setForm({ title: "", company: "", startDate: "", endDate: "", description: "" })
      setEditingId(null)
      load()
    } catch (e) {
      toast({ title: '저장 실패', description: '경력 저장 중 오류가 발생했습니다.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (exp: Experience) => {
    setEditingId(exp.id)
    setForm({
      title: exp.title || "",
      company: exp.company || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      description: exp.description || "",
    })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await deleteExperience(id.toString())
      toast({ title: '삭제 완료', description: '경력이 삭제되었습니다.' })
      load()
    } catch (e) {
      toast({ title: '삭제 실패', description: '삭제 중 오류가 발생했습니다.', variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      <div className="flex">
        <AdminSidebar active="experience" />

        <div className="flex-1 p-8 space-y-8">
          <div className="mb-8">
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-700 to-brand-blue-900">
              경력 관리
            </h1>
            <p className="text-neutral-slate-600 mt-2 text-lg">타임라인에 표시될 경력을 추가/수정/삭제합니다</p>
          </div>

          <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
              <CardTitle className="text-xl font-bold text-brand-blue-900">{editingId ? '경력 수정' : '새 경력 추가'}</CardTitle>
              <CardDescription className="text-neutral-slate-600 mt-1">최신순으로 타임라인에 노출됩니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-brand-blue-900">직책/역할</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border-brand-indigo-500/50" />
                </div>
                <div>
                  <Label htmlFor="company" className="text-brand-blue-900">회사/조직</Label>
                  <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="border-brand-indigo-500/50" />
                </div>
                <div>
                  <Label htmlFor="start" className="text-brand-blue-900">시작일 (YYYY-MM 또는 YYYY-MM-DD)</Label>
                  <Input id="start" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="border-brand-indigo-500/50" />
                </div>
                <div>
                  <Label htmlFor="end" className="text-brand-blue-900">종료일 (현재 재직 중이면 비워두세요)</Label>
                  <Input id="end" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="border-brand-indigo-500/50" />
                </div>
              </div>
              <div>
                <Label htmlFor="desc" className="text-brand-blue-900">설명</Label>
                <Textarea id="desc" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border-brand-indigo-500/50" />
              </div>
              <div className="flex gap-2 justify-end">
                {editingId && (
                  <Button variant="outline" onClick={() => { setEditingId(null); setForm({ title: "", company: "", startDate: "", endDate: "", description: "" }) }} className="border-brand-indigo-500/50 hover:bg-brand-blue-50 hover:border-brand-blue-500">
                    취소
                  </Button>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 hover:from-brand-blue-600 hover:to-brand-blue-900 border-0 shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? '저장 중...' : editingId ? '경력 수정' : '경력 추가'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
              <CardTitle className="text-xl font-bold text-brand-blue-900">경력 목록</CardTitle>
              <CardDescription className="text-neutral-slate-600 mt-1">시작일 기준 최신순</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {(experiences || []).length === 0 ? (
                <div className="text-center py-12">
                  <Plus className="w-16 h-16 mx-auto text-neutral-slate-300 mb-4" />
                  <p className="text-neutral-slate-500 text-lg">등록된 경력이 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-brand-blue-50/50 border-brand-indigo-500/20">
                        <TableHead className="font-bold text-brand-blue-900">직책/역할</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">회사</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">기간</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">설명</TableHead>
                        <TableHead className="text-right font-bold text-brand-blue-900">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(experiences || []).map((exp) => (
                        <TableRow key={exp.id} className="hover:bg-brand-blue-50/30 transition-colors border-brand-indigo-500/10">
                          <TableCell className="font-semibold text-brand-blue-900">{exp.title}</TableCell>
                          <TableCell className="text-neutral-slate-700">{exp.company}</TableCell>
                          <TableCell className="text-sm text-neutral-slate-600">{exp.startDate} - {exp.endDate || '현재'}</TableCell>
                          <TableCell className="max-w-md truncate text-neutral-slate-600">{exp.description}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(exp)}
                                className="border-brand-indigo-500/50 hover:bg-brand-blue-50 hover:border-brand-blue-500"
                              >
                                수정
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(exp.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                삭제
                              </Button>
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
