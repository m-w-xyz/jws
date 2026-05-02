import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { client, isSanityConfigured } from "@/lib/sanity";
import { getTransitionColours } from "@/lib/get-transition-colours";
import { invertHexColourRgb } from "@/lib/hex-format";
import { SPECS_CONTACT_EMAIL } from "@/lib/specs-contact-email";
import { PROJECT_QUERY, PROJECT_SLUGS_QUERY } from "@/lib/queries";
import ProjectGallery from "@/components/ProjectGallery";
import { TransitionLink } from "@/components/PageTransitionProvider";
import type { SanityGalleryRow } from "@/lib/normalize-gallery";
import styles from "./page.module.css";

type Spec = {
  _key: string;
  label: string;
  value: string;
  url?: string | null;
  useSpecsContactEmail?: boolean | null;
};

function specHref(spec: Spec): string | null {
  if (spec.useSpecsContactEmail) {
    return `mailto:${SPECS_CONTACT_EMAIL}`;
  }
  const u = typeof spec.url === "string" ? spec.url.trim() : "";
  return u || null;
}

function specLinkOpensNewTab(href: string) {
  return /^https?:\/\//i.test(href.trim());
}

type Project = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  images: SanityGalleryRow[];
  specs: Spec[];
  projectColour?: string | null;
};

/** Unknown `/works/...` slugs still run this route so we can call `notFound()`. */
export const dynamicParams = true;

export async function generateStaticParams() {
  if (!isSanityConfigured) return [];
  try {
    const slugs: { slug: string }[] = await client.fetch(PROJECT_SLUGS_QUERY);
    return slugs.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSanityConfigured) {
    return { title: "James Walsh Studio" };
  }
  try {
    const project: Project | null = await client.fetch(PROJECT_QUERY, { slug });
    return {
      title: project
        ? `${project.title} — James Walsh Studio`
        : "James Walsh Studio",
    };
  } catch {
    return { title: "James Walsh Studio" };
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let project: Project | null = null;
  let orderNumber: number | null = null;
  let prevSlug: string | null = null;
  let nextSlug: string | null = null;
  if (isSanityConfigured) {
    try {
      const [fetchedProject, slugList] = await Promise.all([
        client.fetch<Project | null>(PROJECT_QUERY, { slug }),
        client.fetch<{ slug: string }[]>(PROJECT_SLUGS_QUERY),
      ]);
      project = fetchedProject;
      const idx = slugList.findIndex((s) => s.slug === slug);
      orderNumber = idx >= 0 ? idx + 1 : null;
      if (idx >= 0 && slugList.length > 0) {
        prevSlug = idx > 0 ? slugList[idx - 1].slug : null;
        nextSlug =
          idx < slugList.length - 1 ? slugList[idx + 1].slug : null;
      }
    } catch {
      // Sanity not connected
    }
  }

  if (!project) notFound();

  const { splashColour, projectColours } = await getTransitionColours();
  const baseHighlight = projectColours[slug] ?? splashColour;
  const selectionHighlight =
    invertHexColourRgb(baseHighlight) ?? baseHighlight;

  const descriptionParagraphs = project.description
    ? project.description.split("\n").filter(Boolean)
    : [];

  return (
    <main
      className={styles.page}
      style={
        {
          "--selection-highlight": selectionHighlight,
        } as CSSProperties
      }
    >
      <div className={styles.galleryCol}>
        <ProjectGallery
          gallery={project.images}
          projectTitle={project.title}
          projectColour={project.projectColour ?? null}
        />
      </div>

      <div className={styles.infoCol}>
        <div className={styles.infoColInner}>
          <div className={styles.header}>
            {orderNumber !== null && (
              <span className={styles.orderNumber}>{orderNumber}</span>
            )}
            <span className={styles.title}>{project.title}</span>
          </div>

          <div className={styles.description}>
            {descriptionParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {project.specs?.length > 0 && (
            <div className={styles.specs}>
              {project.specs.map((spec) => {
                const href = specHref(spec);
                return (
                  <div key={spec._key} className={styles.specRow}>
                    <span className={styles.specLabel}>{spec.label}</span>
                    {href ? (
                      <a
                        href={href}
                        className={styles.specValue}
                        {...(specLinkOpensNewTab(href)
                          ? {
                              target: "_blank" as const,
                              rel: "noopener noreferrer",
                            }
                          : {})}
                      >
                        {spec.value}
                      </a>
                    ) : (
                      <span className={styles.specValue}>{spec.value}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {(prevSlug || nextSlug) && (
        <nav
          className={[
            styles.projectAdjacentNav,
            !prevSlug ? styles.projectAdjacentNavNextOnly : "",
            !nextSlug ? styles.projectAdjacentNavPrevOnly : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label="Adjacent projects"
        >
          {prevSlug ? (
            <TransitionLink
              href={`/works/${prevSlug}`}
              className={styles.projectAdjacentLink}
              transitionColour={projectColours[prevSlug] ?? null}
            >
              Previous project
            </TransitionLink>
          ) : null}
          {nextSlug ? (
            <TransitionLink
              href={`/works/${nextSlug}`}
              className={styles.projectAdjacentLink}
              transitionColour={projectColours[nextSlug] ?? null}
            >
              Next project
            </TransitionLink>
          ) : null}
        </nav>
      )}
    </main>
  );
}
