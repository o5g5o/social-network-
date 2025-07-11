import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import defaultAvatar from "../../images/default-avatar.svg";

export default function UsersDiscovery() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: async () => {
      const url = search
        ? `http://localhost:8080/users?search=${encodeURIComponent(search)}`
        : `http://localhost:8080/users`;
      const res = await axios.get(url, { withCredentials: true });
      return res.data;
    },
    staleTime: 30000,
  });

  const getImageUrl = (imagePath) => {
    console.log(imagePath)
    if (!imagePath) return defaultAvatar;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:8080${imagePath}`;
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-bold text-lg mb-4">Discover People</h3>
      
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 text-sm"
      />

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="text-center py-4 text-gray-500 text-sm">
            Loading...
          </div>
        )}

        {data && data.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No users found
          </div>
        )}

        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.slice(0, 5).map((user) => (
              <div
                key={user.id}
                onClick={() => navigate(`/profile/${user.id}`)}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
              >
                <img
                  src={getImageUrl(user.profilePic)}
                  alt={user.nickname || user.firstName}
                  className="w-10 h-10 rounded-full object-cover bg-gray-200"
                  onError={(e) => {
                    e.target.src = defaultAvatar;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {user.nickname || `${user.firstName} ${user.lastName}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.isPrivate ? "Private" : "Public"} • {user.isFollowing ? "Following" : "Not following"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.length > 5 && (
          <button
            onClick={() => navigate("/users")}
            className="w-full mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            See more users
          </button>
        )}
      </div>
    </div>
  );
}