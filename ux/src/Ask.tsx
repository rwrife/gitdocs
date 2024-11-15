import { useState } from 'react';
import { PiChatsFill } from 'react-icons/pi';
import { AskResponse } from './types';
import styles from './css/ask.module.css';
import classNames from 'classnames';
import './css/ask.module.css';
import GitDocsService from "../gitdocs.service";

export default function AskAsish() {
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<AskResponse[]>([]);
  const [question, setQuestion] = useState("");

  const AskQuestion = (q: string) => {
    GitDocsService.ask(q).then((response) => {
      if (response) {
        setChatMessages([...chatMessages, {
          question: q,
        }, response.data]);
      }
    }).catch((error) => {
      console.error(error);
      setChatMessages([...chatMessages, {
        answer: "I am sorry, I am not able to answer that right now. Please try again later."
      }]);
    });
    setTimeout(() => {
      setQuestion("");
    }, 10);
  }

  return (
    <div className={classNames(styles.askAsish, { [styles.expanded]: showChat })}>
      <div onClick={() => setShowChat(!showChat)}
        className={classNames(styles.chatButton, { [styles.expanded]: showChat })}>
        <PiChatsFill /><span className={styles.title}>AskAsish</span></div>
      <div className={styles.responses}>
        {chatMessages.map((msg, i) => (
          <div key={i} className={styles.response}>
            <div className={msg.question ? styles.question : styles.answer}>{msg.question || msg.answer}</div>
          </div>
        ))}
      </div>
      <textarea rows={2} value={question} type="text" placeholder="Ask Asish anything..." onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => {
        if (e.key === 'Enter') {
          if (e.target.value.length > 0) {
            AskQuestion(e.target.value);
          }
        }
      }} />
    </div>
  )
}