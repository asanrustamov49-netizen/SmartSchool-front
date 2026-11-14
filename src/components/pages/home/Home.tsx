import { RoleDashboard } from "./RoleDashboard";
import scss from "./home.module.scss";

const Home = () => {
  return (
    <div className={scss.home}>
      <RoleDashboard />
    </div>
  );
};

export default Home;
