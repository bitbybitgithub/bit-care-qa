// import React from 'react';
// import { Link, useLocation } from 'react-router-dom';

// interface MenuItem {
//   title: string;
//   link: string;
// }

// const Sidebar: React.FC = () => {
//   const location = useLocation();

//   const Menus: MenuItem[] = [
//     { title: 'Dashboard', link: '/dashboard' },
//     { title: 'Users', link: '/users' },
//     { title: 'Clinic App Settings', link: '/clinic-settings' },
//     { title: 'Clinic Operations', link: '/clinic-operations' },
//   ];

//   return (
//     <aside className="w-56 bg-gray-100 h-screen p-4 shadow-lg">
//       <nav>
//         <ul className="list-none p-0">
//           {Menus.map((menu, index) => {
//             const isActive = location.pathname === menu.link;

//             return (
//               <li key={index} className="my-3">
//                 <Link
//                   to={menu.link}
//                   className={`
//                     block px-4 py-2 rounded-lg font-medium transition-all duration-300
//                     ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-800 hover:bg-blue-100 hover:text-blue-600'}
//                   `}
//                 >
//                   {menu.title}
//                 </Link>
//               </li>
//             );
//           })}
//         </ul>
//       </nav>
//     </aside>
//   );
// };

// export default Sidebar;
       
import React, { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaUsers, FaCog, FaHospital } from "react-icons/fa";

interface MenuItem {
  icon: ReactNode;
  title: string;
  link: string;
}

const Sidebar: React.FC = () => {
  const location = useLocation();

  const Menus: MenuItem[] = [
    { title: "Dashboard", link: "/dashboard", icon: <FaHome /> },
    { title: "Users", link: "/users", icon: <FaUsers /> },
    { title: "Clinic App Settings", link: "/clinic-settings", icon: <FaCog /> },
    { title: "Clinic Operations", link: "/clinic-operations", icon: <FaHospital /> },
  ];

  return (
    <div className="h-full bg-blue-500 text-white rounded-r-3xl p-4 flex flex-col">
      {/* Logo */}
      <div className="mb-10 text-2xl font-bold">Clinic Admin</div>

      {/* Menu */}
      <nav className="flex-1 space-y-3">
        {Menus.map((menu, index) => {
          const isActive = location.pathname === menu.link;

          return (
            <Link
              key={index}
              to={menu.link}
              className={`
                flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${isActive
                  ? "bg-white text-blue-600 font-semibold shadow"
                  : "hover:bg-blue-500"}
              `}
            >
              {menu.icon}
              <span>{menu.title}</span>
            </Link>
          );
        })}
      </nav>

      
    </div>
  );
};

export default Sidebar;
