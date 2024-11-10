import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChatById, sendMessage } from '../../redux/slice/chatSlice';
import styles from './style.module.css';

export const ChatPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const chat = useSelector((state) => state.chat.selectedChat);
  const [message, setMessage] = useState('');
  console.log(chat);

  useEffect(() => {
    dispatch(fetchChatById(id));
  }, [dispatch, id]);

  const handleSend = () => {
    if (message.trim()) {
      dispatch(sendMessage({ chatId: id, message }));
      setMessage('');
    }
  };

  if (!chat) return <div>Loading...</div>;

  return (
    <div>
      <h1>{chat.name}</h1>
      <div>
        {chat.data.map((msg, idx) => (
          <p key={idx}>{msg.text}</p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
