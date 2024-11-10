import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChats } from '../../redux/slice/chatSlice';
import { Link } from 'react-router-dom';
import styles from './style.module.css';

export const HomePage = () => {
  const dispatch = useDispatch();
  const chats = useSelector((state) => state.chat.chats); // The list of chats from the state
  const currentUser = useSelector((state) => state.auth.user); // Assuming user data is in state.auth.user
  
  console.log(chats);

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  return (
    <div>
      <h1>Chats</h1>
      <ul>
        {chats && chats.length > 0 ? (
          chats.map((chat) => (
            <li key={chat.id}>
              <Link to={`/chat/${chat.id}`}>
                {chat.type === 'personal' ? 
                chat.users.find(user => user.username !== currentUser?.username)?.username : 
                chat.name}
              </Link>
            </li>
          ))
        ) : (
          <p>No chats available</p>
        )}
      </ul>
    </div>
  );
};
