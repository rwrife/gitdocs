import { useEffect, useState } from 'react';
import { PiChatsFill } from 'react-icons/pi';
import { AskResponse } from './types';
import styles from './css/ask.module.css';
import classNames from 'classnames';
import './css/ask.module.css';
import GitDocsService from "../gitdocs.service";

export default function AskAsish() {
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<AskResponse[]>([]);
  const [chatResponse, setChatResponse] = useState<AskResponse | null>(null);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    if (chatResponse) {
      console.log(chatMessages, chatResponse);
      const messages = chatMessages.map((msg) => {
        if (msg.askId === chatResponse.askId) {
          msg.loading = false;
          msg.answer = chatResponse.answer;
          return msg;
        }
        return msg;
      });
      setChatMessages(messages);
    }
  }, [chatResponse]);

  const AskQuestion = (q: string) => {
    const askId = generateGUID();

    setChatMessages([...chatMessages, {
      question: q,
    }, {
      askId,
      loading: true
    }]);

    GitDocsService.ask(q, askId).then((response) => {
      if (response) {
        setChatResponse(response.data);
      }
    }).catch((error) => {
      console.error(error);
      setChatResponse({
        askId,
        answer: "I am sorry, I am not able to answer that right now. Please try again later.",
      });
    });

    setTimeout(() => {
      setQuestion("");
    }, 10);
  }

  const generateGUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  return (
    <div className={classNames(styles.askAsish, { [styles.expanded]: showChat })}>
      <div onClick={() => setShowChat(!showChat)}
        className={classNames(styles.chatButton, { [styles.expanded]: showChat })}>
        <PiChatsFill /><span className={styles.title}>AskAsish</span></div>
      <div className={styles.responses}>
        {chatMessages.map((msg, i) => (
          <div key={i} className={styles.response}>
            <div className={msg.question ? styles.question : styles.answer}>
              {msg.loading ? <div className={styles.loader} /> : (msg.question || msg.answer)}
            </div>
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
    </div >
  )
}