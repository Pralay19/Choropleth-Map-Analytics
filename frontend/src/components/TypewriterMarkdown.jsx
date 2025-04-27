import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

const TypewriterMarkdown = ({ text, speed = 50, animate }) => {
  const [displayText, setDisplayText] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    if (!animate) {
      setDisplayText(text);
      return;
    }

    let wordList = text ? text.split(" ") : [];
    let tempText = "";
    let i = 0;
    let startTime = Date.now();

    const step = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      const expectedWords = Math.floor(elapsed / speed);

      if (expectedWords > i) {
        while (i < expectedWords && i < wordList.length) {
          tempText += (i === 0 ? "" : " ") + wordList[i];
          i++;
        }
        setDisplayText(tempText);
      }

      if (i < wordList.length) {
        timerRef.current = setTimeout(step, speed / 2); // recheck faster
      }
    };

    step(); // start

    return () => clearTimeout(timerRef.current);
  }, [text, speed]);

  return <ReactMarkdown>{displayText}</ReactMarkdown>;
};

export default TypewriterMarkdown;
