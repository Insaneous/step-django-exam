import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChatById, sendMessage } from '../../redux/slice/chatSlice';
import styles from './style.module.css';
import { useWebsocket } from '../../hooks/useWebsocket';

export const ChatPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const chat = useSelector((state) => state.chat.selectedChat);
  const message = useRef();
  const chatMessagesEnd = useRef(null);
  const currentUser = useSelector((state) => state.auth.user);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    dispatch(fetchChatById(id));
  }, [dispatch, id]);

  useWebsocket(chat?.id);

  const scrollToBottom = () => {
    chatMessagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.data]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setFileName(file ? file.name : "");
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFileName("");
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    const messageText = message.current?.value.trim();
    if (!messageText) return;

    const formData = new FormData();
    formData.append('text', messageText);
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    setIsSending(true);
    try {
      dispatch(sendMessage({ chatId: id, formData }));
      message.current.value = '';
      clearSelectedFile();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  };

  if (!chat) return <div>Loading...</div>;

  if (chat.error) {
    return <div>Error loading chat. Please try again later.</div>;
  }

  return (
    <div className={styles.chat}>
      <h1>{chat.name}</h1>
      <div className={styles.chat__messages}>
        {chat.data?.map((msg, idx) => (
          <div
            key={idx}
            className={msg.user_id === currentUser.id ? styles.chat__sent : styles.chat__received}
          >
            <div>
              <p>{msg.text}
              {msg.file && (
                <>
                  {msg.file.endsWith('.jpg') || msg.file.endsWith('.png') || msg.file.endsWith('.jpeg') || msg.file.endsWith('.gif') ? (
                    <img src={msg.file} alt="file" className={styles.chat__file} />
                  ) : (
                    <a href={msg.file} target="_blank" rel="noopener noreferrer" download>
                      📎Download {msg.file.split('/').pop()}
                    </a>
                  )}
                </>
              )}</p>
            </div>
          </div>
        ))}
        <div ref={chatMessagesEnd}></div>
      </div>
      <form onSubmit={handleSend} className={styles.chat__form} encType="multipart/form-data">
        <input type="text" ref={message} placeholder="Type a message" />
        <div className={styles.fileUploadWrapper}>
          <input
            type="file"
            id="file-input"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-input" className={styles.fileUploadLabel}>
            {fileName ? "Change" : "Upload"}
          </label>
        </div>
        {fileName && (
          <span onClick={clearSelectedFile} className={styles.fileNameDisplay} style={{ cursor: 'pointer' }}>
            {fileName}
          </span>
        )}
        <button type="submit" disabled={isSending}>
          {isSending ? 'Sending...' : '➤'}
        </button>
      </form>
    </div>
  );
};