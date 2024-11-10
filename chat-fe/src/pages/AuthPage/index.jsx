import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { checkUser, login, register } from "../../redux/slice/authSlice";

export const AuthPage = () => {
  const emailOrUsername = useRef();
  const emailLogin = useRef();
  const passwordLogin = useRef();
  const emailRegister = useRef();
  const usernameRegister = useRef();
  const passwordRegister = useRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userExists = useSelector((state) => state.auth.userExists);
  const checkForm = document.forms.check;
  const loginForm = document.forms.login;
  const registerForm = document.forms.register;


  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(emailOrUsername.current.value);
    dispatch(checkUser(emailOrUsername.current.value));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    try {
      const userData = { 
        email_or_username: emailLogin.current.value, 
        password: passwordLogin.current.value 
    };
      dispatch(login(userData));
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    try {
      const userData = { 
        email: emailRegister.current.value, 
        username: usernameRegister.current.value, 
        password: passwordRegister.current.value 
    };
      dispatch(register(userData));
      navigate('/');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  useEffect(() => {
    if (userExists) {
      checkForm.hidden = true;
      loginForm.hidden = false;
      emailLogin.current.value = emailOrUsername.current.value;
    }
    else if (userExists === false) {
      checkForm.hidden = true;
      registerForm.hidden = false;
      if (emailOrUsername.current.value.includes('@')) {
        emailRegister.current.value = emailOrUsername.current.value;
      } else {
        usernameRegister.current.value = emailOrUsername.current.value;
      }
    }
  }, [userExists]);
  
  return (
    <div>
      <h1>Welcome!</h1>
      <form onSubmit={handleSubmit} name="check">
        <input type="text" placeholder="Email or username" ref={emailOrUsername} />
        <button>Submit</button>
      </form>
      <form onSubmit={handleLogin} name="login" hidden>
        <input
          type="text"
          placeholder="Email or Username"
          ref={emailLogin}
        />
        <input
          type="password"
          placeholder="Password"
          ref={passwordLogin}
        />
        <button type="submit">Login</button>
      </form>
      <form onSubmit={handleRegister} name="register" hidden>
        <input
          type="email"
          placeholder="Email"
          ref={emailRegister}
        />
        <input
          type="text"
          placeholder="Username"
          ref={usernameRegister}
        />
        <input
          type="password"
          placeholder="Password"
          ref={passwordRegister}
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}