"use client";
import type { ComponentType } from "react";
import {
  Award,
  Briefcase,
  Contact,
  GraduationCap,
  Languages,
  LayoutTemplate,
  Sparkles,
  User,
  UserCircle,
  Wrench,
} from "lucide-react";
import type { HomeContent } from "@/lib/types";
import { sectionIds, type SectionId } from "@/lib/validation";
import {
  Group,
  ItemList,
  Row,
  SelectField,
  TagField,
  TextField,
} from "./fields";
import { ImagePicker } from "./image-picker";
import { skillLevels } from "../portfolio";

export type Mutate = (mutate: (draft: HomeContent) => void) => void;
type FormProps = { value: HomeContent; update: Mutate };
export interface AdminSection {
  id: string;
  title: string;
  hint: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  // Content paths this screen owns; used for change and error badges.
  paths: string[];
  // Main-page anchor the live preview scrolls to.
  anchor: string;
  Form: ComponentType<FormProps>;
}
const sectionLabel = (content: HomeContent, id: SectionId) =>
  id === "contact" ? content.contact.label : content[id].label;
const sectionOptions = (content: HomeContent) =>
  sectionIds.map((id) => ({
    value: id,
    label: sectionLabel(content, id) || id,
  }));
function TitleField({
  path,
  value,
  onChange,
}: {
  path: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <TextField
      path={path}
      label="영역 제목"
      value={value}
      onChange={onChange}
      hint="메인 화면에서 이 영역 위에 표시되는 제목입니다."
      maxLength={100}
    />
  );
}
function ProfileForm({ value, update }: FormProps) {
  const p = value.intro.profile;
  const set = (patch: Partial<typeof p>) =>
    update((d) => Object.assign(d.intro.profile, patch));
  return (
    <>
      <Group
        title="기본 정보"
        hint="페이지 맨 위 프로필 카드에 표시됩니다. 이름은 브라우저 탭 제목에도 쓰입니다."
      >
        <Row>
          <TextField
            path="intro.profile.name"
            label="이름"
            value={p.name}
            onChange={(name) => set({ name })}
            maxLength={80}
          />
          <TextField
            path="intro.profile.role"
            label="직함"
            value={p.role}
            onChange={(role) => set({ role })}
            placeholder="예: Backend Developer · Product Engineer"
            maxLength={160}
          />
        </Row>
        <TextField
          path="intro.profile.description"
          label="한 줄 소개"
          value={p.description}
          onChange={(description) => set({ description })}
          multiline
          maxLength={600}
        />
        <Row>
          <ImagePicker
            path="intro.profile.avatar"
            label="프로필 사진"
            value={p.avatar}
            onChange={(avatar) => set({ avatar })}
            shape="circle"
            suggest="avatar"
            hint="정사각형 사진이 가장 잘 맞습니다. 비우면 사진 없이 표시됩니다."
          />
          <ImagePicker
            path="intro.profile.signature"
            label="서명 이미지"
            value={p.signature}
            onChange={(signature) => set({ signature })}
            shape="wide"
            suggest="signature"
            hint="카드 오른쪽에 작게 표시됩니다. 비우면 숨겨집니다."
          />
        </Row>
      </Group>
      <Group
        title="프로필 정보"
        hint="이름 아래에 아이콘과 함께 나열되는 짧은 정보입니다. 예: 위치, 경력, 근무 형태."
      >
        <ItemList
          path="intro.profile.facts"
          label="정보"
          items={p.facts}
          onChange={(fn) =>
            update((d) => (d.intro.profile.facts = fn(d.intro.profile.facts)))
          }
          max={6}
          create={() => ({ text: "", icon: "iconBriefcase" })}
          summary={(f) => f.text}
          compact
        >
          {(fact, patch, index) => (
            <>
              <TextField
                path={`intro.profile.facts.${index}.text`}
                label="내용"
                value={fact.text}
                onChange={(text) => patch({ text })}
                maxLength={120}
              />
              <ImagePicker
                path={`intro.profile.facts.${index}.icon`}
                label="아이콘"
                value={fact.icon}
                onChange={(icon) => patch({ icon })}
                shape="icon"
                suggest="icon"
              />
            </>
          )}
        </ItemList>
      </Group>
      <Group
        title="이력서 버튼"
        hint="프로필 카드 하단의 큰 버튼입니다. 링크를 비우면 버튼이 눌리지 않습니다."
      >
        <Row>
          <TextField
            path="intro.profile.downloadCv.label"
            label="버튼 문구"
            value={p.downloadCv.label}
            onChange={(label) =>
              update((d) => (d.intro.profile.downloadCv.label = label))
            }
          />
          <TextField
            path="intro.profile.downloadCv.href"
            label="이력서 링크"
            value={p.downloadCv.href}
            onChange={(href) =>
              update((d) => (d.intro.profile.downloadCv.href = href))
            }
            placeholder="https://… 또는 /파일경로.pdf"
            type="url"
          />
        </Row>
      </Group>
    </>
  );
}
function HeroForm({ value, update }: FormProps) {
  const i = value.intro;
  return (
    <>
      <Group
        title="첫 화면 문구"
        hint="프로필 카드 아래, 방문자가 처음 읽는 큰 제목과 설명입니다."
      >
        <TextField
          path="intro.title"
          label="큰 제목"
          value={i.title}
          onChange={(title) => update((d) => (d.intro.title = title))}
          multiline
          rows={2}
          maxLength={160}
        />
        <TextField
          path="intro.description"
          label="설명"
          value={i.description}
          onChange={(v) => update((d) => (d.intro.description = v))}
          multiline
          maxLength={600}
        />
        <ImagePicker
          path="intro.illustration"
          label="일러스트"
          value={i.illustration}
          onChange={(v) => update((d) => (d.intro.illustration = v))}
          shape="wide"
          suggest="illustration"
          hint="제목 위에 표시되는 그림입니다. 비우면 숨겨집니다."
        />
      </Group>
      <Group
        title="이동 버튼"
        hint="설명 아래의 버튼입니다. 문구를 비우면 버튼이 사라집니다."
      >
        <Row>
          <TextField
            path="intro.cta.label"
            label="버튼 문구"
            value={i.cta.label}
            onChange={(v) => update((d) => (d.intro.cta.label = v))}
          />
          <SelectField
            path="intro.cta.section"
            label="이동할 영역"
            value={i.cta.section}
            onChange={(v) =>
              update((d) => (d.intro.cta.section = v as SectionId))
            }
            options={sectionOptions(value)}
          />
        </Row>
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <ImagePicker
              key={index}
              path={`intro.cta.imageKeys.${index}`}
              label={`버튼 왼쪽 이미지 ${index + 1}`}
              value={i.cta.imageKeys[index] ?? ""}
              onChange={(v) =>
                update((d) => {
                  const keys = [...d.intro.cta.imageKeys];
                  while (keys.length <= index) keys.push("");
                  keys[index] = v;
                  while (keys.length && !keys[keys.length - 1]) keys.pop();
                  d.intro.cta.imageKeys = keys;
                })
              }
              shape="icon"
              suggest="heroMark"
              hint="겹쳐서 표시되는 작은 원형 이미지입니다."
            />
          ))}
        </div>
        <ImagePicker
          path="intro.cta.arrow"
          label="화살표 아이콘"
          value={i.cta.arrow}
          onChange={(v) => update((d) => (d.intro.cta.arrow = v))}
          shape="icon"
          suggest="icon"
        />
      </Group>
    </>
  );
}
function AboutForm({ value, update }: FormProps) {
  const a = value.about;
  return (
    <Group title="소개" hint="자신을 소개하는 문단과 핵심 역량 목록입니다.">
      <TitleField
        path="about.label"
        value={a.label}
        onChange={(v) => update((d) => (d.about.label = v))}
      />
      <TextField
        path="about.description"
        label="소개 글"
        value={a.description}
        onChange={(v) => update((d) => (d.about.description = v))}
        multiline
        rows={6}
        maxLength={2000}
      />
      <TextField
        path="about.keySkillsLabel"
        label="핵심 역량 제목"
        value={a.keySkillsLabel}
        onChange={(v) => update((d) => (d.about.keySkillsLabel = v))}
        placeholder="예: Key skills:"
      />
      <TagField
        path="about.keySkills"
        label="핵심 역량"
        value={a.keySkills}
        onChange={(v) => update((d) => (d.about.keySkills = v))}
        max={20}
      />
    </Group>
  );
}
function ExperienceForm({ value, update }: FormProps) {
  const e = value.experience;
  const setCompanies = (
    fn: (
      list: HomeContent["experience"]["companies"],
    ) => HomeContent["experience"]["companies"],
  ) => update((d) => (d.experience.companies = fn(d.experience.companies)));
  return (
    <Group
      title="경력·활동"
      hint="회사나 단체(동아리, 프로그램, 커뮤니티) 하나에 직무·역할을 여러 개 넣을 수 있습니다. 같은 곳에서 역할이 바뀐 경우 직무를 추가하면 타임라인으로 이어집니다. 항목이 없으면 메인 화면과 메뉴에서 숨겨집니다."
    >
      <TitleField
        path="experience.label"
        value={e.label}
        onChange={(v) => update((d) => (d.experience.label = v))}
      />
      <ItemList
        path="experience.companies"
        label="회사·단체"
        items={e.companies}
        onChange={setCompanies}
        max={12}
        create={() => ({
          name: "",
          logo: "",
          roles: [
            {
              title: "",
              employmentType: "",
              period: "",
              description: "",
              highlights: [],
            },
          ],
        })}
        summary={(c) => [c.name, c.roles[0]?.title].filter(Boolean).join(" · ")}
        emptyHint="아직 경력·활동이 없습니다. 회사나 단체를 먼저 추가한 뒤 직무를 채워 주세요."
      >
        {(company, patch, ci) => (
          <>
            <Row>
              <TextField
                path={`experience.companies.${ci}.name`}
                label="회사·단체 이름"
                value={company.name}
                onChange={(name) => patch({ name })}
                placeholder="예: 소프트웨어 마에스트로"
              />
              <ImagePicker
                path={`experience.companies.${ci}.logo`}
                label="로고"
                value={company.logo}
                onChange={(logo) => patch({ logo })}
                shape="icon"
                suggest="company"
                hint="정사각형 로고. 비우면 로고 없이 표시됩니다."
              />
            </Row>
            <ItemList
              path={`experience.companies.${ci}.roles`}
              label="직무·역할"
              items={company.roles}
              onChange={(fn) =>
                setCompanies((list) =>
                  list.map((c, i) =>
                    i === ci ? { ...c, roles: fn(c.roles) } : c,
                  ),
                )
              }
              max={8}
              create={() => ({
                title: "",
                employmentType: "",
                period: "",
                description: "",
                highlights: [],
              })}
              summary={(r) => [r.title, r.period].filter(Boolean).join(" · ")}
            >
              {(role, patchRole, ri) => (
                <>
                  <TextField
                    path={`experience.companies.${ci}.roles.${ri}.title`}
                    label="직무·역할"
                    value={role.title}
                    onChange={(title) => patchRole({ title })}
                    placeholder="예: Backend Developer"
                    maxLength={160}
                  />
                  <Row>
                    <TextField
                      path={`experience.companies.${ci}.roles.${ri}.employmentType`}
                      label="형태"
                      value={role.employmentType}
                      onChange={(employmentType) =>
                        patchRole({ employmentType })
                      }
                      placeholder="예: 정규직, 인턴, 팀 프로젝트"
                    />
                    <TextField
                      path={`experience.companies.${ci}.roles.${ri}.period`}
                      label="기간"
                      value={role.period}
                      onChange={(period) => patchRole({ period })}
                      placeholder="예: 2025. 04 – 현재"
                    />
                  </Row>
                  <TextField
                    path={`experience.companies.${ci}.roles.${ri}.description`}
                    label="한 문단 설명"
                    value={role.description}
                    onChange={(description) => patchRole({ description })}
                    multiline
                    maxLength={2000}
                  />
                  <TagField
                    path={`experience.companies.${ci}.roles.${ri}.highlights`}
                    label="주요 성과"
                    value={role.highlights}
                    onChange={(highlights) => patchRole({ highlights })}
                    max={12}
                    hint="설명 아래에 글머리 목록으로 표시됩니다. 문장 하나를 쓰고 Enter로 추가합니다."
                    placeholder="성과 한 줄 입력 후 Enter"
                    splitOnComma={false}
                  />
                </>
              )}
            </ItemList>
          </>
        )}
      </ItemList>
    </Group>
  );
}
function EducationForm({ value, update }: FormProps) {
  return (
    <Group
      title="학력"
      hint="항목이 하나도 없으면 메인 화면과 메뉴에서 이 영역이 숨겨집니다."
    >
      <TitleField
        path="education.label"
        value={value.education.label}
        onChange={(v) => update((d) => (d.education.label = v))}
      />
      <ItemList
        path="education.items"
        label="학력"
        items={value.education.items}
        onChange={(fn) =>
          update((d) => (d.education.items = fn(d.education.items)))
        }
        max={12}
        create={() => ({
          degree: "",
          institution: "",
          period: "",
          description: "",
        })}
        summary={(e) => [e.degree, e.institution].filter(Boolean).join(" · ")}
        emptyHint="아직 학력이 없습니다. 위의 추가 버튼으로 시작하세요."
      >
        {(item, patch, index) => (
          <>
            <TextField
              path={`education.items.${index}.degree`}
              label="학위·과정"
              value={item.degree}
              onChange={(degree) => patch({ degree })}
              maxLength={160}
            />
            <Row>
              <TextField
                path={`education.items.${index}.institution`}
                label="학교·기관"
                value={item.institution}
                onChange={(institution) => patch({ institution })}
              />
              <TextField
                path={`education.items.${index}.period`}
                label="기간"
                value={item.period}
                onChange={(period) => patch({ period })}
                placeholder="예: 2018 – 2020"
              />
            </Row>
            <TextField
              path={`education.items.${index}.description`}
              label="설명"
              value={item.description}
              onChange={(description) => patch({ description })}
              multiline
              maxLength={2000}
            />
          </>
        )}
      </ItemList>
    </Group>
  );
}
function CertificationsForm({ value, update }: FormProps) {
  return (
    <Group
      title="자격증"
      hint="항목이 하나도 없으면 메인 화면과 메뉴에서 이 영역이 숨겨집니다."
    >
      <TitleField
        path="certifications.label"
        value={value.certifications.label}
        onChange={(v) => update((d) => (d.certifications.label = v))}
      />
      <ItemList
        path="certifications.items"
        label="자격증"
        items={value.certifications.items}
        onChange={(fn) =>
          update((d) => (d.certifications.items = fn(d.certifications.items)))
        }
        max={16}
        create={() => ({ title: "", issuer: "", issued: "", logo: "" })}
        summary={(c) => [c.title, c.issuer].filter(Boolean).join(" · ")}
        emptyHint="아직 자격증이 없습니다."
      >
        {(item, patch, index) => (
          <>
            <TextField
              path={`certifications.items.${index}.title`}
              label="자격증 이름"
              value={item.title}
              onChange={(title) => patch({ title })}
              maxLength={160}
            />
            <Row>
              <TextField
                path={`certifications.items.${index}.issuer`}
                label="발급 기관"
                value={item.issuer}
                onChange={(issuer) => patch({ issuer })}
              />
              <TextField
                path={`certifications.items.${index}.issued`}
                label="발급일"
                value={item.issued}
                onChange={(issued) => patch({ issued })}
                placeholder="예: 2024. 05"
              />
            </Row>
            <ImagePicker
              path={`certifications.items.${index}.logo`}
              label="기관 로고"
              value={item.logo}
              onChange={(logo) => patch({ logo })}
              suggest="certification"
            />
          </>
        )}
      </ItemList>
    </Group>
  );
}
function SkillsForm({ value, update }: FormProps) {
  const s = value.skills;
  return (
    <>
      <Group
        title="기술"
        hint="역량 태그와 기술 도구 아이콘이 모두 비면 이 영역은 숨겨집니다."
      >
        <TitleField
          path="skills.label"
          value={s.label}
          onChange={(v) => update((d) => (d.skills.label = v))}
        />
        <ItemList
          path="skills.items"
          label="역량 태그"
          items={s.items}
          onChange={(fn) =>
            update((d) => (d.skills.items = fn(d.skills.items)))
          }
          max={30}
          create={() => ({ name: "", level: "" as const })}
          summary={(item) =>
            [item.name, skillLevels[item.level]].filter(Boolean).join(" · ")
          }
          emptyHint="역량 태그가 없습니다. 태그 하나에 이름과 숙련도를 넣어 주세요."
          compact
        >
          {(item, patch, index) => (
            <>
              <TextField
                path={`skills.items.${index}.name`}
                label="이름"
                value={item.name}
                onChange={(name) => patch({ name })}
                placeholder="예: Python & FastAPI"
              />
              <SelectField
                path={`skills.items.${index}.level`}
                label="숙련도"
                value={item.level}
                onChange={(level) =>
                  patch({ level: level as (typeof item)["level"] })
                }
                options={[
                  { value: "", label: "표시 안 함" },
                  { value: "advanced", label: "Advanced" },
                  { value: "intermediate", label: "Intermediate" },
                  { value: "beginner", label: "Beginner" },
                ]}
                hint="태그 옆에 작게 표시됩니다."
              />
            </>
          )}
        </ItemList>
      </Group>
      <Group
        title="기술 도구"
        hint="아이콘만 한 줄로 나열됩니다. 이름은 대체 텍스트로 쓰입니다."
      >
        <TextField
          path="skills.technologiesLabel"
          label="기술 도구 제목"
          value={s.technologiesLabel}
          onChange={(v) => update((d) => (d.skills.technologiesLabel = v))}
          placeholder="예: Technologies & tools:"
        />
        <ItemList
          path="skills.technologies"
          label="기술 도구"
          items={s.technologies}
          onChange={(fn) =>
            update((d) => (d.skills.technologies = fn(d.skills.technologies)))
          }
          max={24}
          create={() => ({ name: "", icon: "" })}
          summary={(t) => t.name}
          compact
        >
          {(tech, patch, index) => (
            <>
              <TextField
                path={`skills.technologies.${index}.name`}
                label="이름"
                value={tech.name}
                onChange={(name) => patch({ name })}
              />
              <ImagePicker
                path={`skills.technologies.${index}.icon`}
                label="아이콘"
                value={tech.icon}
                onChange={(icon) => patch({ icon })}
                shape="icon"
                suggest="tech"
              />
            </>
          )}
        </ItemList>
      </Group>
    </>
  );
}
function LanguagesForm({ value, update }: FormProps) {
  return (
    <Group
      title="언어"
      hint="항목이 하나도 없으면 메인 화면과 메뉴에서 이 영역이 숨겨집니다."
    >
      <TitleField
        path="languages.label"
        value={value.languages.label}
        onChange={(v) => update((d) => (d.languages.label = v))}
      />
      <ItemList
        path="languages.items"
        label="언어"
        items={value.languages.items}
        onChange={(fn) =>
          update((d) => (d.languages.items = fn(d.languages.items)))
        }
        max={12}
        create={() => ({ name: "", proficiency: "", flag: "" })}
        summary={(l) => [l.name, l.proficiency].filter(Boolean).join(" · ")}
        emptyHint="아직 언어가 없습니다."
        compact
      >
        {(item, patch, index) => (
          <>
            <TextField
              path={`languages.items.${index}.name`}
              label="언어"
              value={item.name}
              onChange={(name) => patch({ name })}
            />
            <TextField
              path={`languages.items.${index}.proficiency`}
              label="숙련도"
              value={item.proficiency}
              onChange={(proficiency) => patch({ proficiency })}
              placeholder="예: 업무 가능"
            />
            <ImagePicker
              path={`languages.items.${index}.flag`}
              label="국기"
              value={item.flag}
              onChange={(flag) => patch({ flag })}
              shape="icon"
              suggest="flag"
            />
          </>
        )}
      </ItemList>
    </Group>
  );
}
function ContactForm({ value, update }: FormProps) {
  const c = value.contact;
  return (
    <>
      <Group
        title="연락처 문구"
        hint="페이지 맨 아래 연락처 영역의 제목과 설명입니다."
      >
        <TitleField
          path="contact.label"
          value={c.label}
          onChange={(v) => update((d) => (d.contact.label = v))}
        />
        <TextField
          path="contact.description"
          label="설명"
          value={c.description}
          onChange={(v) => update((d) => (d.contact.description = v))}
          multiline
          rows={2}
          maxLength={600}
        />
        <ImagePicker
          path="contact.illustration"
          label="일러스트"
          value={c.illustration}
          onChange={(v) => update((d) => (d.contact.illustration = v))}
          shape="wide"
          suggest="illustration"
          hint="연락처 영역 아래에 크게 표시됩니다. 비우면 숨겨집니다."
        />
      </Group>
      <Group
        title="연락 수단"
        hint="이메일·전화 카드입니다. 첫 번째 이메일은 프로필 카드의 메일 버튼에도 쓰입니다."
      >
        <ItemList
          path="contact.channels"
          label="연락 수단"
          items={c.channels}
          onChange={(fn) =>
            update((d) => (d.contact.channels = fn(d.contact.channels)))
          }
          max={4}
          create={() => ({
            kind: "email" as const,
            label: "",
            value: "",
            icon: "iconEnvelope",
          })}
          summary={(ch) => [ch.label, ch.value].filter(Boolean).join(" · ")}
          emptyHint="연락 수단이 없으면 방문자가 연락할 방법이 없습니다."
        >
          {(item, patch, index) => (
            <>
              <Row>
                <SelectField
                  path={`contact.channels.${index}.kind`}
                  label="종류"
                  value={item.kind}
                  onChange={(kind) =>
                    patch({
                      kind: kind as "email" | "phone",
                      icon: kind === "phone" ? "iconPhone" : "iconEnvelope",
                    })
                  }
                  options={[
                    { value: "email", label: "이메일" },
                    { value: "phone", label: "전화" },
                  ]}
                />
                <TextField
                  path={`contact.channels.${index}.label`}
                  label="카드 제목"
                  value={item.label}
                  onChange={(label) => patch({ label })}
                  placeholder={
                    item.kind === "email" ? "예: Email Me" : "예: Call Me"
                  }
                />
              </Row>
              <TextField
                path={`contact.channels.${index}.value`}
                label={item.kind === "email" ? "이메일 주소" : "전화번호"}
                value={item.value}
                onChange={(v) => patch({ value: v })}
                type={item.kind === "email" ? "email" : "tel"}
              />
              <ImagePicker
                path={`contact.channels.${index}.icon`}
                label="아이콘"
                value={item.icon}
                onChange={(icon) => patch({ icon })}
                shape="icon"
                suggest="icon"
              />
            </>
          )}
        </ItemList>
      </Group>
      <Group
        title="소셜 링크"
        hint="프로필 카드와 연락처 영역에 아이콘으로 표시됩니다. 링크를 비우면 아이콘만 보입니다."
      >
        <TextField
          path="contact.networkLabel"
          label="소셜 링크 제목"
          value={c.networkLabel}
          onChange={(v) => update((d) => (d.contact.networkLabel = v))}
          placeholder="예: Join my network:"
        />
        <ItemList
          path="contact.networks"
          label="소셜 링크"
          items={c.networks}
          onChange={(fn) =>
            update((d) => (d.contact.networks = fn(d.contact.networks)))
          }
          max={8}
          create={() => ({ name: "", icon: "", href: "" })}
          summary={(n) => n.name}
          compact
        >
          {(item, patch, index) => (
            <>
              <TextField
                path={`contact.networks.${index}.name`}
                label="서비스 이름"
                value={item.name}
                onChange={(name) => patch({ name })}
                placeholder="예: GitHub"
              />
              <TextField
                path={`contact.networks.${index}.href`}
                label="링크"
                value={item.href}
                onChange={(href) => patch({ href })}
                placeholder="https://"
                type="url"
              />
              <ImagePicker
                path={`contact.networks.${index}.icon`}
                label="아이콘"
                value={item.icon}
                onChange={(icon) => patch({ icon })}
                shape="icon"
                suggest="icon"
              />
            </>
          )}
        </ItemList>
      </Group>
    </>
  );
}
function SiteForm({ value, update }: FormProps) {
  const n = value.navigation;
  return (
    <>
      <Group
        title="상단 메뉴"
        hint="화면 위에 고정되는 메뉴입니다. 숨겨진 영역으로 가는 항목은 자동으로 보이지 않습니다."
      >
        <ImagePicker
          path="navigation.logo"
          label="로고"
          value={n.logo}
          onChange={(v) => update((d) => (d.navigation.logo = v))}
          shape="icon"
          suggest="icon"
        />
        <ItemList
          path="navigation.items"
          label="메뉴 항목"
          items={n.items}
          onChange={(fn) =>
            update((d) => (d.navigation.items = fn(d.navigation.items)))
          }
          max={8}
          create={() => ({ label: "", section: "about" as SectionId })}
          summary={(item) => item.label}
          compact
        >
          {(item, patch, index) => (
            <>
              <TextField
                path={`navigation.items.${index}.label`}
                label="메뉴 이름"
                value={item.label}
                onChange={(label) => patch({ label })}
              />
              <SelectField
                path={`navigation.items.${index}.section`}
                label="이동할 영역"
                value={item.section}
                onChange={(section) => patch({ section: section as SectionId })}
                options={sectionOptions(value)}
              />
            </>
          )}
        </ItemList>
        <Row>
          <TextField
            path="navigation.contact.label"
            label="연락 버튼 문구"
            value={n.contact.label}
            onChange={(v) => update((d) => (d.navigation.contact.label = v))}
          />
          <ImagePicker
            path="navigation.contact.icon"
            label="연락 버튼 아이콘"
            value={n.contact.icon}
            onChange={(v) => update((d) => (d.navigation.contact.icon = v))}
            shape="icon"
            suggest="icon"
          />
        </Row>
      </Group>
      <Group title="푸터" hint="페이지 맨 아래 한 줄입니다.">
        <Row>
          <TextField
            path="footer.copyright"
            label="저작권 문구"
            value={value.footer.copyright}
            onChange={(v) => update((d) => (d.footer.copyright = v))}
            placeholder="예: © 2026 박준하"
          />
          <TextField
            path="footer.backToTop.label"
            label="맨 위로 버튼 문구"
            value={value.footer.backToTop.label}
            onChange={(v) => update((d) => (d.footer.backToTop.label = v))}
          />
        </Row>
      </Group>
    </>
  );
}
export const adminSections: AdminSection[] = [
  {
    id: "profile",
    title: "프로필 카드",
    hint: "이름, 직함, 사진, 이력서 버튼",
    icon: UserCircle,
    paths: ["intro.profile"],
    anchor: "top",
    Form: ProfileForm,
  },
  {
    id: "hero",
    title: "첫 화면",
    hint: "큰 제목, 설명, 이동 버튼",
    icon: Sparkles,
    paths: [
      "intro.title",
      "intro.description",
      "intro.illustration",
      "intro.cta",
    ],
    anchor: "intro",
    Form: HeroForm,
  },
  {
    id: "about",
    title: "소개",
    hint: "소개 글과 핵심 역량",
    icon: User,
    paths: ["about"],
    anchor: "about",
    Form: AboutForm,
  },
  {
    id: "experience",
    title: "경력·활동",
    hint: "회사·단체별 직무와 성과",
    icon: Briefcase,
    paths: ["experience"],
    anchor: "experience",
    Form: ExperienceForm,
  },
  {
    id: "education",
    title: "학력",
    hint: "학위·과정 목록",
    icon: GraduationCap,
    paths: ["education"],
    anchor: "education",
    Form: EducationForm,
  },
  {
    id: "certifications",
    title: "자격증",
    hint: "자격증과 발급 기관",
    icon: Award,
    paths: ["certifications"],
    anchor: "certifications",
    Form: CertificationsForm,
  },
  {
    id: "skills",
    title: "기술",
    hint: "역량 태그와 기술 도구 아이콘",
    icon: Wrench,
    paths: ["skills"],
    anchor: "skills",
    Form: SkillsForm,
  },
  {
    id: "languages",
    title: "언어",
    hint: "언어와 숙련도",
    icon: Languages,
    paths: ["languages"],
    anchor: "languages",
    Form: LanguagesForm,
  },
  {
    id: "contact",
    title: "연락처",
    hint: "이메일·전화, 소셜 링크",
    icon: Contact,
    paths: ["contact"],
    anchor: "contact",
    Form: ContactForm,
  },
  {
    id: "site",
    title: "메뉴·푸터",
    hint: "상단 메뉴, 로고, 저작권",
    icon: LayoutTemplate,
    paths: ["navigation", "footer"],
    anchor: "top",
    Form: SiteForm,
  },
];
