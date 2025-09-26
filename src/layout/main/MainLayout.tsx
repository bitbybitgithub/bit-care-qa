import { Outlet } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
const MainLayout =() => {
    return (
        <div className="flex h-screen">
            {/* Sidebar - 20% width */}
            <div className="w-1/5 min-w-[200px] max-w-xs">
                <Sidebar />
            </div>
            {/* Main Content - 80% width */}
            <div className="flex-1 bg-gray-100 p-3 overflow-auto">
                <Outlet />
            </div>
        </div>
    );
};

export default MainLayout;