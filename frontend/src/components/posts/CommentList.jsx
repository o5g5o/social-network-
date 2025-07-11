import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import defaultAvatar from "../../images/default-avatar.svg";

export default function CommentList({ postId, isOpen, onClose }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const response = await axios.get(
        `http://localhost:8080/comments?postId=${postId}`,
        { withCredentials: true }
      );
      return response.data;
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Comments</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-4 text-gray-500">Loading comments...</div>
      )}

      {error && (
        <div className="text-center py-4 text-red-500">
          Error loading comments
        </div>
      )}

      {data && data.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {data.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <img
                src={defaultAvatar}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover bg-gray-200"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold">{comment.username}</p>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}