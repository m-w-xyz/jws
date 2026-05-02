"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import HomeSection from "@/components/HomeSection";
import MobileHomeCenterLabels from "@/components/MobileHomeCenterLabels";
import homepageStyles from "./HomeClient.module.css";

type FeaturedProject = {
  _id: string;
  title: string;
  href: string | null;
  orderNumber?: number;
  projectColour?: string | null;
  imageUrl: string | null;
  hoverImageUrl: string | null;
  imagePosition: "left" | "right";
  blurDataURL?: string;
  hoverBlurDataURL?: string;
};

type HomeClientProps = {
  siteTitle: string;
  featuredProjects: FeaturedProject[];
};

export default function HomeClient({
  siteTitle,
  featuredProjects,
}: HomeClientProps) {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const labelProjects = useMemo(
    () =>
      featuredProjects.map((p) => ({
        title: p.title,
        orderNumber: p.orderNumber,
      })),
    [featuredProjects],
  );

  const setSectionRef = (index: number) => (el: HTMLElement | null) => {
    sectionRefs.current[index] = el;
  };

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main>
      {featuredProjects.length > 0 ? (
        <>
          <div className={homepageStyles.mobileViewportGroup}>
            {/*
             * Mobile ≤767px: isolation wraps hero sections only (bitmap grouping).
             * Caption strip is a sibling so it difference-blends like `.nav`, not inside an isolated stack.
             * Desktop: wrapper uses display:contents so layout unchanged.
             */}
            {featuredProjects.map((project, index) => (
              <HomeSection
                ref={setSectionRef(index)}
                key={project._id}
                title={project.title}
                href={project.href}
                orderNumber={project.orderNumber}
                projectColour={project.projectColour}
                imageUrl={project.imageUrl}
                hoverImageUrl={project.hoverImageUrl}
                imagePosition={project.imagePosition}
                blurDataURL={project.blurDataURL}
                hoverBlurDataURL={project.hoverBlurDataURL}
                transitionPrimary={index === 0}
              />
            ))}
          </div>
          <MobileHomeCenterLabels
            projects={labelProjects}
            sectionRefs={sectionRefs}
          />
        </>
      ) : (
        <section
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--color-accent)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p>{siteTitle}</p>
            <p style={{ marginTop: 20, opacity: 0.5 }}>
              Add featured projects and images in Sanity Studio (/studio)
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
