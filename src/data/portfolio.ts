import type { Intro } from "@/lib/types";

// Public portfolio content. The intro is editable in /admin/intro; the rest
// lives here so wording changes stay reviewable in Git.
export const defaultIntro: Intro = {
  eyebrow: "BACKEND · INFRA · PRODUCT ENGINEER",
  name: "박준하",
  headline: "필요한 기능을 구현하고,\n배포와 운영까지 연결합니다.",
  description:
    "백엔드 개발과 인프라 운영을 중심으로 경험을 쌓아 온 개발자입니다. 사용자에게 필요한 기능을 정의하고, 구현과 운영까지 함께 다루는 Product Engineer를 지향합니다.",
};

export interface FlowColumn {
  label: string;
  title: string;
  items: string[];
}
export interface Project {
  id: string;
  name: string;
  role: string;
  period: string;
  summary: string;
  paragraphs: string[];
  sections: { title: string; body: string }[];
  stack: string[];
  visual:
    | { kind: "flow"; columns: FlowColumn[]; note: string }
    | {
        kind: "pipeline";
        steps: { label: string; detail: string }[];
        metric: { label: string; before: string; after: string; unit: string };
        notes: string[];
      };
}

export const projects: Project[] = [
  {
    id: "coffing",
    name: "커핑",
    role: "팀장 · 서비스 기획",
    period: "SW마에스트로 제17기 · 진행 중",
    summary:
      "카페 탐색 서비스 ‘커핑’의 팀장으로 제품 방향과 개발 요구사항을 구체화하고 있습니다.",
    paragraphs: [
      "사용자가 어떤 상황에서 카페를 찾고, 무엇을 보고 방문을 결정하는지 정리합니다. 이를 바탕으로 검색에서 다룰 범위와 사용자 흐름을 정의하고, 팀이 구현할 화면·기능 요구사항과 개발 우선순위로 연결하고 있습니다.",
    ],
    sections: [],
    stack: [],
    visual: {
      kind: "flow",
      note: "사용자 상황에서 출발해 팀이 구현할 요구사항과 우선순위까지 이어지는 정리 방식의 예시입니다.",
      columns: [
        {
          label: "01 · 방문 상황",
          title: "언제, 왜 카페를 찾는가",
          items: [
            "약속 전에 잠깐 들를 가까운 곳",
            "노트북 작업이 가능한 조용한 자리",
            "주말에 디저트로 고르는 카페",
          ],
        },
        {
          label: "02 · 필요한 정보",
          title: "방문을 결정하게 하는 것",
          items: [
            "현재 위치에서 걸어서 걸리는 시간",
            "좌석·콘센트·소음 같은 머무르기 조건",
            "지금 영업 중인지와 붐비는 시간대",
          ],
        },
        {
          label: "03 · 화면·기능 요구사항",
          title: "팀이 구현할 범위와 순서",
          items: [
            "상황 태그로 시작하는 검색 — P1",
            "목록과 지도 전환, 거리순 정렬 — P1",
            "카페 상세의 머무르기 정보 섹션 — P2",
          ],
        },
      ],
    },
  },
  {
    id: "sandol",
    name: "산돌이",
    role: "백엔드 개발 · 인프라 운영",
    period: "2021.11 – 2024.12",
    summary:
      "학식과 교통 정보를 카카오톡에서 확인할 수 있는 교내 생활정보 서비스입니다. 백엔드 기능 개발부터 서버리스 환경 운영과 배포 자동화까지 담당했습니다.",
    paragraphs: [],
    sections: [
      {
        title: "백엔드 구현",
        body: "Python·Flask로 생활정보를 수집·가공하고 조회하는 기능을 개발했습니다. 학식 정보를 입력·수정하고 사용자 피드백을 받을 수 있는 기능도 구현했습니다.",
      },
      {
        title: "운영·배포 개선",
        body: "AWS Lambda 기반 서비스를 운영하고, AWS SAM으로 배포 체계를 전환하는 작업을 주도했습니다. GitHub Actions와 연결해 코드 변경 사항이 자동으로 배포되도록 구성하고, 배포 시간을 약 15분에서 3분으로 줄였습니다.",
      },
    ],
    stack: ["Python", "Flask", "AWS Lambda", "AWS SAM", "GitHub Actions"],
    visual: {
      kind: "pipeline",
      steps: [
        { label: "GitHub", detail: "코드 변경 push" },
        { label: "GitHub Actions", detail: "테스트 · 빌드" },
        { label: "AWS SAM", detail: "배포 패키징" },
        { label: "AWS Lambda", detail: "Flask 백엔드 실행" },
        { label: "카카오톡", detail: "학식 · 교통 조회" },
      ],
      metric: { label: "배포 시간", before: "15", after: "3", unit: "분" },
      notes: [
        "수동 배포에서 코드 변경이 자동으로 배포되는 흐름으로 전환",
        "서버리스 환경에서 운영 비용과 관리 부담을 함께 축소",
      ],
    },
  },
];

export const skills = [
  "Python",
  "Flask",
  "AWS Lambda",
  "AWS SAM",
  "GitHub Actions",
  "서비스 기획 · 요구사항 정의",
];

export const contact = {
  heading: "함께 일하기",
  description:
    "백엔드와 인프라를 개발하면서, 제품의 문제 정의와 개선에도 함께 참여하고 싶습니다.",
  email: "jh01love00@gmail.com",
  resumeHref: "/resume",
};

export const facts = [
  ["NOW", "커핑 팀장 · SW마에스트로 제17기"],
  ["FOCUS", "백엔드 · 인프라 · 제품 요구사항"],
  ["CONTACT", contact.email],
] as const;
