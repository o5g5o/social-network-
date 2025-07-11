import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export function useGroupMutation(onSuccess) {
  return useMutation({
    mutationFn: async (groupData) => {
      console.log(groupData)
      const response = await axios.post("http://localhost:8080/groups/creategroups", groupData);
      return response.data;
    },
    onSuccess
  });
}
