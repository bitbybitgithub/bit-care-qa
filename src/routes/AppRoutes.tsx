import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../features/Login/login";
import Dashboard from "../features/component/Dashboard";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
