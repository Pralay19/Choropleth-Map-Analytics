import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const TypewriterMarkdown = ({ text, speed = 50, animate }) => {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let i = 0;
    let wordList = text ? text.split(" ") : [];
    let tempText = ""; // Store the progressively built string

    let interval;

    if(animate) {
      interval = setInterval(() => {
      if (i < wordList.length) {
        tempText += (i === 0 ? "" : " ") + wordList[i]; // Concatenate correctly
        setDisplayText(tempText); // Update state with full progress
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    } else {
      setDisplayText(text)
    }

    return () => clearInterval(interval);
  }, [text, speed]);

  return <ReactMarkdown>{displayText}</ReactMarkdown>;
};

export default TypewriterMarkdown;
