import React from "react";
import ButtonLink from "./button-link";
import Button from "./button";
import HowToPlayModal from "./how-to-play-modal";
import PageShell from "./page-shell";
import SiteFooter from "./site-footer";
import SiteHero from "./site-hero";
import * as styles from "../styles/home-screen.css";

export default function HomeScreen() {
  const [howToPlayOpen, setHowToPlayOpen] = React.useState(false);

  return (
    <PageShell showHeader={false}>
      <div className={styles.home}>
        <div className={styles.wrapper}>
          <div className={styles.stage}>
            <SiteHero subtitle="Order the chapters of history by their span." />
            <div className={styles.actions}>
              <ButtonLink fullWidth href="/daily" text="Daily" />
              <ButtonLink fullWidth href="/play" minimal text="Free play" />
              <ButtonLink fullWidth href="/room" minimal text="Play with friends" />
              <Button fullWidth minimal onClick={() => setHowToPlayOpen(true)} text="How to play" />
            </div>
          </div>
          <SiteFooter className={styles.footer} />
        </div>
      </div>
      <HowToPlayModal onClose={() => setHowToPlayOpen(false)} open={howToPlayOpen} />
    </PageShell>
  );
}
