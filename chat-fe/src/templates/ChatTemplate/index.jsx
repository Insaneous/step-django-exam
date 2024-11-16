import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChats } from '../../redux/slice/chatSlice';
import { fetchUsers } from '../../redux/slice/userSlice';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slice/authSlice';
import styles from './style.module.css';
import logo from '../../assets/logo_white.svg';
import search from '../../assets/search.svg';
import { createOrGetChat } from '../../api/apiClient';

export const ChatTemplate = () => {
  const tabs = ['Chats', 'Users'];
  const dropdownItems = ['Logout'];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const chats = useSelector((state) => state.chat.chats);
  const users = useSelector((state) => state.users.users);
  const currentUser = useSelector((state) => state.auth.user);
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Chats');

  useEffect(() => {
    if (activeTab === 'Chats') {
      dispatch(fetchChats());
    } else if (activeTab === 'Users') {
      dispatch(fetchUsers());
    }
  }, [dispatch, activeTab]);

  const handleLogout = () => {
    dispatch(logout());
    setIsDropdownOpen(false);
  };

  const handleUserClick = async (username) => {
    try {
      const response = await createOrGetChat(username);
      const chatId = response.data.id;
      navigate(`/chat/${chatId}`);
      setActiveTab('Chats');
    } catch (error) {
      console.error('Error creating or fetching chat:', error);
    }
  };

  return (
    <div className={styles.home}>
      <nav className={styles.home__nav}>
        <div className={styles.home__nav}>
          <div className={styles.home__nav__head}>
            <div className={styles.home__nav__burger}>
              <div
                className={styles.home__nav__burger__icon}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
              />
              {isDropdownOpen && (
                <div className={styles.home__nav__dropdown}>
                  {dropdownItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={handleLogout}
                      className={styles.home__nav__dropdown__item}
                      id={`${item.toLowerCase()}__btn`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <form className={styles.home__nav__search}>
              <input
                type="text"
                placeholder="Search"
                className={styles.home__nav__search__input}
              />
              <img
                src={search}
                alt="search"
                className={styles.home__nav__search__icon}
              />
            </form>
          </div>
          <ul className={styles.home__nav__tabs}>
            {tabs.map((tab, idx) => (
              <li
                key={idx}
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? styles.activeTab : ''}
              >
                {tab}
              </li>
            ))}
          </ul>
        </div>
        <ul className={styles.home__nav__chats}>
          {activeTab === 'Chats' && chats.length > 0 ? (
            chats.map((chat) => {
              const isActive = location.pathname === `/chat/${chat.id}`;
              const lastMessageText = chat.last_message || 'No messages yet';
              const truncatedLastMessage =
                lastMessageText.length > 35
                  ? lastMessageText.substring(0, 35) + '...'
                  : lastMessageText;

              return (
                <li key={chat.id} className={isActive ? styles.activeChat : ''}>
                  <Link to={`/chat/${chat.id}`}>
                    <img src={logo} alt="" />
                    <div>
                      <span>
                        {chat.type === 'personal'
                          ? chat.users.find(
                              (user) =>
                                user.username !== currentUser?.username
                            )?.username
                          : chat.name}
                      </span>
                      <p className={styles.lastMessage}>
                        {truncatedLastMessage}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })
          ) : activeTab === 'Users' && users.length > 0 ? (
            users.map((user, index) => user.username !== currentUser?.username ? (
              <li key={index} onClick={() => handleUserClick(user.username)}>
                <Link to="#">
                  <img src={logo} alt="user-avatar" />
                  <div>
                    <span>{user.username}</span>
                  </div>
                </Link>
              </li>
            ) : '')
          ) : (
            <p>No users available</p>
          )}
        </ul>
      </nav>
      <Outlet />
    </div>
  );
};
