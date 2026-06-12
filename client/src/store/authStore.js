import { create } from "zustand";

const useAuthStore = create((set) => {
  let initialUser = null;
  try {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      initialUser = JSON.parse(savedUser);
    }
  } catch (e) {
    console.error("Failed to parse user from localStorage", e);
  }

  let initialProgram = null;
  try {
    const savedProgram = localStorage.getItem("selectedProgram");
    if (savedProgram) {
      initialProgram = JSON.parse(savedProgram);
    }
  } catch (e) {
    console.error("Failed to parse selectedProgram from localStorage", e);
  }

  return {
    user: initialUser,
    token: localStorage.getItem("token") || null,
    selectedProgram: initialProgram,
    selectedAcademicYear: localStorage.getItem("selectedAcademicYear") || null,

    login: (user, token) => {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.removeItem("selectedProgram");
      localStorage.removeItem("selectedAcademicYear");

      set({
        user,
        token,
        selectedProgram: null,
        selectedAcademicYear: null,
      });
    },

    selectProgram: (program, academicYear) => {
      localStorage.setItem("selectedProgram", JSON.stringify(program));
      localStorage.setItem("selectedAcademicYear", academicYear);

      set({
        selectedProgram: program,
        selectedAcademicYear: academicYear,
      });
    },

    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("selectedProgram");
      localStorage.removeItem("selectedAcademicYear");

      set({
        user: null,
        token: null,
        selectedProgram: null,
        selectedAcademicYear: null,
      });
    },
  };
});

export default useAuthStore;