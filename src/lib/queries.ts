const imageFields = /* groq */ `
  asset->{
    _id,
    url,
    metadata { lqip, dimensions }
  }
`;

export const SITE_SETTINGS_QUERY = /* groq */ `
  *[_type == "siteSettings"][0] {
    siteTitle,
    email,
    phone,
    instagramHandle,
    location,
    footerDarkLabel,
    footerLightLabel
  }
`;

export const SPLASH_PAGE_QUERY = /* groq */ `
  *[_type == "splashPage"][0] {
    backgroundColour,
    taglinePrefix,
    cyclingWords
  }
`;

export const HOME_PAGE_QUERY = /* groq */ `
  *[
    _type == "project" &&
    defined(title) &&
    defined(slug.current) &&
    count(images) > 0
  ] | order(orderRank asc) {
    _id,
    title,
    "slug": slug.current,
    projectColour,
    description,
    "featuredImage": coalesce(
      images[_type == "image"][0] {
        ${imageFields}
      },
      images[_type == "galleryVideo"][0].thumbnail {
        ${imageFields}
      }
    ),
    "hoverImage": images[_type == "image"][1] {
      ${imageFields}
    }
  }
`;

export const WORKS_PAGE_QUERY = /* groq */ `
  *[
    _type == "project" &&
    defined(title) &&
    defined(slug.current) &&
    count(images) > 0
  ] | order(orderRank asc) {
    _id,
    title,
    "slug": slug.current,
    projectColour,
    description,
    "featuredImage": coalesce(
      images[_type == "image"][0] {
        ${imageFields}
      },
      images[_type == "galleryVideo"][0].thumbnail {
        ${imageFields}
      }
    ),
    "hoverImage": images[_type == "image"][1] {
      ${imageFields}
    }
  }
`;

export const PROJECT_QUERY = /* groq */ `
  *[_type == "project" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    projectColour,
    description,
    images[] {
      _key,
      _type,
      url,
      thumbnail {
        ${imageFields}
      },
      ${imageFields}
    },
    specs[] {
      _key,
      label,
      value,
      url,
      useSpecsContactEmail
    }
  }
`;

export const PROJECT_SLUGS_QUERY = /* groq */ `
  *[
    _type == "project" &&
    defined(slug.current) &&
    defined(title) &&
    count(images) > 0
  ] | order(orderRank asc) {
    "slug": slug.current
  }
`;

export const ABOUT_PAGE_QUERY = /* groq */ `
  *[_type == "aboutPage"][0] {
    portrait {
      ${imageFields}
    },
    bio,
    exhibitions[] {
      _key,
      year,
      name,
      link,
      entries,
      entry
    },
    competitions[] {
      _key,
      year,
      name,
      link,
      entries,
      entry
    },
    residencies[] {
      _key,
      year,
      name,
      link,
      entries,
      entry
    },
    publications[] {
      _key,
      year,
      name,
      link,
      entries,
      entry
    }
  }
`;
