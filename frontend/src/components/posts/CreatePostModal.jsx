import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import defaultAvatar from "../../images/default-avatar.svg";

export default function CreatePostModal({ onClose, onPostCreated }) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [privacy, setPrivacy] = useState("public");
  const [selectedViewers, setSelectedViewers] = useState([]);
  const [showViewerSelection, setShowViewerSelection] = useState(false);

  // Get followers for private post selection
  const { data: followers } = useQuery({
    queryKey: ["myFollowers"],
    queryFn: async () => {
      const res = await axios.get(
        `http://localhost:8080/profile/followers?userId=me`,
        { withCredentials: true }
      );
      return res.data;
    },
    enabled: privacy === "private",
  });

  const createPostMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await axios.post("http://localhost:8080/posts", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    },
    onSuccess: () => {
      onPostCreated();
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const formData = new FormData();
    formData.append("content", content);
    formData.append("privacy", privacy);
    
    if (image) {
      formData.append("image", image);
    }
    
    if (privacy === "private" && selectedViewers.length > 0) {
      selectedViewers.forEach(viewerId => {
        formData.append("selectedViewers[]", viewerId);
      });
    }

    createPostMutation.mutate(formData);
  };

  const toggleViewer = (userId) => {
    setSelectedViewers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return defaultAvatar;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:8080${imagePath}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Create Post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Content */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
            />

            {/* Image Upload */}
            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer text-purple-600 hover:text-purple-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  hidden
                />
              </label>
              {image && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {image.name}
                </div>
              )}
            </div>

            {/* Privacy Selection */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who can see this post?
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={privacy === "public"}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="text-purple-600"
                  />
                  <div>
                    <div className="font-medium">Public</div>
                    <div className="text-sm text-gray-500">Anyone on Social Network</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="privacy"
                    value="followers"
                    checked={privacy === "followers"}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="text-purple-600"
                  />
                  <div>
                    <div className="font-medium">Followers</div>
                    <div className="text-sm text-gray-500">Only people who follow you</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={privacy === "private"}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="text-purple-600"
                  />
                  <div>
                    <div className="font-medium">Selected Followers</div>
                    <div className="text-sm text-gray-500">Choose specific followers</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Viewer Selection for Private Posts */}
            {privacy === "private" && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowViewerSelection(!showViewerSelection)}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  {showViewerSelection ? "Hide" : "Select"} followers ({selectedViewers.length} selected)
                </button>
                
                {showViewerSelection && followers && (
                  <div className="mt-3 border rounded-lg max-h-48 overflow-y-auto">
                    {followers.length === 0 ? (
                      <p className="p-4 text-center text-gray-500">No followers yet</p>
                    ) : (
                      followers.map((follower) => (
                        <label
                          key={follower.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedViewers.includes(follower.id)}
                            onChange={() => toggleViewer(follower.id)}
                            className="text-purple-600"
                          />
                          <img
                            src={getImageUrl(follower.profilePic)}
                            alt={follower.nickname || follower.firstName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-sm">
                            {follower.nickname || `${follower.firstName} ${follower.lastName}`}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {privacy === "public" && "This post will be visible to everyone"}
              {privacy === "followers" && "This post will be visible to your followers"}
              {privacy === "private" && `This post will be visible to ${selectedViewers.length} selected follower${selectedViewers.length !== 1 ? 's' : ''}`}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim() || createPostMutation.isPending}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}