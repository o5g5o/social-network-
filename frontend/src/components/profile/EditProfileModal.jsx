import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export default function EditProfileModal({ profile, onClose, onUpdate }) {
  const [nickname, setNickname] = useState(profile.nickname || "");
  const [aboutMe, setAboutMe] = useState(profile.aboutMe || "");
  const [isPrivate, setIsPrivate] = useState(profile.isPrivate);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post(
        "http://localhost:8080/profile/update",
        data,
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      onUpdate();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ nickname, aboutMe, isPrivate });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your nickname"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              About Me
            </label>
            <textarea
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Tell us about yourself..."
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {aboutMe.length}/1000 characters
            </p>
          </div>

          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Private Profile
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-7">
              Only your followers can see your posts and profile information
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}