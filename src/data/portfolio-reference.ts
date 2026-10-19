// Extracted source data and original PNG assets from Pencil frame VGODU.

export type PortfolioSectionId =
  | "intro"
  | "about"
  | "experience"
  | "education"
  | "certifications"
  | "skills"
  | "languages"
  | "recommendations"
  | "contact"
  | "footer";

export type PortfolioReferenceRegion =
  "main" | "side-menu" | "navigation" | "footer" | "framer-badge";

export interface PortfolioReferenceSource {
  readonly filePath: string;
  readonly frameId: string;
  readonly frameName: string;
  readonly website: string;
  readonly frameSize: readonly [number, number];
  readonly background: string;
  readonly headlineFont: string;
  readonly bodyFont: string;
  readonly illustrationColor: string;
  readonly extractionSource: "Pencil MCP";
  readonly textRunCount: number;
  readonly assetCount: number;
  readonly exportScale: 3;
}

export const portfolioReferenceSource = {
  filePath:
    "/Users/parkjunha/.pencil/documents/cb918f27-cf4e-4cac-a6a1-9eadcd4858f3/pencil-new.pen",
  frameId: "VGODU",
  frameName: "rowland.framer.website",
  website: "https://rowland.framer.website",
  frameSize: [1081, 5572],
  background: "#fbf5ef",
  headlineFont: "Habibi",
  bodyFont: "Geist",
  illustrationColor: "#e55639",
  extractionSource: "Pencil MCP",
  textRunCount: 108,
  assetCount: 40,
  exportScale: 3,
} as const satisfies PortfolioReferenceSource;

export const portfolioAssets = {
  illustrationIntro: "/portfolio/illustration-intro.png",
  illustrationContact: "/portfolio/illustration-contact.png",
  avatarOliver: "/portfolio/oliver-rowland.png",
  companyNorthstack: "/portfolio/northstack.png",
  companyPixelbase: "/portfolio/pixelbase.png",
  companyCloudCore: "/portfolio/cloudcore.png",
  certificationCodebridge: "/portfolio/codebridge-academy.png",
  certificationBrightLayer: "/portfolio/brightlayer.png",
  certificationDevlane: "/portfolio/devlane-school.png",
  avatarMaya: "/portfolio/maya-chen.png",
  avatarDaniel: "/portfolio/daniel-foster.png",
  heroMark1: "/portfolio/hero-mark-1.png",
  heroMark2: "/portfolio/hero-mark-2.png",
  heroMark3: "/portfolio/hero-mark-3.png",
  techReact: "/portfolio/tech-react.png",
  techNextJs: "/portfolio/tech-nextjs.png",
  techNodeJs: "/portfolio/tech-nodejs.png",
  techTypeScript: "/portfolio/tech-typescript.png",
  techJavaScript: "/portfolio/tech-javascript.png",
  techTailwindCss: "/portfolio/tech-tailwind-css.png",
  techPostgreSql: "/portfolio/tech-postgresql.png",
  techMongoDb: "/portfolio/tech-mongodb.png",
  techDocker: "/portfolio/tech-docker.png",
  techGitHub: "/portfolio/tech-github.png",
  techAws: "/portfolio/tech-aws.png",
  flagUsa: "/portfolio/flag-usa.png",
  flagFrance: "/portfolio/flag-france.png",
  iconUserCircle: "/portfolio/icon-user-circle.png",
  iconChatCircle: "/portfolio/icon-chat-circle.png",
  iconLinkedIn: "/portfolio/icon-linkedin.png",
  iconX: "/portfolio/icon-x.png",
  iconFacebook: "/portfolio/icon-facebook.png",
  iconEnvelope: "/portfolio/icon-envelope.png",
  iconPhone: "/portfolio/icon-phone.png",
  iconLocation: "/portfolio/icon-location.png",
  iconBriefcase: "/portfolio/icon-briefcase.png",
  iconGlobe: "/portfolio/icon-globe.png",
  iconArrowRight: "/portfolio/icon-arrow-right.png",
  signatureOliver: "/portfolio/oliver-signature.png",
  framerBadge: "/portfolio/framer-badge.png",
} as const satisfies Readonly<Record<string, `/portfolio/${string}.png`>>;

export type PortfolioAssetKey = keyof typeof portfolioAssets;

export interface PortfolioAssetSource {
  readonly sourceNodeId: string;
  readonly exportedFilename: string;
  readonly filename: string;
  readonly alt: string;
  readonly sourceSize: readonly [number, number];
  readonly pixelSize: readonly [number, number];
  readonly scale: 3;
  readonly format: "png";
  readonly colorMode: "RGBA";
  readonly hasTransparentPixels: boolean;
  readonly includesEffectOverflow: boolean;
}

