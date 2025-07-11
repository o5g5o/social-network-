// useCommentMutation.js
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export function useCommentMutation(onSuccess) {
  return useMutation({
    mutationFn: async (userdata) => {
      // Transform comment to content as backend expects
      const payload = {
        postId: userdata.postId,
        content: userdata.comment
      };
      const res = await axios.post("http://localhost:8080/comments", payload, {
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