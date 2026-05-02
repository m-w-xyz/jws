import { client, urlFor, isSanityConfigured } from "@/lib/sanity";
import { WORKS_PAGE_QUERY } from "@/lib/queries";
import { normalizeHexColour } from "@/lib/get-transition-colours";
import WorksMobileGate from "@/components/WorksMobileGate";
import ProjectCard from "@/components/ProjectCard";
import styles from "./page.module.css";

export const metadata = {
  title: "Works — James Walsh Studio",
};

type ProjectImage = {
  asset: {
    url: string;
    metadata?: { lqip?: string };
  };
};

type Project = {
  _id: string;
  title?: string;
  slug?: string;
  projectColour?: string | null;
  description?: string;
  featuredImage?: ProjectImage;
  hoverImage?: ProjectImage;
};

export default async function WorksPage() {
  let projects: Project[] = [];

  if (isSanityConfigured) {
    try {
      projects = await client.fetch(WORKS_PAGE_QUERY);
    } catch {
      // Sanity not connected
    }
  }

  const visibleProjects = projects.filter(
    (project) =>
      typeof project.title === "string" && project.title.trim().length > 0,
  );

  return (
    <WorksMobileGate>
    <main className={styles.page}>
      <div className={styles.grid}>
        {visibleProjects.map((project, index) => {
          const href = project.slug ? `/works/${project.slug}` : null;

          return (
            <div key={project._id} className={styles.cardWrap}>
              <ProjectCard
                title={project.title as string}
                href={href}
                orderNumber={index + 1}
                projectColour={
                  normalizeHexColour(project.projectColour ?? undefined) ?? null
                }
                thumbnailUrl={
                  project.featuredImage
                    ? urlFor(project.featuredImage).width(900).quality(80).url()
                    : null
                }
                hoverThumbnailUrl={
                  project.hoverImage
                    ? urlFor(project.hoverImage).width(900).quality(80).url()
                    : null
                }
                blurDataURL={project.featuredImage?.asset?.metadata?.lqip}
                hoverBlurDataURL={project.hoverImage?.asset?.metadata?.lqip}
              />
            </div>
          );
        })}
      </div>
    </main>
    </WorksMobileGate>
  );
}
