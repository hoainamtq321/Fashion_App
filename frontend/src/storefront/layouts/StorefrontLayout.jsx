import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import { Outlet } from "react-router-dom";

const StorefrontLayout = ({ user }) => {

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

export default StorefrontLayout;