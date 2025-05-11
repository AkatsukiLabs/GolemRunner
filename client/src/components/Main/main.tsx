import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Cover from "../Cover/cover";
import Home from "../Home/home";

function Main() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<Cover />} />
          <Route path="/home" element={<Home />} />
        </Routes>
    </Router>
  );
}

export default Main;
