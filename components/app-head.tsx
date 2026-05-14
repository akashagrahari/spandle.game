import Head from "next/head";

interface Props {
  title?: string;
}

export default function AppHead(props: Props) {
  const { title = "SPANDLE! - Rank the chapters of history by their span" } = props;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content="Rank the chapters of history by their span." />
      <meta property="og:title" content="SPANDLE!" />
      <meta property="og:description" content="Rank the chapters of history by their span." />
      <meta property="og:image" content="https://spandle.akashagrahari.com/og.png" />
      <meta property="og:url" content="https://spandle.akashagrahari.com" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="SPANDLE!" />
      <meta name="twitter:description" content="Rank the chapters of history by their span." />
      <meta name="twitter:image" content="https://spandle.akashagrahari.com/og.png" />
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
