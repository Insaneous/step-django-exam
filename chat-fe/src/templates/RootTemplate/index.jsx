import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../redux/slice/authSlice"; // Assuming this is where your action resides
import { getCurrentUser } from "../../api/apiClient"; // Import your getCurrentUser function
import { Outlet, useNavigate } from "react-router-dom";
import styles from './style.module.css';

export const RootTemplate = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth); // Access token from redux store
  
  useEffect(() => {
    // Check if token exists
    const storedToken = localStorage.getItem('access_token') || token;

    if (storedToken) {
      // Fetch current user if a valid token exists
      getCurrentUser(storedToken)
        .then((response) => {
          // Here, only pass the necessary serializable data
          const user = response.data;
          dispatch(setUser({ user, token: storedToken })); // Update user and token in Redux
          setLoading(false);
        })
        .catch((error) => {
          console.error("Authentication failed", error);
          navigate("/auth"); // Redirect to login page if authentication fails
        });
    } else {
      setLoading(false); // No token, stop loading and navigate to login
      navigate("/auth");
    }
  }, [dispatch, navigate, token]);

  if (loading) {
    return <div>Loading...</div>; // You can add a loading spinner or screen here
  }

  return (
    <main>
      <Outlet />
    </main>
  );
};
