import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import defaultAvatar from "../../images/default-avatar.svg";

export default function FollowRequests({ userId, onClose }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["followRequests", userId],
    queryFn: async () => {
      const res = await axios.get(
        `http://localhost:8080/follow/requests`,
        { withCredentials: true }
      );
      return res.data;
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (followerId) => {
      const res = await axios.post(
        "http://localhost:8080/follow/accept",
        { followerId },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (followerId) => {
      const res = await axios.post(
        "http://localhost:8080/follow/decline",
        { followerId },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const getImageUrl = (imagePath) => {
    if (!imagePath) return defaultAvatar;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:8080${imagePath}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md h-[500px] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Follow Requests</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              Error loading requests
            </div>
          )}

          {data && data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No pending follow requests
            </div>
          )}

          {data && data.length > 0 && (
            <div className="space-y-3">
              {data.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <img
                    src={getImageUrl(request.profilePic)}
                    alt={request.nickname || request.firstName}
                    className="w-12 h-12 rounded-full object-cover bg-gray-200"
                    onError={(e) => {
                      e.target.src = defaultAvatar;
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold">
                      {request.nickname || `${request.firstName} ${request.lastName}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      wants to follow you
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => declineMutation.mutate(request.id)}
                      disabled={declineMutation.isPending}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => acceptMutation.mutate(request.id)}
                      disabled={acceptMutation.isPending}
                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}