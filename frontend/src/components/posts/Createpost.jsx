import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export function useCreatePost(onSuccess) {
  return useMutation({
    mutationFn: async (formData) => {
      const response = await axios.post("http://localhost:8080/posts", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess,
  });
}
