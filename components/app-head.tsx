import Head from "next/head";

interface Props {
  title?: string;
}

export default function AppHead(props: Props) {
  const { title = "SPANDLE! - Rank the chapters of history by their span" } = props;

  return (
    <Head>
      <title>{title}</title>
      <link
        rel="preload"
        href="/fonts/inter-latin.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/fraunces-latin.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    </Head>
  );
}
