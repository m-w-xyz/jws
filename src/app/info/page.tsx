import Image from "next/image";
import { client, urlFor, isSanityConfigured } from "@/lib/sanity";
import { ABOUT_PAGE_QUERY } from "@/lib/queries";
import { getSiteSettings } from "@/lib/get-site-settings";
import BioParagraphs from "@/components/BioWithLinks";
import InfoContactColumn from "@/components/InfoContactColumn";
import {
  InfoGravityProvider,
  InfoGravityMain,
} from "@/components/InfoGravityContext";
import InfoPortraitHoverEyes from "@/components/InfoPortraitHoverEyes";
import {
  CvSectionBlock,
  type AboutCvClassNames,
} from "@/components/AboutCvBlocks";
import { normalizeAndSortCvItems } from "@/lib/about-cv";
import styles from "./page.module.css";

export const metadata = {
  title: "Info — James Walsh Studio",
};

type RawCvItem = {
  _key: string;
  year?: string;
  name?: string;
  link?: string;
  entry?: string;
  entries?: string[];
};

type AboutData = {
  portrait?: {
    asset: {
      url: string;
      metadata?: { lqip?: string; dimensions?: { width: number; height: number } };
    };
  };
  bio: string;
  exhibitions: RawCvItem[];
  competitions: RawCvItem[];
  residencies: RawCvItem[];
  publications: RawCvItem[];
};

const cvCls: AboutCvClassNames = {
  cvSection: styles.cvSection,
  cvSectionTitle: styles.cvSectionTitle,
  cvEntry: styles.cvEntry,
  cvYear: styles.cvYear,
  cvMain: styles.cvMain,
  cvName: styles.cvName,
  cvNameLink: styles.cvNameLink,
};

export default async function InfoPage() {
  const settings = await getSiteSettings();
  let about: AboutData | null = null;

  if (isSanityConfigured) {
    try {
      about = await client.fetch(ABOUT_PAGE_QUERY);
    } catch {
      // Sanity not connected
    }
  }

  const bioParagraphs = about?.bio?.split("\n").filter(Boolean) ?? [];
  const instagramUsername = settings.instagramHandle.replace("@", "");

  const exhibitions = normalizeAndSortCvItems(about?.exhibitions);
  const competitions = normalizeAndSortCvItems(about?.competitions);
  const residencies = normalizeAndSortCvItems(about?.residencies);
  const publications = normalizeAndSortCvItems(about?.publications);

  return (
    <InfoGravityProvider>
      <InfoGravityMain className={styles.page}>
        <div className={styles.layout}>
          <div className={styles.contactCol}>
            <div className={styles.contactInner}>
              <InfoContactColumn
                email={settings.email}
                phone={settings.phone}
                instagramHandle={settings.instagramHandle}
                instagramUsername={instagramUsername}
                location={settings.location}
                contactLineClass={styles.contactLine}
                contactGapClass={styles.contactGap}
              />
            </div>
          </div>

        <div className={styles.portraitCol}>
          {about?.portrait && (
            <div className={styles.portraitAnchor}>
              <div className={styles.portrait} data-physics-portrait>
                <InfoPortraitHoverEyes
                  eyesSrc="/images/jws-eyes.svg"
                  eyesHelloSrc="/images/jws-eyes-hello.svg"
                >
                  <Image
                    src={urlFor(about.portrait).width(700).quality(85).url()}
                    alt="James Walsh"
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
                    placeholder={about.portrait.asset?.metadata?.lqip ? "blur" : "empty"}
                    blurDataURL={about.portrait.asset?.metadata?.lqip}
                  />
                </InfoPortraitHoverEyes>
              </div>
            </div>
          )}
        </div>

        <div className={styles.cvCol}>
          {bioParagraphs.length > 0 && (
            <div className={styles.bio}>
              <BioParagraphs
                paragraphs={bioParagraphs}
                email={settings.email}
                instagramUsername={instagramUsername}
              />
            </div>
          )}

          <CvSectionBlock title="Exhibitions" items={exhibitions} cls={cvCls} />
          <CvSectionBlock title="Competitions" items={competitions} cls={cvCls} />
          <CvSectionBlock title="Residencies" items={residencies} cls={cvCls} />
          <CvSectionBlock
            title="Publications"
            items={publications}
            cls={cvCls}
          />
        </div>
      </div>
      </InfoGravityMain>
    </InfoGravityProvider>
  );
}
