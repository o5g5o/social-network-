// useCommentMutation.js
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export function useCommentMutation(onSuccess) {
  return useMutation({
    mutationFn: async (userdata) => {
      const res = await axios.post("http://localhost:8080/comments", userdata, {
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: (data) => {
      console.log("Comment successful:", data);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Comment failed:", error.response?.data || error.message);
    },
  });
}
