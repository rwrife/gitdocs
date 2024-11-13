import { useState } from 'react';
import { PiChatsFill } from 'react-icons/pi';


export default function AskAsish() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className={`askasish ${showChat ? 'expanded' : ''}`}>
      <div onClick={() => setShowChat(!showChat)} className={`chatbutton ${showChat ? 'expanded' : ''}`}><PiChatsFill /><span className="title">AskAsish</span></div>
      <textarea rows={2} type="text" placeholder="Ask Asish anything..." />
    </div>
  )
}