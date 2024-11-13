import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addMessageFromWebSocket, fetchMessageById } from '../redux/slice/chatSlice';

export const useWebsocket = (chatId) => {
  const socket = useRef(null);
  const dispatch = useDispatch();
  const reconnectInterval = useRef(null);
  const chat = useSelector((state) => state.chat.selectedChat);

  useEffect(() => {
    if (!chatId) return; // Avoid connecting if chatId is not valid

    const token = localStorage.getItem('access_token');
    const connectWebSocket = () => {
      socket.current = new WebSocket(`ws://localhost:8000/ws/${chatId}?token=${token}`);

      // Handle incoming messages
      socket.current.onmessage = async (event) => {
        try {
          const message_id = event.data;
          if (message_id) {
            
            const response = await dispatch(fetchMessageById(message_id));
            dispatch(addMessageFromWebSocket({ chatId, message: response.payload }));
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };

      // Handle WebSocket errors
      socket.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      // Handle connection closure
      socket.current.onclose = (event) => {
        console.warn('WebSocket closed:', event.reason);
        
        // Optionally attempt reconnection after a delay if the connection is lost
        reconnectInterval.current = setTimeout(() => {
          console.log('Reconnecting WebSocket...');
          connectWebSocket();
        }, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectInterval.current) {
        clearTimeout(reconnectInterval.current);
      }
      if (socket.current && socket.current.readyState === WebSocket.OPEN) {
        socket.current.close();
      }
    };
  }, [chatId]); // Depend only on chatId

  return socket.current;
};