export const portfolioAssetSources = {
  illustrationIntro: {
    sourceNodeId: "htEOT",
    exportedFilename: "htEOT.png",
    filename: "illustration-intro.png",
    alt: "Original orange introductory illustration",
    sourceSize: [160, 128],
    pixelSize: [480, 384],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  illustrationContact: {
    sourceNodeId: "sTaBq",
    exportedFilename: "sTaBq.png",
    filename: "illustration-contact.png",
    alt: "Original orange contact illustration",
    sourceSize: [320, 320],
    pixelSize: [960, 960],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  avatarOliver: {
    sourceNodeId: "JLqX6",
    exportedFilename: "JLqX6.png",
    filename: "oliver-rowland.png",
    alt: "Oliver Rowland",
    sourceSize: [113, 113],
    pixelSize: [339, 339],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: false,
    includesEffectOverflow: false,
  },
  companyNorthstack: {
    sourceNodeId: "XLIGW",
    exportedFilename: "XLIGW.png",
    filename: "northstack.png",
    alt: "Northstack",
    sourceSize: [40, 40],
    pixelSize: [120, 120],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: false,
    includesEffectOverflow: false,
  },
  companyPixelbase: {
    sourceNodeId: "K1DFVI",
    exportedFilename: "K1DFVI.png",
    filename: "pixelbase.png",
    alt: "Pixelbase",
    sourceSize: [40, 40],
    pixelSize: [120, 120],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: false,
    includesEffectOverflow: false,
  },
  companyCloudCore: {
    sourceNodeId: "k4dBU",
    exportedFilename: "k4dBU.png",
    filename: "cloudcore.png",
    alt: "CloudCore",
    sourceSize: [40, 40],
    pixelSize: [120, 120],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: false,
    includesEffectOverflow: false,
  },
  certificationCodebridge: {
    sourceNodeId: "p2ge02",
    exportedFilename: "p2ge02.png",
    filename: "codebridge-academy.png",
    alt: "Codebridge Academy",
    sourceSize: [40, 40],
    pixelSize: [120, 120],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: false,
    includesEffectOverflow: false,
  },
  certificationBrightLayer: {
    sourceNodeId: "GGR6C",
    exportedFilename: "GGR6C.png",
    filename: "brightlayer.png",
    alt: "BrightLayer",
    sourceSize: [40, 40],
    pixelSize: [120, 120],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: false,
    includesEffectOverflow: false,
  },
  certificationDevlane: {
    sourceNodeId: "Ns0jZ",
    exportedFilename: "Ns0jZ.png",
    filename: "devlane-school.png",
    alt: "Devlane School",
    sourceSize: [40, 40],
    pixelSize: [120, 120],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: false,
    includesEffectOverflow: false,
  },
  avatarMaya: {
    sourceNodeId: "mu54P",
    exportedFilename: "mu54P.png",
    filename: "maya-chen.png",
    alt: "Maya Chen",
    sourceSize: [40, 40],
    pixelSize: [120, 120],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: false,
    includesEffectOverflow: false,
  },
  avatarDaniel: {
    sourceNodeId: "eCO45",
    exportedFilename: "eCO45.png",
    filename: "daniel-foster.png",
    alt: "Daniel Foster",
    sourceSize: [40, 40],
    pixelSize: [120, 120],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: false,
    includesEffectOverflow: false,
  },
  heroMark1: {
    sourceNodeId: "SkfWt",
    exportedFilename: "SkfWt.png",
    filename: "hero-mark-1.png",
    alt: "First original View Experience button image",
    sourceSize: [24, 24],
    pixelSize: [72, 72],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  heroMark2: {
    sourceNodeId: "O1Dgl1",
    exportedFilename: "O1Dgl1.png",
    filename: "hero-mark-2.png",
    alt: "Second original View Experience button image",
    sourceSize: [24, 24],
    pixelSize: [72, 72],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  heroMark3: {
    sourceNodeId: "KUcQP",
    exportedFilename: "KUcQP.png",
    filename: "hero-mark-3.png",
    alt: "Third original View Experience button image",
    sourceSize: [24, 24],
    pixelSize: [72, 72],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  techReact: {
    sourceNodeId: "Z29xcr",
    exportedFilename: "Z29xcr.png",
    filename: "tech-react.png",
    alt: "React",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  techNextJs: {
    sourceNodeId: "oTVXq",
    exportedFilename: "oTVXq.png",
    filename: "tech-nextjs.png",
    alt: "Next.js",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  techNodeJs: {
    sourceNodeId: "WKxcD",
    exportedFilename: "WKxcD.png",
    filename: "tech-nodejs.png",
    alt: "Node.js",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  techTypeScript: {
    sourceNodeId: "Hciva",
    exportedFilename: "Hciva.png",
    filename: "tech-typescript.png",
    alt: "TypeScript",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: false,
    includesEffectOverflow: false,
  },
  techJavaScript: {
    sourceNodeId: "eRoEx",
    exportedFilename: "eRoEx.png",
    filename: "tech-javascript.png",
    alt: "JavaScript",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: false,
    includesEffectOverflow: false,
  },
  techTailwindCss: {
    sourceNodeId: "ULQpC",
    exportedFilename: "ULQpC.png",
    filename: "tech-tailwind-css.png",
    alt: "Tailwind CSS",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  techPostgreSql: {
    sourceNodeId: "m0vbF",
    exportedFilename: "m0vbF.png",
    filename: "tech-postgresql.png",
    alt: "PostgreSQL",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  techMongoDb: {
    sourceNodeId: "ubHUW",
    exportedFilename: "ubHUW.png",
    filename: "tech-mongodb.png",
    alt: "MongoDB",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  techDocker: {
    sourceNodeId: "IBhWs",
    exportedFilename: "IBhWs.png",
    filename: "tech-docker.png",
    alt: "Docker",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  techGitHub: {
    sourceNodeId: "RsAXW",
    exportedFilename: "RsAXW.png",
    filename: "tech-github.png",
    alt: "GitHub",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  techAws: {
    sourceNodeId: "k2gVZh",
    exportedFilename: "k2gVZh.png",
    filename: "tech-aws.png",
    alt: "AWS",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  flagUsa: {
    sourceNodeId: "rgAdI",
    exportedFilename: "rgAdI.png",
    filename: "flag-usa.png",
    alt: "USA flag",
    sourceSize: [40, 40],
    pixelSize: [120, 120],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  flagFrance: {
    sourceNodeId: "T4luJ",
    exportedFilename: "T4luJ.png",
    filename: "flag-france.png",
    alt: "France flag",
    sourceSize: [40, 40],
    pixelSize: [120, 120],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  iconUserCircle: {
    sourceNodeId: "aY8Am",
    exportedFilename: "aY8Am.png",
    filename: "icon-user-circle.png",
    alt: "User circle",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  iconChatCircle: {
    sourceNodeId: "PDK6d",
    exportedFilename: "PDK6d.png",
    filename: "icon-chat-circle.png",
    alt: "Chat circle",
    sourceSize: [16, 16],
    pixelSize: [48, 48],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  iconLinkedIn: {
    sourceNodeId: "BYvDg",
    exportedFilename: "BYvDg.png",
    filename: "icon-linkedin.png",
    alt: "LinkedIn",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  iconX: {
    sourceNodeId: "OuECQ",
    exportedFilename: "OuECQ.png",
    filename: "icon-x.png",
    alt: "X",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  iconFacebook: {
    sourceNodeId: "iOVLo",
    exportedFilename: "iOVLo.png",
    filename: "icon-facebook.png",
    alt: "Facebook",
    sourceSize: [32, 32],
    pixelSize: [96, 96],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  iconEnvelope: {
    sourceNodeId: "dqG9A",
    exportedFilename: "dqG9A.png",
    filename: "icon-envelope.png",
    alt: "Email",
    sourceSize: [24, 24],
    pixelSize: [72, 72],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  iconPhone: {
    sourceNodeId: "Fffpm",
    exportedFilename: "Fffpm.png",
    filename: "icon-phone.png",
    alt: "Phone",
    sourceSize: [24, 24],
    pixelSize: [72, 72],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  iconLocation: {
    sourceNodeId: "zIZvs",
    exportedFilename: "zIZvs.png",
    filename: "icon-location.png",
    alt: "Location",
    sourceSize: [12, 12],
    pixelSize: [36, 36],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  iconBriefcase: {
    sourceNodeId: "Zkt3b",
    exportedFilename: "Zkt3b.png",
    filename: "icon-briefcase.png",
    alt: "Briefcase",
    sourceSize: [12, 12],
    pixelSize: [36, 36],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  iconGlobe: {
    sourceNodeId: "ZHdku",
    exportedFilename: "ZHdku.png",
    filename: "icon-globe.png",
    alt: "Globe",
    sourceSize: [12, 12],
    pixelSize: [36, 36],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  iconArrowRight: {
    sourceNodeId: "iQ3qx",
    exportedFilename: "iQ3qx.png",
    filename: "icon-arrow-right.png",
    alt: "Arrow right",
    sourceSize: [16, 16],
    pixelSize: [48, 48],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  signatureOliver: {
    sourceNodeId: "jT4Em",
    exportedFilename: "jT4Em.png",
    filename: "oliver-signature.png",
    alt: "Oliver Rowland signature",
    sourceSize: [83, 47.83],
    pixelSize: [249, 144],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: false,
  },
  framerBadge: {
    sourceNodeId: "VFRRL",
    exportedFilename: "VFRRL.png",
    filename: "framer-badge.png",
    alt: "Original Framer website badge",
    sourceSize: [140, 38],
    pixelSize: [608, 302],
    scale: 3,
    format: "png",
    colorMode: "RGBA",
    hasTransparentPixels: true,
    includesEffectOverflow: true,
  },
} as const satisfies Readonly<Record<PortfolioAssetKey, PortfolioAssetSource>>;

export interface PortfolioReferenceLink {
  readonly sourceNodeId: string;
  readonly label: string;
  readonly sourceHref: string | null;
}

export interface PortfolioNavigation {
  readonly sourceNodeId: string;
  readonly logo: PortfolioAssetKey;
  readonly items: readonly (PortfolioReferenceLink & {
    readonly section: PortfolioSectionId;
  })[];
  readonly contact: PortfolioReferenceLink & {
    readonly icon: PortfolioAssetKey;
  };
}

export interface PortfolioIntro {
  readonly sourceNodeId: string;
  readonly title: string;
  readonly description: string;
  readonly illustration: PortfolioAssetKey;
  readonly experienceLink: PortfolioReferenceLink & {
    readonly imageKeys: readonly PortfolioAssetKey[];
    readonly arrow: PortfolioAssetKey;
  };
  readonly profile: {
    readonly sourceNodeId: string;
    readonly name: string;
    readonly role: string;
    readonly description: string;
    readonly avatar: PortfolioAssetKey;
    readonly signature: PortfolioAssetKey;
    readonly facts: readonly {
      readonly sourceNodeId: string;
      readonly text: string;
      readonly icon: PortfolioAssetKey;
    }[];
    readonly downloadCv: PortfolioReferenceLink;
    readonly socialIconSourceNodeIds: readonly string[];
    readonly emailIconSourceNodeId: string;
  };
}

export interface PortfolioAbout {
  readonly sourceNodeId: string;
  readonly label: string;
  readonly description: string;
  readonly keySkillsLabel: string;
  readonly keySkills: readonly string[];
}

export interface PortfolioExperienceRole {
  readonly sourceNodeId: string;
  readonly title: string;
  readonly employmentType: string;
  readonly period: string;
  readonly description: string;
  readonly highlights: readonly string[];
}

export interface PortfolioExperience {
  readonly sourceNodeId: string;
  readonly label: string;
  readonly companies: readonly {
    readonly sourceNodeId: string;
    readonly name: string;
    readonly logo: PortfolioAssetKey;
    readonly roles: readonly PortfolioExperienceRole[];
  }[];
}

export interface PortfolioEducation {
  readonly sourceNodeId: string;
  readonly label: string;
  readonly items: readonly {
    readonly sourceNodeId: string;
    readonly degree: string;
    readonly institution: string;
    readonly period: string;
    readonly description: string;
  }[];
}

export interface PortfolioCertifications {
  readonly sourceNodeId: string;
  readonly label: string;
  readonly items: readonly {
    readonly sourceNodeId: string;
    readonly title: string;
    readonly issuer: string;
    readonly issued: string;
    readonly logo: PortfolioAssetKey;
  }[];
}

export interface PortfolioSkills {
  readonly sourceNodeId: string;
  readonly label: string;
  readonly items: readonly string[];
  readonly technologiesLabel: string;
  readonly technologies: readonly {
    readonly sourceNodeId: string;
    readonly name: string;
    readonly sourceContext: string;
    readonly icon: PortfolioAssetKey;
  }[];
}

export interface PortfolioLanguages {
  readonly sourceNodeId: string;
  readonly label: string;
  readonly items: readonly {
    readonly sourceNodeId: string;
    readonly name: string;
    readonly proficiency: string;
    readonly flag: PortfolioAssetKey;
  }[];
}

export interface PortfolioRecommendations {
  readonly sourceNodeId: string;
  readonly label: string;
  readonly items: readonly {
    readonly sourceNodeId: string;
    readonly name: string;
    readonly role: string;
    readonly quote: string;
    readonly avatar: PortfolioAssetKey;
  }[];
}

export interface PortfolioContact {
  readonly sourceNodeId: string;
  readonly label: string;
  readonly description: string;
  readonly channels: readonly (PortfolioReferenceLink & {
    readonly kind: "email" | "phone";
    readonly value: string;
    readonly icon: PortfolioAssetKey;
  })[];
  readonly networkLabel: string;
  readonly networks: readonly {
    readonly sourceNodeId: string;
    readonly name: string;
    readonly sourceContext: string;
    readonly icon: PortfolioAssetKey;
    readonly sourceHref: string | null;
  }[];
  readonly illustration: PortfolioAssetKey;
}

export interface PortfolioFooter {
  readonly sourceNodeId: string;
  readonly copyright: string;
  readonly backToTop: PortfolioReferenceLink;
  readonly framerBadge: PortfolioReferenceLink & {
    readonly labelSource: "rendered-vector-lettering";
    readonly tooltip: string;
    readonly asset: PortfolioAssetKey;
  };
}

export interface PortfolioReferenceTextRun {
  readonly section: PortfolioSectionId;
  readonly region: PortfolioReferenceRegion;
  readonly sourceNodeId: string;
  readonly sourceTag: string | null;
  readonly text: string;
  readonly reconstruction: "letter-spans" | "text-node";
}

export const portfolioNavigation = {
  sourceNodeId: "j2sf9",
  logo: "iconUserCircle",
  items: [
    {
      sourceNodeId: "L0VHgQ",
      label: "About",
      section: "about",
      sourceHref: null,
    },
    {
      sourceNodeId: "uaHOj",
      label: "Experience",
      section: "experience",
      sourceHref: null,
    },
    {
      sourceNodeId: "ECBiS",
      label: "Education",
      section: "education",
      sourceHref: null,
    },
    {
      sourceNodeId: "yavIZ",
      label: "Skills",
      section: "skills",
      sourceHref: null,
    },
  ],
  contact: {
    sourceNodeId: "MXLud",
    label: "Contact Me",
    icon: "iconChatCircle",
    sourceHref: null,
  },
} as const satisfies PortfolioNavigation;

export const portfolioIntro = {
  sourceNodeId: "ItMoU",
  title: "Full Stack Developer",
  description:
    "Building scalable web applications with clean architecture, modern tools, and thoughtful user experience.",
  illustration: "illustrationIntro",
  experienceLink: {
    sourceNodeId: "nN1SA",
    label: "View Experience",
    imageKeys: ["heroMark1", "heroMark2", "heroMark3"],
    arrow: "iconArrowRight",
    sourceHref: null,
  },
  profile: {
    sourceNodeId: "l7t43r",
    name: "Oliver Rowland",
    role: "Full Stack Developer",
    description:
      "Focused on high-performance web development, clean interfaces, and reliable backend systems.",
    avatar: "avatarOliver",
    signature: "signatureOliver",
    facts: [
      {
        sourceNodeId: "zKk0y",
        text: "Houston, Texas",
        icon: "iconLocation",
      },
      {
        sourceNodeId: "Wlbl7",
        text: "5+ years experience",
        icon: "iconBriefcase",
      },
      {
        sourceNodeId: "ZNXFB",
        text: "Open to remote work",
        icon: "iconGlobe",
      },
    ],
    downloadCv: {
      sourceNodeId: "muwr3",
      label: "Download CV",
      sourceHref: null,
    },
    socialIconSourceNodeIds: ["vsxLx", "OoGcZ", "w4WrO"],
    emailIconSourceNodeId: "ns9cd",
  },
} as const satisfies PortfolioIntro;

export const portfolioAbout = {
  sourceNodeId: "du701",
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
} as const satisfies PortfolioAbout;

export const portfolioExperience = {
  sourceNodeId: "uLpuE",
  label: "Experience",
  companies: [
    {
      sourceNodeId: "MtA5b",
      name: "Northstack",
      logo: "companyNorthstack",
      roles: [
        {
          sourceNodeId: "vLCrR",
          title: "Senior Full Stack Developer",
          employmentType: "Full-Time",
          period: "Jan 2025 – Present",
          description:
            "Leading full-stack development for scalable web applications and reliable digital products across teams.",
          highlights: [
            "Improved platform performance and stability",
            "Built frontend and backend product features",
            "Collaborated with product and engineering teams",
          ],
        },
        {
          sourceNodeId: "smL8e",
          title: "Full Stack Developer",
          employmentType: "Full-Time",
          period: "Jan 2023 – Dec 2024",
          description:
            "Worked on responsive web applications, API integrations, and backend systems using modern frameworks.",
          highlights: [],
        },
      ],
    },
    {
      sourceNodeId: "H4e7d",
      name: "Pixelbase",
      logo: "companyPixelbase",
      roles: [
        {
          sourceNodeId: "XnmOJ",
          title: "Frontend Developer",
          employmentType: "Full-Time",
          period: "Apr 2021 – Dec 2022",
          description:
            "Developed responsive user interfaces and interactive web experiences for client and internal digital products, focusing on usability, accessibility, and performance.",
          highlights: [],
        },
      ],
    },
    {
      sourceNodeId: "ydMGI",
      name: "CloudCore",
      logo: "companyCloudCore",
      roles: [
        {
          sourceNodeId: "rvXFy",
          title: "Junior Web Developer",
          employmentType: "Part-Time",
          period: "Aug 2020 – May 2021",
          description:
            "Supported frontend and backend development tasks while contributing to modern web projects, maintaining internal systems, and improving workflow efficiency.",
          highlights: [
            "Assisted in developing responsive website interfaces",
            "Worked with REST APIs and backend integrations",
          ],
        },
      ],
    },
  ],
} as const satisfies PortfolioExperience;

export const portfolioEducation = {
  sourceNodeId: "rq4db",
  label: "Education",
  items: [
    {
      sourceNodeId: "pMhXu",
      degree: "Master of Software Engineering",
      institution: "Texas State University",
      period: "2018 – 2020",
      description:
        "Specialized in scalable systems, application architecture, and advanced modern software development.",
    },
    {
      sourceNodeId: "oAcQp",
      degree: "Bachelor of Computer Science",
      institution: "University of Houston",
      period: "2014 – 2018",
      description:
        "Focused on software engineering, web development, database systems, and application development.",
    },
  ],
} as const satisfies PortfolioEducation;

export const portfolioCertifications = {
  sourceNodeId: "Wqbvt",
  label: "Certifications",
  items: [
    {
      sourceNodeId: "z23oi6",
      title: "Advanced Web Development",
      issuer: "Codebridge Academy",
      issued: "Issued May 2023",
      logo: "certificationCodebridge",
    },
    {
      sourceNodeId: "hDrbJ",
      title: "Scalable Backend Systems",
      issuer: "BrightLayer",
      issued: "Issued Sep 2022",
      logo: "certificationBrightLayer",
    },
    {
      sourceNodeId: "jMHLk",
      title: "Full-Stack JavaScript Certification",
      issuer: "Devlane School",
      issued: "Issued Jul 2022",
      logo: "certificationDevlane",
    },
  ],
} as const satisfies PortfolioCertifications;

export const portfolioSkills = {
  sourceNodeId: "xPJIy",
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
      sourceNodeId: "Z29xcr",
      name: "React",
      sourceContext: "React - img",
      icon: "techReact",
    },
    {
      sourceNodeId: "oTVXq",
      name: "Next.js",
      sourceContext: "Next.js - img",
      icon: "techNextJs",
    },
    {
      sourceNodeId: "WKxcD",
      name: "Node.js",
      sourceContext: "Node.js - img",
      icon: "techNodeJs",
    },
    {
      sourceNodeId: "Hciva",
      name: "TypeScript",
      sourceContext: "TypeScript - img",
      icon: "techTypeScript",
    },
    {
      sourceNodeId: "eRoEx",
      name: "JavaScript",
      sourceContext: "JavaScript - img",
      icon: "techJavaScript",
    },
    {
      sourceNodeId: "ULQpC",
      name: "Tailwind CSS",
      sourceContext: "Tailwind CSS - img",
      icon: "techTailwindCss",
    },
    {
      sourceNodeId: "m0vbF",
      name: "PostgreSQL",
      sourceContext: "PostgreSQL - img",
      icon: "techPostgreSql",
    },
    {
      sourceNodeId: "ubHUW",
      name: "MongoDB",
      sourceContext: "MongoDB - img",
      icon: "techMongoDb",
    },
    {
      sourceNodeId: "IBhWs",
      name: "Docker",
      sourceContext: "Docker - img",
      icon: "techDocker",
    },
    {
      sourceNodeId: "RsAXW",
      name: "GitHub",
      sourceContext: "GitHub - img",
      icon: "techGitHub",
    },
    {
      sourceNodeId: "k2gVZh",
      name: "AWS",
      sourceContext: "AWS - img",
      icon: "techAws",
    },
  ],
} as const satisfies PortfolioSkills;

export const portfolioLanguages = {
  sourceNodeId: "Z9T5a",
  label: "Languages",
  items: [
    {
      sourceNodeId: "P9v0FF",
      name: "English",
      proficiency: "Native or bilingual proficiency",
      flag: "flagUsa",
    },
    {
      sourceNodeId: "LBViL",
      name: "French",
      proficiency: "Professional working proficiency",
      flag: "flagFrance",
    },
  ],
} as const satisfies PortfolioLanguages;

export const portfolioRecommendations = {
  sourceNodeId: "XV11b",
  label: "Recommendations",
  items: [
    {
      sourceNodeId: "hnqRn",
      name: "Maya Chen",
      role: "Product Manager at Northstack",
      quote:
        "Oliver brings a strong balance of technical skill, clear communication, and reliable execution. He consistently delivered thoughtful, effective solutions across frontend and backend development tasks.",
      avatar: "avatarMaya",
    },
    {
      sourceNodeId: "t8xME7",
      name: "Daniel Foster",
      role: "Engineering Lead at BrightLayer",
      quote:
        "Oliver consistently approached projects with strong technical understanding and attention to detail. His ability to solve complex problems and collaborate effectively made him a valuable part of the development team.",
      avatar: "avatarDaniel",
    },
  ],
} as const satisfies PortfolioRecommendations;

export const portfolioContact = {
  sourceNodeId: "T8vRSV",
  label: "Let’s Connect",
  description:
    "Currently available for full-time roles, freelance work, and collaborations.",
  channels: [
    {
      sourceNodeId: "EiNFf",
      kind: "email",
      label: "Email Me",
      value: "hello@oliverrowland.dev",
      icon: "iconEnvelope",
      sourceHref: null,
    },
    {
      sourceNodeId: "KUPGH",
      kind: "phone",
      label: "Call Me",
      value: "+1 (713) 555-2841",
      icon: "iconPhone",
      sourceHref: null,
    },
  ],
  networkLabel: "Join my network:",
  networks: [
    {
      sourceNodeId: "ugJDz",
      name: "LinkedIn",
      sourceContext: "LinkedinLogo - div",
      icon: "iconLinkedIn",
      sourceHref: null,
    },
    {
      sourceNodeId: "k6e6S",
      name: "X",
      sourceContext: "XLogo - div",
      icon: "iconX",
      sourceHref: null,
    },
    {
      sourceNodeId: "WbVRS",
      name: "Facebook",
      sourceContext: "FacebookLogo - div",
      icon: "iconFacebook",
      sourceHref: null,
    },
  ],
  illustration: "illustrationContact",
} as const satisfies PortfolioContact;

export const portfolioFooter = {
  sourceNodeId: "QIeAe",
  copyright: "© 2026 Rowland",
  backToTop: {
    sourceNodeId: "nUoFp",
    label: "Back to Top",
    sourceHref: null,
  },
  framerBadge: {
    sourceNodeId: "VFRRL",
    label: "Made in Framer",
    labelSource: "rendered-vector-lettering",
    tooltip:
      "Create a free website with Framer, the website builder loved by startups, designers and agencies.",
    asset: "framerBadge",
    sourceHref: null,
  },
} as const satisfies PortfolioFooter;

export const portfolioReferenceTextRuns = [
  {
    section: "intro",
    region: "main",
    sourceNodeId: "u3WR3t",
    sourceTag: "h1",
    text: "Full Stack Developer",
    reconstruction: "letter-spans",
  },
  {
    section: "intro",
    region: "main",
    sourceNodeId: "MqVQl",
    sourceTag: "p",
    text: "Building scalable web applications with clean architecture, modern tools, and thoughtful user experience.",
    reconstruction: "letter-spans",
  },
  {
    section: "intro",
    region: "main",
    sourceNodeId: "INpTd",
    sourceTag: "p",
    text: "View Experience",
    reconstruction: "text-node",
  },
  {
    section: "about",
    region: "main",
    sourceNodeId: "iUcFd",
    sourceTag: "h2",
    text: "About",
    reconstruction: "text-node",
  },
  {
    section: "about",
    region: "main",
    sourceNodeId: "fpXYs",
    sourceTag: "p",
    text: "I’m a full stack developer with experience building web applications focused on performance, scalability, and usability. I specialize in creating responsive frontend interfaces, developing reliable backend systems, and working across the full product development process using modern technologies and clean development practices.",
    reconstruction: "text-node",
  },
  {
    section: "about",
    region: "main",
    sourceNodeId: "ON8XO",
    sourceTag: "p",
    text: "Key skills:",
    reconstruction: "text-node",
  },
  {
    section: "about",
    region: "main",
    sourceNodeId: "l8lcw",
    sourceTag: "p",
    text: "React & Next.js",
    reconstruction: "text-node",
  },
  {
    section: "about",
    region: "main",
    sourceNodeId: "T0dlA",
    sourceTag: "p",
    text: "Node.js & APIs",
    reconstruction: "text-node",
  },
  {
    section: "about",
    region: "main",
    sourceNodeId: "oe2gR",
    sourceTag: "p",
    text: "Responsive interfaces",
    reconstruction: "text-node",
  },
  {
    section: "about",
    region: "main",
    sourceNodeId: "KOeEi",
    sourceTag: "p",
    text: "Backend architecture",
    reconstruction: "text-node",
  },
  {
    section: "about",
    region: "main",
    sourceNodeId: "vy75O",
    sourceTag: "p",
    text: "TypeScript",
    reconstruction: "text-node",
  },
  {
    section: "about",
    region: "main",
    sourceNodeId: "i4SMX",
    sourceTag: "p",
    text: "Database management",
    reconstruction: "text-node",
  },
  {
    section: "about",
    region: "main",
    sourceNodeId: "N40hF",
    sourceTag: "p",
    text: "Performance optimization",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "hiSJN",
    sourceTag: "h2",
    text: "Experience",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "zZ5dE",
    sourceTag: "h3",
    text: "Senior Full Stack Developer",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "z4kCe",
    sourceTag: "p",
    text: "Northstack",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "vFkYk",
    sourceTag: "p",
    text: "Full-Time",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "n6P0Y",
    sourceTag: "p",
    text: "Leading full-stack development for scalable web applications and reliable digital products across teams.",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "l0AMv",
    sourceTag: "p",
    text: "Improved platform performance and stability",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "Peu8J",
    sourceTag: "p",
    text: "Built frontend and backend product features",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "X8oSTN",
    sourceTag: "p",
    text: "Collaborated with product and engineering teams",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "a3fLV",
    sourceTag: "p",
    text: "Jan 2025 – Present",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "fKa3R",
    sourceTag: "h3",
    text: "Full Stack Developer",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "m9Enbz",
    sourceTag: "p",
    text: "Northstack",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "TLYOe",
    sourceTag: "p",
    text: "Full-Time",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "j2m6RK",
    sourceTag: "p",
    text: "Worked on responsive web applications, API integrations, and backend systems using modern frameworks.",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "wMhhL",
    sourceTag: "p",
    text: "Jan 2023 – Dec 2024",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "XnmOJ",
    sourceTag: "h3",
    text: "Frontend Developer",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "uPNzu",
    sourceTag: "p",
    text: "Pixelbase",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "I3HeOM",
    sourceTag: "p",
    text: "Full-Time",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "RL8rg",
    sourceTag: "p",
    text: "Developed responsive user interfaces and interactive web experiences for client and internal digital products, focusing on usability, accessibility, and performance.",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "n79gW4",
    sourceTag: "p",
    text: "Apr 2021 – Dec 2022",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "rvXFy",
    sourceTag: "h3",
    text: "Junior Web Developer",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "jQhWK",
    sourceTag: "p",
    text: "CloudCore",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "PNJVf",
    sourceTag: "p",
    text: "Part-Time",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "XaTXk",
    sourceTag: "p",
    text: "Supported frontend and backend development tasks while contributing to modern web projects, maintaining internal systems, and improving workflow efficiency.",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "ioB8b",
    sourceTag: "p",
    text: "Assisted in developing responsive website interfaces",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "z9joJd",
    sourceTag: "p",
    text: "Worked with REST APIs and backend integrations",
    reconstruction: "text-node",
  },
  {
    section: "experience",
    region: "main",
    sourceNodeId: "w4aoEg",
    sourceTag: "p",
    text: "Aug 2020 – May 2021",
    reconstruction: "text-node",
  },
  {
    section: "education",
    region: "main",
    sourceNodeId: "qMXhV",
    sourceTag: "h2",
    text: "Education",
    reconstruction: "text-node",
  },
  {
    section: "education",
    region: "main",
    sourceNodeId: "tGolF",
    sourceTag: "h3",
    text: "Master of Software Engineering",
    reconstruction: "text-node",
  },
  {
    section: "education",
    region: "main",
    sourceNodeId: "q02tqY",
    sourceTag: "p",
    text: "Texas State University",
    reconstruction: "text-node",
  },
  {
    section: "education",
    region: "main",
    sourceNodeId: "aZL8X",
    sourceTag: "p",
    text: "Specialized in scalable systems, application architecture, and advanced modern software development.",
    reconstruction: "text-node",
  },
  {
    section: "education",
    region: "main",
    sourceNodeId: "F21auT",
    sourceTag: "p",
    text: "2018 – 2020",
    reconstruction: "text-node",
  },
  {
    section: "education",
    region: "main",
    sourceNodeId: "W4G02z",
    sourceTag: "h3",
    text: "Bachelor of Computer Science",
    reconstruction: "text-node",
  },
  {
    section: "education",
    region: "main",
    sourceNodeId: "Q0mP3M",
    sourceTag: "p",
    text: "University of Houston",
    reconstruction: "text-node",
  },
  {
    section: "education",
    region: "main",
    sourceNodeId: "i2lYLA",
    sourceTag: "p",
    text: "Focused on software engineering, web development, database systems, and application development.",
    reconstruction: "text-node",
  },
  {
    section: "education",
    region: "main",
    sourceNodeId: "J0Lag",
    sourceTag: "p",
    text: "2014 – 2018",
    reconstruction: "text-node",
  },
  {
    section: "certifications",
    region: "main",
    sourceNodeId: "kFJul",
    sourceTag: "h2",
    text: "Certifications",
    reconstruction: "text-node",
  },
  {
    section: "certifications",
    region: "main",
    sourceNodeId: "X94rG",
    sourceTag: "h3",
    text: "Advanced Web Development",
    reconstruction: "text-node",
  },
  {
    section: "certifications",
    region: "main",
    sourceNodeId: "h8TSm9",
    sourceTag: "p",
    text: "Codebridge Academy",
    reconstruction: "text-node",
  },
  {
    section: "certifications",
    region: "main",
    sourceNodeId: "Sbu44",
    sourceTag: "p",
    text: "Issued May 2023",
    reconstruction: "text-node",
  },
  {
    section: "certifications",
    region: "main",
    sourceNodeId: "LFngd",
    sourceTag: "h3",
    text: "Scalable Backend Systems",
    reconstruction: "text-node",
  },
  {
    section: "certifications",
    region: "main",
    sourceNodeId: "IC8k8",
    sourceTag: "p",
    text: "BrightLayer",
    reconstruction: "text-node",
  },
  {
    section: "certifications",
    region: "main",
    sourceNodeId: "uMQwq",
    sourceTag: "p",
    text: "Issued Sep 2022",
    reconstruction: "text-node",
  },
  {
    section: "certifications",
    region: "main",
    sourceNodeId: "fp2xf",
    sourceTag: "h3",
    text: "Full-Stack JavaScript Certification",
    reconstruction: "text-node",
  },
  {
    section: "certifications",
    region: "main",
    sourceNodeId: "u6OURs",
    sourceTag: "p",
    text: "Devlane School",
    reconstruction: "text-node",
  },
  {
    section: "certifications",
    region: "main",
    sourceNodeId: "ndgiP",
    sourceTag: "p",
    text: "Issued Jul 2022",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "pR9Iw",
    sourceTag: "h2",
    text: "Skills",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "Z0WJy",
    sourceTag: "p",
    text: "Backend architecture",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "EOGFD",
    sourceTag: "p",
    text: "Cloud deployment",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "uNvE0",
    sourceTag: "p",
    text: "Database management",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "a5uUZ",
    sourceTag: "p",
    text: "Git & version control",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "v8L0ri",
    sourceTag: "p",
    text: "Node.js & APIs",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "Ztbfc",
    sourceTag: "p",
    text: "Performance optimization",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "exodK",
    sourceTag: "p",
    text: "Problem solving",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "utN3u",
    sourceTag: "p",
    text: "React & Next.js",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "E6GYOL",
    sourceTag: "p",
    text: "Responsive interfaces",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "x7wDX",
    sourceTag: "p",
    text: "REST API integration",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "T2DeX",
    sourceTag: "p",
    text: "Scalable systems",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "PElFj",
    sourceTag: "p",
    text: "Team collaboration",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "yfPYk",
    sourceTag: "p",
    text: "Technical documentation",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "DsFg2",
    sourceTag: "p",
    text: "TypeScript",
    reconstruction: "text-node",
  },
  {
    section: "skills",
    region: "main",
    sourceNodeId: "XE0gS",
    sourceTag: "p",
    text: "Technologies & tools:",
    reconstruction: "text-node",
  },
  {
    section: "languages",
    region: "main",
    sourceNodeId: "BiWha",
    sourceTag: "h2",
    text: "Languages",
    reconstruction: "text-node",
  },
  {
    section: "languages",
    region: "main",
    sourceNodeId: "KNBTT",
    sourceTag: "h3",
    text: "English",
    reconstruction: "text-node",
  },
  {
    section: "languages",
    region: "main",
    sourceNodeId: "qYGYV",
    sourceTag: "p",
    text: "Native or bilingual proficiency",
    reconstruction: "text-node",
  },
  {
    section: "languages",
    region: "main",
    sourceNodeId: "gJ5zc",
    sourceTag: "h3",
    text: "French",
    reconstruction: "text-node",
  },
  {
    section: "languages",
    region: "main",
    sourceNodeId: "hvgVg",
    sourceTag: "p",
    text: "Professional working proficiency",
    reconstruction: "text-node",
  },
  {
    section: "recommendations",
    region: "main",
    sourceNodeId: "DfUhM",
    sourceTag: "h2",
    text: "Recommendations",
    reconstruction: "text-node",
  },
  {
    section: "recommendations",
    region: "main",
    sourceNodeId: "toSGH",
    sourceTag: "h3",
    text: "Maya Chen",
    reconstruction: "text-node",
  },
  {
    section: "recommendations",
    region: "main",
    sourceNodeId: "sJ167",
    sourceTag: "p",
    text: "Product Manager at Northstack",
    reconstruction: "text-node",
  },
  {
    section: "recommendations",
    region: "main",
    sourceNodeId: "A9I7nM",
    sourceTag: "p",
    text: "Oliver brings a strong balance of technical skill, clear communication, and reliable execution. He consistently delivered thoughtful, effective solutions across frontend and backend development tasks.",
    reconstruction: "text-node",
  },
  {
    section: "recommendations",
    region: "main",
    sourceNodeId: "J2RnX",
    sourceTag: "h3",
    text: "Daniel Foster",
    reconstruction: "text-node",
  },
  {
    section: "recommendations",
    region: "main",
    sourceNodeId: "y2kbK",
    sourceTag: "p",
    text: "Engineering Lead at BrightLayer",
    reconstruction: "text-node",
  },
  {
    section: "recommendations",
    region: "main",
    sourceNodeId: "rQDap",
    sourceTag: "p",
    text: "Oliver consistently approached projects with strong technical understanding and attention to detail. His ability to solve complex problems and collaborate effectively made him a valuable part of the development team.",
    reconstruction: "text-node",
  },
  {
    section: "contact",
    region: "main",
    sourceNodeId: "VlSPm",
    sourceTag: "h2",
    text: "Let’s Connect",
    reconstruction: "text-node",
  },
  {
    section: "contact",
    region: "main",
    sourceNodeId: "HwOqa",
    sourceTag: "p",
    text: "Currently available for full-time roles, freelance work, and collaborations.",
    reconstruction: "text-node",
  },
  {
    section: "contact",
    region: "main",
    sourceNodeId: "EiNFf",
    sourceTag: "h3",
    text: "Email Me",
    reconstruction: "text-node",
  },
  {
    section: "contact",
    region: "main",
    sourceNodeId: "g4dUOO",
    sourceTag: "p",
    text: "hello@oliverrowland.dev",
    reconstruction: "text-node",
  },
  {
    section: "contact",
    region: "main",
    sourceNodeId: "KUPGH",
    sourceTag: "h3",
    text: "Call Me",
    reconstruction: "text-node",
  },
  {
    section: "contact",
    region: "main",
    sourceNodeId: "T3Ftb",
    sourceTag: "p",
    text: "+1 (713) 555-2841",
    reconstruction: "text-node",
  },
  {
    section: "contact",
    region: "main",
    sourceNodeId: "dkq07",
    sourceTag: "p",
    text: "Join my network:",
    reconstruction: "text-node",
  },
  {
    section: "intro",
    region: "side-menu",
    sourceNodeId: "G5zQlv",
    sourceTag: "p",
    text: "Oliver Rowland",
    reconstruction: "text-node",
  },
  {
    section: "intro",
    region: "side-menu",
    sourceNodeId: "Fe1Tm",
    sourceTag: "p",
    text: "Full Stack Developer",
    reconstruction: "text-node",
  },
  {
    section: "intro",
    region: "side-menu",
    sourceNodeId: "QWGvQ",
    sourceTag: "p",
    text: "Focused on high-performance web development, clean interfaces, and reliable backend systems.",
    reconstruction: "letter-spans",
  },
  {
    section: "intro",
    region: "side-menu",
    sourceNodeId: "zKk0y",
    sourceTag: "p",
    text: "Houston, Texas",
    reconstruction: "text-node",
  },
  {
    section: "intro",
    region: "side-menu",
    sourceNodeId: "Wlbl7",
    sourceTag: "p",
    text: "5+ years experience",
    reconstruction: "text-node",
  },
  {
    section: "intro",
    region: "side-menu",
    sourceNodeId: "ZNXFB",
    sourceTag: "p",
    text: "Open to remote work",
    reconstruction: "text-node",
  },
  {
    section: "intro",
    region: "side-menu",
    sourceNodeId: "vrvto",
    sourceTag: null,
    text: "Download CV",
    reconstruction: "text-node",
  },
  {
    section: "intro",
    region: "navigation",
    sourceNodeId: "L0VHgQ",
    sourceTag: "p",
    text: "About",
    reconstruction: "text-node",
  },
  {
    section: "intro",
    region: "navigation",
    sourceNodeId: "uaHOj",
    sourceTag: "p",
    text: "Experience",
    reconstruction: "text-node",
  },
  {
    section: "intro",
    region: "navigation",
    sourceNodeId: "ECBiS",
    sourceTag: "p",
    text: "Education",
    reconstruction: "text-node",
  },
  {
    section: "intro",
    region: "navigation",
    sourceNodeId: "yavIZ",
    sourceTag: "p",
    text: "Skills",
    reconstruction: "text-node",
  },
  {
    section: "intro",
    region: "navigation",
    sourceNodeId: "MXLud",
    sourceTag: "p",
    text: "Contact Me",
    reconstruction: "text-node",
  },
  {
    section: "footer",
    region: "footer",
    sourceNodeId: "at4L4",
    sourceTag: "p",
    text: "© 2026 Rowland",
    reconstruction: "text-node",
  },
  {
    section: "footer",
    region: "footer",
    sourceNodeId: "TmZ42",
    sourceTag: "p",
    text: "Back to Top",
    reconstruction: "text-node",
  },
  {
    section: "footer",
    region: "framer-badge",
    sourceNodeId: "yJHLp",
    sourceTag: null,
    text: "Create a free website with Framer, the website builder loved by startups, designers and agencies.",
    reconstruction: "text-node",
  },
] as const satisfies readonly PortfolioReferenceTextRun[];

export const portfolioReferenceFidelityNotes = [
  "All copy is extracted from original frame VGODU, preserving Oliver Rowland content, English labels, punctuation, capitalization, dates, and source order.",
  "The intro title, intro description, and side-menu description are reconstructed from individual letter nodes. Spacer WuJlR preserves the space in web development.",
  "Technology names and social network names come from original icon context labels; these icons have no visible text captions in the source.",
  "Destination URLs are absent from the imported canvas. sourceHref is null for navigation, contact, social, CV, footer, and badge links; no destinations or downloadable CV are invented.",
  "PNG files were exported by Pencil at scale 3 without a composited canvas background, image generation, or artwork edits. Original opaque raster backgrounds and TypeScript/JavaScript tiles are preserved.",
  "The Framer badge export includes its original shadow overflow: actual PNG size is 608 by 302 pixels for a nominal 140 by 38 node at scale 3.",
  "The signature export rounds its fractional original 47.83 pixel height up to 144 raster pixels at scale 3.",
  "Made in Framer is rendered as vector lettering; its label is transcribed from the exported original badge. The long badge tooltip remains separate from the visible footer copy.",
] as const satisfies readonly string[];

export const portfolioReference = {
  source: portfolioReferenceSource,
  navigation: portfolioNavigation,
  intro: portfolioIntro,
  about: portfolioAbout,
  experience: portfolioExperience,
  education: portfolioEducation,
  certifications: portfolioCertifications,
  skills: portfolioSkills,
  languages: portfolioLanguages,
  recommendations: portfolioRecommendations,
  contact: portfolioContact,
  footer: portfolioFooter,
  assets: portfolioAssets,
  assetSources: portfolioAssetSources,
  textRuns: portfolioReferenceTextRuns,
  fidelityNotes: portfolioReferenceFidelityNotes,
} as const;

export type PortfolioReference = typeof portfolioReference;
