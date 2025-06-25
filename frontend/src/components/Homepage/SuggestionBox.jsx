import { useAuth } from "../auth/Authorization";
import defaultAvatar from "../../images/default-avatar.svg";
import media from "../../images/media.svg";
import poll from "../../images/poll.svg";
import { useState } from "react";
import { useCreatePost } from "../posts/Createpost"; 

export default function SuggestionBox({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  const { mutate, isPending } = useCreatePost(() => {
    setContent("");
    setImage(null);
    onPostCreated();
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const formData = new FormData();
    formData.append("content", content);
    if (image) formData.append("image", image);

    mutate(formData);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith("http") ? path : `http://localhost:8080${path}`;
  };

  const userProfilePic = user?.profilePic
    ? getImageUrl(user.profilePic)
    : defaultAvatar;

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 mb-4">
          <img
            src={userProfilePic}
            alt="User avatar"
            className="w-10 h-10 rounded-full object-cover bg-gray-200"
            onError={(e) => {
              e.target.src = defaultAvatar;
            }}
          />
          <input
            type="text"
            name="content"
            placeholder="What's happening?"
            className="bg-gray-100 px-4 py-2 rounded-full w-full text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <img src={media} className="w-5 h-5" />
              <span>Images</span>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files[0])}
              />
            </label>
            <span className="flex items-center gap-2">
              <img src={poll} className="w-5 h-5" />
              <span>Poll</span>
            </span>
          </div>

          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {isPending ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
