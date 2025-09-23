import { useDispatch } from "react-redux";
import { FaClinicMedical } from "react-icons/fa";
import { logout } from "../../redux/authSlice";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <FaClinicMedical size={30} className="text-green-600" />
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
