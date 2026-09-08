import Header from "../components/Layouts/Header/Header";
import Footer from "../components/Layouts/Footer/Footer";
import { Outlet } from "react-router-dom";

const MainLayout = ({ user }) => {

  return (
    <>
      <Header user={user} />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default MainLayout;