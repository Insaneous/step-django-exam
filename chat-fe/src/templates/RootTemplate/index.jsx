import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../redux/slice/authSlice";
import { getCurrentUser } from "../../api/apiClient";
import { Outlet, useNavigate } from "react-router-dom";
import styles from './style.module.css';

export const RootTemplate = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token') || token;

    if (storedToken) {
      getCurrentUser(storedToken)
        .then((response) => {
          const user = response.data;
          dispatch(setUser({ user, token: storedToken }));
          setLoading(false);
        })
        .catch((error) => {
          console.error("Authentication failed", error);
          navigate("/auth");
        });
    } else {
      setLoading(false);
      navigate("/auth");
    }
  }, [dispatch, navigate, token]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      <Outlet />
    </main>
  );
};
