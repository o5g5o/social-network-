// Post.jsx
import defaultAvatar from "../../images/default-avatar.svg";
import { useState } from "react";
import { useCommentMutation } from "./Createcomment";

export default function Post({
  id,
  username,
  content,
  image,
  time,
  comments,
  likes,
  profilePic,
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

  const [comment , setComment] = useState("") 
  const postId = id
   const commentMutation = useCommentMutation(() => {
  onUpdate();         
  setComment("");     
});
   const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    commentMutation.mutate({ comment , postId});
    
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

      {/* Likes & Comments */}
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span> {comments} Comments</span>
        <span> {likes} Likes</span>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Write a comment..."
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </form>
    </div>
  );
}
