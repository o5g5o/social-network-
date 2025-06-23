// Post.jsx
export default function Post({
  username,
  content,
  image,
  time,
  comments,
  likes,
  profilePic,
}) {
  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={profilePic}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover"
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
          <img src={image} alt="post" className="w-full mt-2 rounded" />
        )}
      </div>

      {/* Likes & Comments */}
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span> {comments} Comments</span>
        <span> {likes} Likes</span>
      </div>

      <input
        type="text"
        placeholder="Write a comment..."
        className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
      />
    </div>
  );
}
