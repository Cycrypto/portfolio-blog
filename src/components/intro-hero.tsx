import { ArrowRight } from "lucide-react";
import type { Intro } from "@/lib/types";
import { facts } from "@/data/portfolio";
import { buttonClass } from "./ui-styles";

export function IntroHero({
  intro,
  preview = false,
}: {
  intro: Intro;
  preview?: boolean;
}) {
  const lines = intro.headline.split("\n").filter((line) => line.trim());
  return (
    <section
      aria-labelledby="intro-heading"
      className={preview ? "py-2" : "py-14 md:py-24"}
    >
      <div
        className={
          preview
            ? ""
            : "grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16"
        }
      >
        <div className="min-w-0">
          {intro.eyebrow && (
            <p className="mb-5 font-mono text-[10px] tracking-widest text-accent md:text-xs">
              {intro.eyebrow}
            </p>
          )}
          <h1 id="intro-heading" className="font-heading">
            <span className="mb-4 block text-xl font-semibold tracking-normal md:text-2xl">
              {intro.name}
            </span>
            <span
              className={`block max-w-[880px] leading-[1.2] font-bold tracking-tight break-keep ${preview ? "text-[30px] md:text-[38px]" : "text-[28px] sm:text-[34px] md:text-[52px] lg:text-[56px]"}`}
            >
              {lines.map((line, index) => (
                <span key={index} className="block">
                  {line}
                </span>
              ))}
            </span>
          </h1>
          {intro.description && (
            <p className="mt-7 max-w-[640px] text-base leading-relaxed text-muted md:text-lg">
              {intro.description}
            </p>
          )}
          {!preview && (
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#projects" className={buttonClass()}>
                프로젝트 보기
                <ArrowRight size={16} />
              </a>
              <a href="#contact" className={buttonClass("secondary")}>
                연락하기
              </a>
            </div>
          )}
        </div>
        {!preview && (
          <dl className="grid gap-5 self-end border-t border-line pt-6 text-sm sm:grid-cols-3 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="mb-1.5 font-mono text-[10px] tracking-widest text-accent">
                  {label}
                </dt>
                <dd className="leading-relaxed break-words">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
