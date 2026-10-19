import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import { Outlet } from "react-router-dom";

const StorefrontLayout = ({ user, isAdmin }) => {

  return (
    <>
      <Header user={user} isAdmin={isAdmin} />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default StorefrontLayout;