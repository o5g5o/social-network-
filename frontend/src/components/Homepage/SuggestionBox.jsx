import { useAuth } from "../auth/Authorization";
import defaultAvatar from "../../images/default-avatar.svg";
import media from "../../images/media.svg";
import poll from "../../images/poll.svg";
import { useState } from "react";
import CreatePostModal from "../posts/CreatePostModal";

export default function SuggestionBox({ onPostCreated }) {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith("http") ? path : `http://localhost:8080${path}`;
  };

  const userProfilePic = user?.profilePic
    ? getImageUrl(user.profilePic)
    : defaultAvatar;

  return (
    <>
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={userProfilePic}
            alt="User avatar"
            className="w-10 h-10 rounded-full object-cover bg-gray-200"
            onError={(e) => {
              e.target.src = defaultAvatar;
            }}
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gray-100 px-4 py-2 rounded-full w-full text-sm text-left text-gray-500 hover:bg-gray-200"
          >
            What's happening?
          </button>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex gap-6">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 hover:text-purple-600"
            >
              <img src={media} className="w-5 h-5" />
              <span>Images</span>
            </button>
            <span className="flex items-center gap-2 opacity-50 cursor-not-allowed">
              <img src={poll} className="w-5 h-5" />
              <span>Poll</span>
            </span>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-purple-700"
          >
            Post
          </button>
        </div>
      </div>

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={onPostCreated}
        />
      )}
    </>
  );
}