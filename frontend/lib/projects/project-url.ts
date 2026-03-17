interface ProjectUrlTarget {
  id: number | string;
  slug?: string | null;
}

export function getProjectPath(project: ProjectUrlTarget): string {
  const projectIdentifier =
    project.slug && project.slug !== 'null' ? project.slug : String(project.id);

  return `/projects/${projectIdentifier}`;
}
