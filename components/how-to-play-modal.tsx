import { AnimatePresence, motion } from "motion/react";
import React from "react";
import * as styles from "../styles/how-to-play-modal.css";

interface Props {
  onClose: () => void;
  open: boolean;
}

export default function HowToPlayModal({ onClose, open }: Props) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          aria-labelledby="how-to-play-title"
          aria-modal="true"
          className={styles.overlay}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={styles.modal}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className={styles.header}>
              <h2 className={styles.title} id="how-to-play-title">
                How to play
              </h2>
              <button
                aria-label="Close"
                className={styles.closeButton}
                onClick={onClose}
                type="button"
              >
                <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
                  <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                </svg>
              </button>
            </div>

            <ol className={styles.steps}>
              <li className={styles.step}>
                <span className={styles.stepNumber}>1</span>
                <span className={styles.stepText}>
                  You&apos;re given a card showing a historical event, empire, reign, or mission. The duration is hidden — you have to guess where it fits.
                </span>
              </li>
              <li className={styles.step}>
                <span className={styles.stepNumber}>2</span>
                <span className={styles.stepText}>
                  <strong>Drag and drop</strong> the card into the timeline so its duration is in the right order — shortest to longest.
                </span>
              </li>
              <li className={styles.step}>
                <span className={styles.stepNumber}>3</span>
                <span className={styles.stepText}>
                  A correct placement keeps the streak going. A wrong placement costs a life. You have <strong>3 lives</strong>.
                </span>
              </li>
              <li className={styles.step}>
                <span className={styles.stepNumber}>4</span>
                <span className={styles.stepText}>
                  The game ends when you run out of lives. Place as many cards correctly as you can!
                </span>
              </li>
            </ol>

            <div className={styles.tip}>
              <span className={styles.tipLabel}>Tip</span>
              The sort key is always <strong>duration</strong>, not the date something happened. A 10-year war goes between a 5-year and a 15-year reign regardless of when it occurred.
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
