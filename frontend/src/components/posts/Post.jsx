// Post.jsx
import defaultAvatar from "../../images/default-avatar.svg";
import { useState } from "react";
import { useCommentMutation } from "./Createcomment";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import CommentList from "./CommentList";

export default function Post({
  id,
  username,
  content,
  image,
  time,
  comments,
  likes,
  profilePic,
  isLiked,
  onUpdate,
}) {
  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // If it's already a full URL, return as is
    if (imagePath.startsWith("http")) return imagePath;
    // Otherwise, prepend the backend URL
    return `http://localhost:8080${imagePath}`;
  };

  const [comment, setComment] = useState("");
  const [localLikes, setLocalLikes] = useState(likes);
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [showComments, setShowComments] = useState(false);
  const postId = id;

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const method = localIsLiked ? "DELETE" : "POST";
      const res = await axios({
        method: method,
        url: `http://localhost:8080/posts/like?id=${postId}`,
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {
      if (localIsLiked) {
        setLocalLikes(localLikes - 1);
        setLocalIsLiked(false);
      } else {
        setLocalLikes(localLikes + 1);
        setLocalIsLiked(true);
      }
    },
    onError: (error) => {
      console.error("Like/Unlike failed:", error);
    },
  });

  // Comment mutation
  const commentMutation = useCommentMutation(() => {
    onUpdate();
    setComment("");
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    commentMutation.mutate({ comment, postId });
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={profilePic ? getImageUrl(profilePic) : defaultAvatar}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover bg-gray-200"
            onError={(e) => {
              e.target.src = defaultAvatar;
            }}
          />

          <div>
            <p className="font-semibold text-sm">{username}</p>
          </div>
        </div>
        <span className="text-xs text-gray-400">{time}</span>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-sm">{content}</p>
        {image && (
          <img
            src={getImageUrl(image)}
            alt="post"
            className="w-full mt-2 rounded max-h-96 object-contain"
            onError={(e) => {
              console.error("Failed to load image:", image);
              e.target.style.display = "none";
            }}
          />
        )}
      </div>

      {/* Likes & Comments with Like Button */}
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <button
          onClick={() => setShowComments(!showComments)}
          className="hover:text-purple-600 transition-colors"
        >
          {comments} Comments
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${
              localIsLiked
                ? "bg-purple-100 text-purple-600"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill={localIsLiked ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>{localLikes}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Write a comment..."
            className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            type="submit"
            disabled={commentMutation.isPending || !comment.trim()}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {commentMutation.isPending ? "..." : "Send"}
          </button>
        </div>
      </form>

      {/* Comments Section */}
      <CommentList
        postId={postId}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
}