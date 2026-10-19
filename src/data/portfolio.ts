import type { HomeContent } from "@/lib/types";

// Content and artwork from the open Pencil frame VGODU (rowland.framer.website).
export const defaultHome: HomeContent = {
  navigation: {
    logo: "iconUserCircle",
    items: [
      {
        label: "About",
        section: "about",
      },
      {
        label: "Education",
        section: "education",
      },
      {
        label: "Skills",
        section: "skills",
      },
    ],
    contact: {
      label: "Contact Me",
      icon: "iconChatCircle",
    },
  },
  intro: {
    title: "Full Stack Developer",
    description:
      "Building scalable web applications with clean architecture, modern tools, and thoughtful user experience.",
    illustration: "illustrationIntro",
    cta: {
      label: "View Education",
      section: "education",
      imageKeys: ["heroMark1", "heroMark2", "heroMark3"],
      arrow: "iconArrowRight",
    },
    profile: {
      name: "Oliver Rowland",
      role: "Full Stack Developer",
      description:
        "Focused on high-performance web development, clean interfaces, and reliable backend systems.",
      avatar: "avatarOliver",
      signature: "signatureOliver",
      facts: [
        {
          text: "Houston, Texas",
          icon: "iconLocation",
        },
        {
          text: "5+ years experience",
          icon: "iconBriefcase",
        },
        {
          text: "Open to remote work",
          icon: "iconGlobe",
        },
      ],
      downloadCv: {
        label: "Download CV",
        href: "/portfolio/oliver-rowland-cv.pdf",
      },
    },
  },
  about: {
    label: "About",
    description:
      "I’m a full stack developer with experience building web applications focused on performance, scalability, and usability. I specialize in creating responsive frontend interfaces, developing reliable backend systems, and working across the full product development process using modern technologies and clean development practices.",
    keySkillsLabel: "Key skills:",
    keySkills: [
      "React & Next.js",
      "Node.js & APIs",
      "Responsive interfaces",
      "Backend architecture",
      "TypeScript",
      "Database management",
      "Performance optimization",
    ],
  },
  education: {
    label: "Education",
    items: [
      {
        degree: "Master of Software Engineering",
        institution: "Texas State University",
        period: "2018 – 2020",
        description:
          "Specialized in scalable systems, application architecture, and advanced modern software development.",
      },
      {
        degree: "Bachelor of Computer Science",
        institution: "University of Houston",
        period: "2014 – 2018",
        description:
          "Focused on software engineering, web development, database systems, and application development.",
      },
    ],
  },
  certifications: {
    label: "Certifications",
    items: [
      {
        title: "Advanced Web Development",
        issuer: "Codebridge Academy",
        issued: "Issued May 2023",
        logo: "certificationCodebridge",
      },
      {
        title: "Scalable Backend Systems",
        issuer: "BrightLayer",
        issued: "Issued Sep 2022",
        logo: "certificationBrightLayer",
      },
      {
        title: "Full-Stack JavaScript Certification",
        issuer: "Devlane School",
        issued: "Issued Jul 2022",
        logo: "certificationDevlane",
      },
    ],
  },
  skills: {
    label: "Skills",
    items: [
      "Backend architecture",
      "Cloud deployment",
      "Database management",
      "Git & version control",
      "Node.js & APIs",
      "Performance optimization",
      "Problem solving",
      "React & Next.js",
      "Responsive interfaces",
      "REST API integration",
      "Scalable systems",
      "Team collaboration",
      "Technical documentation",
      "TypeScript",
    ],
    technologiesLabel: "Technologies & tools:",
    technologies: [
      {
        name: "React",
        icon: "techReact",
      },
      {
        name: "Next.js",
        icon: "techNextJs",
      },
      {
        name: "Node.js",
        icon: "techNodeJs",
      },
      {
        name: "TypeScript",
        icon: "techTypeScript",
      },
      {
        name: "JavaScript",
        icon: "techJavaScript",
      },
      {
        name: "Tailwind CSS",
        icon: "techTailwindCss",
      },
      {
        name: "PostgreSQL",
        icon: "techPostgreSql",
      },
      {
        name: "MongoDB",
        icon: "techMongoDb",
      },
      {
        name: "Docker",
        icon: "techDocker",
      },
      {
        name: "GitHub",
        icon: "techGitHub",
      },
      {
        name: "AWS",
        icon: "techAws",
      },
    ],
  },
  languages: {
    label: "Languages",
    items: [
      {
        name: "English",
        proficiency: "Native or bilingual proficiency",
        flag: "flagUsa",
      },
      {
        name: "French",
        proficiency: "Professional working proficiency",
        flag: "flagFrance",
      },
    ],
  },
  contact: {
    label: "Let’s Connect",
    description:
      "Currently available for full-time roles, freelance work, and collaborations.",
    channels: [
      {
        kind: "email",
        label: "Email Me",
        value: "hello@oliverrowland.dev",
        icon: "iconEnvelope",
      },
      {
        kind: "phone",
        label: "Call Me",
        value: "+1 (713) 555-2841",
        icon: "iconPhone",
      },
    ],
    networkLabel: "Join my network:",
    networks: [
      {
        name: "LinkedIn",
        icon: "iconLinkedIn",
        href: "",
      },
      {
        name: "X",
        icon: "iconX",
        href: "",
      },
      {
        name: "Facebook",
        icon: "iconFacebook",
        href: "",
      },
    ],
    illustration: "illustrationContact",
  },
  footer: {
    copyright: "© 2026 Rowland",
    backToTop: {
      label: "Back to Top",
    },
  },
};
