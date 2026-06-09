import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  token: null,

  login: (user, token) => {
    localStorage.setItem("token", token);

    set({
      user,
      token,
    });
  },

  logout: () => {
    localStorage.removeItem("token");

    set({
      user: null,
      token: null,
    });
  },
}));

export default useAuthStore;