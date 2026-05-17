import classNames from "classnames";
// import GitHubButton from "react-github-btn";
import * as ui from "../styles/ui.css";

interface Props {
  className?: string;
}

export default function SiteFooter(props: Props) {
  const { className } = props;

  return (
    <div className={classNames(ui.footerNotes, className)}>
      <div>
        All data sourced from{" "}
        <a
          href="https://www.wikidata.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Wikidata
        </a>{" "}
        and{" "}
        <a
          href="https://www.wikipedia.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Wikipedia
        </a>
        .
      </div>
      <div>
        Inspired by{" "}
        <a
          href="https://wikitrivia.tomjwatson.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          WikiTrivia
        </a>
        {" · "}
        <a
          href="https://github.com/akashagrahari/spandle.game"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source on GitHub
        </a>
      </div>
      <div>
        <a
          href="https://buymeacoffee.com/akashagrahari"
          target="_blank"
          rel="noopener noreferrer"
        >
          ☕ Buy me a coffee
        </a>
      </div>
      {/*
      <div className={ui.githubButtonSlot}>
        <GitHubButton
          href="https://github.com/tom-james-watson/wikitrivia"
          data-size="large"
          data-show-count="true"
          aria-label="Star tom-james-watson/wikitrivia on GitHub"
        >
          Star
        </GitHubButton>
      </div>
      */}
    </div>
  );
}
