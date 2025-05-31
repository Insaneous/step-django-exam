import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../redux/slice/authSlice";
import { getCurrentUser } from "../../api/apiClient";
import { Outlet, useNavigate } from "react-router-dom";

export const RootTemplate = () => {
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
        })
        .catch((error) => {
          console.error("Authentication failed", error);
          navigate("/auth");
        });
    } else {
      navigate("/auth");
    }
  }, [dispatch, navigate, token]);



  return (
    <main>
      <Outlet />
    </main>
  );
};
