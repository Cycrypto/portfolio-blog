import { portfolioReference as ref } from "@/data/portfolio-reference";
export const dynamic = "force-static";
export default function Page() {
  return (
    <main
      id="main"
      className="mx-auto max-w-3xl bg-white px-10 py-12 font-reference text-black"
    >
      <h1 className="font-display text-3xl">{ref.intro.profile.name}</h1>
      <p className="mt-2 text-lg">{ref.intro.profile.role}</p>
      <p className="mt-2 text-sm">
        {ref.intro.profile.facts[0].text} · {ref.contact.channels[0].value}
      </p>
      <h2 className="mt-8 border-b pb-2 text-xl">About</h2>
      <p className="mt-3 text-sm leading-relaxed">{ref.about.description}</p>
      <h2 className="mt-8 border-b pb-2 text-xl">Experience</h2>
      {ref.experience.companies.map((c) =>
        c.roles.map((r) => (
          <article key={r.sourceNodeId} className="mt-5 break-inside-avoid">
            <h3 className="font-medium">
              {r.title} · {c.name}
            </h3>
            <p className="text-xs text-gray-600">{r.period}</p>
            <p className="mt-2 text-sm">{r.description}</p>
          </article>
        )),
      )}
      <h2 className="mt-8 border-b pb-2 text-xl">Education</h2>
      {ref.education.items.map((i) => (
        <article key={i.degree} className="mt-4 break-inside-avoid">
          <h3>{i.degree}</h3>
          <p className="text-sm">
            {i.institution} · {i.period}
          </p>
        </article>
      ))}
      <h2 className="mt-8 border-b pb-2 text-xl">Skills</h2>
      <p className="mt-3 text-sm">{ref.skills.items.join(" · ")}</p>
    </main>
  );
}
