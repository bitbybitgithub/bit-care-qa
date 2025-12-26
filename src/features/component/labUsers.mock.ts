import {
  type User,
} from "../../api/UserManagementAPI";

export const getDummyLabUsers = async (): Promise<User[]> => {
  return Promise.resolve([
    {
      userid: 23,
      name: "Guddu",
      status: "Active",
      role: "staff",
      email: "guddu@gmail.com",
      phone: "6547565867",
      username: "guddu@12",
    },
    {
      userid: 22,
      name: "Lallan",
      status: "Active",
      role: "Staff",
      email: "lallan@gmail.com",
      phone: "6767687574",
      username: "lallan@12",
    },
    {
      userid: 21,
      name: "Balram",
      status: "Active",
      role: "staff",
      email: "ballu@gmail.com",
      phone: "7675868576",
      username: "ballu@12",
    },
    {
      userid: 20,
      name: "Nisha",
      status: "Active",
      role: "staff",
      email: "test123456@gmail.com",
      phone: "7674568768",
      username: "test_2345",
    },
    {
      userid: 19,
      name: "Rajesh",
      status: "Active",
      role: "Staff",
      email: "Raju@sdf.com",
      phone: "7764654564",
      username: "StaffRaju",
    },
  ]);
};
export const getDummyPharmacyUsers = async (): Promise<User[]> => {
  return Promise.resolve([
    {
      userid: 301,
      name: "Amit Sharma",
      status: "Active",
      role: "Pharmacist",
      email: "amit.pharma@gmail.com",
      phone: "9000011111",
      username: "amit_pharma",
    },
    {
      userid: 302,
      name: "Neha Verma",
      status: "Active",
      role: "Pharmacist",
      email: "neha.pharma@gmail.com",
      phone: "9000022222",
      username: "neha_pharma",
    },
    {
      userid: 303,
      name: "Rohit Kumar",
      status: "Active",
      role: "Pharmacy Assistant",
      email: "rohit.assist@gmail.com",
      phone: "9000033333",
      username: "rohit_assist",
    },
    {
      userid: 304,
      name: "Pooja Singh",
      status: "Inactive",
      role: "Pharmacy Assistant",
      email: "pooja.assist@gmail.com",
      phone: "9000044444",
      username: "pooja_assist",
    },
    {
      userid: 305,
      name: "Suresh Yadav",
      status: "Active",
      role: "Pharmacy Assistant",
      email: "suresh.assist@gmail.com",
      phone: "9000055555",
      username: "suresh_assist",
    },
  ]);
};
