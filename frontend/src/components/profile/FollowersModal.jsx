import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import defaultAvatar from "../../images/default-avatar.svg";

export default function FollowersModal({ userId, type, onClose }) {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: [type, userId],
    queryFn: async () => {
      const url = `http://localhost:8080/profile/${type}?userId=${userId}`;
      const res = await axios.get(url, { withCredentials: true });
      return res.data;
    },
  });

  const getImageUrl = (imagePath) => {
    if (!imagePath) return defaultAvatar;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:8080${imagePath}`;
  };

  const handleUserClick = (userId) => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md h-[500px] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">
            {type === "followers" ? "Followers" : "Following"}
          </h2>
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
              Error loading {type}
            </div>
          )}

          {data && data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No {type} yet
            </div>
          )}

          {data && data.length > 0 && (
            <div className="space-y-3">
              {data.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <img
                    src={getImageUrl(user.profilePic)}
                    alt={user.nickname || user.firstName}
                    className="w-12 h-12 rounded-full object-cover bg-gray-200"
                    onError={(e) => {
                      e.target.src = defaultAvatar;
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold">
                      {user.nickname || `${user.firstName} ${user.lastName}`}
                    </p>
                    {user.nickname && (
                      <p className="text-sm text-gray-500">
                        {user.firstName} {user.lastName}
                      </p>
                    )}
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