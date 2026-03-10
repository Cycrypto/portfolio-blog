"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { createExperience, deleteExperience, getExperiences, updateExperience } from "@/lib/api"
import { Experience } from "@/lib/types/api"
import { useToast } from "@/hooks/use-toast"
import { AdminShell } from "@/components/admin/AdminShell"

export default function AdminExperience() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ title: "", company: "", startDate: "", endDate: "", description: "" })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const resetForm = () => {
    setEditingId(null)
    setForm({ title: "", company: "", startDate: "", endDate: "", description: "" })
  }

  const load = async () => {
    try {
      const data = await getExperiences()
      setExperiences(data)
    } catch {
      toast({ title: "로드 실패", description: "경력을 불러오지 못했습니다.", variant: "destructive" })
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.company.trim() || !form.startDate.trim()) {
      toast({ title: "필수 입력 누락", description: "직책, 회사, 시작일을 입력하세요.", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      if (editingId) {
        await updateExperience(editingId.toString(), form)
        toast({ title: "수정 완료", description: "경력이 수정되었습니다." })
      } else {
        await createExperience(form)
        toast({ title: "등록 완료", description: "경력이 추가되었습니다." })
      }
      resetForm()
      load()
    } catch {
      toast({ title: "저장 실패", description: "경력 저장 중 오류가 발생했습니다.", variant: "destructive" })
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
    if (!confirm("삭제하시겠습니까?")) return
    try {
      await deleteExperience(id.toString())
      toast({ title: "삭제 완료", description: "경력이 삭제되었습니다." })
      load()
    } catch {
      toast({ title: "삭제 실패", description: "삭제 중 오류가 발생했습니다.", variant: "destructive" })
    }
  }

  return (
    <AdminShell active="experience" title="경력 관리" description="타임라인에 노출될 경력 정보를 관리합니다">
      <div className="space-y-6">
        <Card className="surface-default shadow-none">
          <CardHeader className="border-b border-brand-blue-100">
            <CardTitle className="text-xl text-neutral-slate-800">{editingId ? "경력 수정" : "새 경력 추가"}</CardTitle>
            <CardDescription>최신순으로 타임라인에 노출됩니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="title">직책/역할</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="company">회사/조직</Label>
                <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="start">시작일 (YYYY-MM 또는 YYYY-MM-DD)</Label>
                <Input id="start" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="end">종료일 (재직 중이면 비워두세요)</Label>
                <Input id="end" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="desc">설명</Label>
              <Textarea id="desc" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              {editingId && (
                <Button variant="outline" onClick={resetForm}>
                  취소
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={loading} className="bg-brand-blue-600 text-white hover:bg-brand-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                {loading ? "저장 중..." : editingId ? "경력 수정" : "경력 추가"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-default shadow-none">
          <CardHeader className="border-b border-brand-blue-100">
            <CardTitle className="text-xl text-neutral-slate-800">경력 목록</CardTitle>
            <CardDescription>시작일 기준 최신순</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {experiences.length === 0 ? (
              <div className="py-12 text-center text-neutral-slate-500">등록된 경력이 없습니다</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>직책/역할</TableHead>
                      <TableHead>회사</TableHead>
                      <TableHead>기간</TableHead>
                      <TableHead>설명</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {experiences.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="font-semibold text-neutral-slate-800">{exp.title}</TableCell>
                        <TableCell className="text-neutral-slate-700">{exp.company}</TableCell>
                        <TableCell className="text-sm text-neutral-slate-600">
                          {exp.startDate} - {exp.endDate || "현재"}
                        </TableCell>
                        <TableCell className="max-w-md truncate text-neutral-slate-600">{exp.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(exp)}>
                              수정
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(exp.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
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
    </AdminShell>
  )
}
