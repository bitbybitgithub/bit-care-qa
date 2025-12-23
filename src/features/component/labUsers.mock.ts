import type { User } from "../UserManagementAPI";

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
