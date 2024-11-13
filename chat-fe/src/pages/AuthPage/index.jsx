import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { checkUser, login, register, resetUserExists } from "../../redux/slice/authSlice";
import styles from './style.module.css';
import logo from '../../assets/logo.svg';

export const AuthPage = () => {
  const emailOrUsername = useRef();
  const emailLogin = useRef();
  const passwordLogin = useRef();
  const emailRegister = useRef();
  const usernameRegister = useRef();
  const passwordRegister = useRef();
  const checkFormRef = useRef();
  const loginFormRef = useRef();
  const registerFormRef = useRef();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userExists = useSelector((state) => state.auth.userExists);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(checkUser(emailOrUsername.current.value));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        email_or_username: emailLogin.current.value,
        password: passwordLogin.current.value,
      };
      await dispatch(login(userData)).unwrap();
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        email: emailRegister.current.value,
        username: usernameRegister.current.value,
        password: passwordRegister.current.value,
      };
      await dispatch(register(userData)).unwrap();
      navigate('/');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleBack = () => {
    const checkForm = checkFormRef.current;
    const loginForm = loginFormRef.current;
    const registerForm = registerFormRef.current;
  
    checkForm.style.display = 'flex';
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
  
    // Reset userExists state to null
    dispatch(resetUserExists());
  };  

  useEffect(() => {
    if (userExists !== null) {
      const checkForm = checkFormRef.current;
      const loginForm = loginFormRef.current;
      const registerForm = registerFormRef.current;

      if (userExists) {
        checkForm.style.display = 'none';
        loginForm.style.display = 'flex';
        emailLogin.current.value = emailOrUsername.current.value;
      } else {
        checkForm.style.display = 'none';
        registerForm.style.display = 'flex';
        if (emailOrUsername.current.value.includes('@')) {
          emailRegister.current.value = emailOrUsername.current.value;
        } else {
          usernameRegister.current.value = emailOrUsername.current.value;
        }
      }
    }
  }, [userExists]);

  useEffect(() => {
    checkFormRef.current.style.display = 'flex';
    loginFormRef.current.style.display = 'none';
    registerFormRef.current.style.display = 'none';
  }, []);

  return (
    <div className={styles.auth}>
      <img src={logo} alt="logo" className={styles.auth__logo} />
      <h4>Welcome to Instagraph!</h4>
      <p>Please sign in or register to continue.</p>
      <div className={styles.auth__form__container}>
        <form onSubmit={handleSubmit} ref={checkFormRef} name="check" className={styles.auth__form}>
          <div>
            <input type="text" ref={emailOrUsername} className={styles.auth__input} />
            <label htmlFor="emailOrUsername" className={styles.auth__label}>Email or username</label>
          </div>
          <button className={styles.auth__button}>Next</button>
        </form>

        <form onSubmit={handleLogin} ref={loginFormRef} name="login" style={{ display: 'none' }} className={styles.auth__form}>
          <div>
            <input type="text" ref={emailLogin} className={styles.auth__input} />
            <label htmlFor="emailOrUsername" className={styles.auth__label}>Email or username</label>
          </div>
          <div>
            <input type="password" ref={passwordLogin} className={styles.auth__input} />
            <label htmlFor="passwordLogin" className={styles.auth__label}>Password</label>
          </div>
          <button className={styles.auth__button}>Login</button>
          <button type="button" onClick={handleBack} className={styles.auth__button__back}>Back</button>
        </form>

        <form onSubmit={handleRegister} ref={registerFormRef} name="register" style={{ display: 'none' }} className={styles.auth__form}>
          <div>
            <input type="email" ref={emailRegister} className={styles.auth__input} />
            <label htmlFor="emailRegister" className={styles.auth__label}>Email</label>
          </div>
          <div>
            <input type="text" ref={usernameRegister} className={styles.auth__input} />
            <label htmlFor="usernameRegister" className={styles.auth__label}>Username</label>
          </div>
          <div>
            <input type="password" ref={passwordRegister} className={styles.auth__input} />
            <label htmlFor="passwordRegister" className={styles.auth__label}>Password</label>
          </div>
          <button className={styles.auth__button}>Register</button>
          <button type="button" onClick={handleBack} className={styles.auth__button__back}>Back</button>
        </form>
      </div>
    </div>
  );
};
