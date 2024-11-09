import { Outlet } from "react-router-dom"
import { Header } from "../../components/Header"
import { Footer } from "../../components/Footer"
import styles from './style.module.css';


export const RootTemplate = () => {
  return (
    <main>
        <Header />
        <Outlet />
        <Footer />
    </main>
  )
}