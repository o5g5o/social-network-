import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../auth/Authorization";
import defaultAvatar from "../../images/default-avatar.svg";
import Post from "../posts/Post";
import EditProfileModal from "./EditProfileModal";
import FollowersModal from "./FollowersModal";
import FollowRequests from "./FollowRequests";

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFollowRequests, setShowFollowRequests] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", userId || "me"],
    queryFn: async () => {
      const url = userId
        ? `http://localhost:8080/profile?userId=${userId}`
        : "http://localhost:8080/profile?userId=me";
      const res = await axios.get(url, { withCredentials: true });
      return res.data;
    },
  });

  const togglePrivacyMutation = useMutation({
    mutationFn: async (isPrivate) => {
      const res = await axios.post(
        "http://localhost:8080/profile/privacy",
        { isPrivate },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      profileQuery.refetch();
    },
  });

  const getImageUrl = (imagePath) => {
    if (!imagePath) return defaultAvatar;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:8080${imagePath}`;
  };

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (profileQuery.error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-500">Error loading profile</div>
      </div>
    );
  }

  const profile = profileQuery.data;
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const displayName = profile.nickname || fullName;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start gap-8">
            {/* Profile Picture */}
            <img
              src={getImageUrl(profile.profilePic)}
              alt={displayName}
              className="w-32 h-32 rounded-full object-cover bg-gray-200"
              onError={(e) => {
                e.target.src = defaultAvatar;
              }}
            />

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  {profile.nickname && (
                    <p className="text-gray-500">{fullName}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
                </div>

                {profile.isOwnProfile ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => togglePrivacyMutation.mutate(!profile.isPrivate)}
                      className={`px-4 py-2 rounded-md ${
                        profile.isPrivate
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      {profile.isPrivate ? "Private" : "Public"}
                    </button>
                    {profile.isPrivate && (
                      <button
                        onClick={() => setShowFollowRequests(true)}
                        className="px-4 py-2 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50"
                      >
                        Follow Requests
                      </button>
                    )}
                  </div>
                ) : (
                  <FollowButton
                    userId={profile.id}
                    isFollowing={profile.isFollowing}
                    hasPendingRequest={profile.hasPendingRequest}
                    onUpdate={() => profileQuery.refetch()}
                  />
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-4 items-center">
                <div className="text-center">
                  <div className="font-bold text-xl">{profile.posts?.length || 0}</div>
                  <div className="text-gray-500 text-sm">Posts</div>
                </div>
                {(profile.canViewFullProfile !== false || profile.isOwnProfile) ? (
                  <>
                    <button
                      onClick={() => setShowFollowersModal(true)}
                      className="text-center hover:bg-gray-50 px-3 py-1 rounded transition-colors"
                    >
                      <div className="font-bold text-xl">{profile.followersCount || 0}</div>
                      <div className="text-gray-500 text-sm">Followers</div>
                    </button>
                    <button
                      onClick={() => setShowFollowingModal(true)}
                      className="text-center hover:bg-gray-50 px-3 py-1 rounded transition-colors"
                    >
                      <div className="font-bold text-xl">{profile.followingCount || 0}</div>
                      <div className="text-gray-500 text-sm">Following</div>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-center px-3 py-1 cursor-not-allowed">
                      <div className="font-bold text-xl">{profile.followersCount || 0}</div>
                      <div className="text-gray-500 text-sm">Followers</div>
                    </div>
                    <div className="text-center px-3 py-1 cursor-not-allowed">
                      <div className="font-bold text-xl">{profile.followingCount || 0}</div>
                      <div className="text-gray-500 text-sm">Following</div>
                    </div>
                  </>
                )}
              </div>

              {/* About Me */}
              {profile.aboutMe && (
                <div className="mb-4">
                  <p className="text-gray-700">{profile.aboutMe}</p>
                </div>
              )}

              {/* Additional Info */}
              {(profile.canViewFullProfile !== false || profile.isOwnProfile) && (
                <div className="flex gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Born {new Date(profile.dateOfBirth).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-6">Posts</h2>
        {profile.canViewFullProfile === false ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-gray-500">This account is private</p>
            <p className="text-sm text-gray-400 mt-2">Follow this user to see their posts</p>
          </div>
        ) : profile.posts && profile.posts.length > 0 ? (
          <div className="space-y-6">
            {profile.posts.map((post) => (
              <Post key={post.id} {...post} onUpdate={() => profileQuery.refetch()} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            No posts yet
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onUpdate={() => {
            profileQuery.refetch();
            setShowEditModal(false);
          }}
        />
      )}

      {showFollowersModal && (
        <FollowersModal
          userId={profile.id}
          type="followers"
          onClose={() => setShowFollowersModal(false)}
        />
      )}

      {showFollowingModal && (
        <FollowersModal
          userId={profile.id}
          type="following"
          onClose={() => setShowFollowingModal(false)}
        />
      )}

      {showFollowRequests && profile.isOwnProfile && (
        <FollowRequests
          userId={profile.id}
          onClose={() => setShowFollowRequests(false)}
        />
      )}
    </div>
  );
}

// Follow Button Component
function FollowButton({ userId, isFollowing, hasPendingRequest, onUpdate }) {
  const [localPending, setLocalPending] = useState(hasPendingRequest);

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        // Unfollow
        const res = await axios.post(
          `http://localhost:8080/follow/unfollow`,
          { userId },
          { withCredentials: true }
        );
        return { ...res.data, action: 'unfollow' };
      } else if (localPending) {
        // Cancel request
        const res = await axios.post(
          `http://localhost:8080/follow/cancel`,
          { userId },
          { withCredentials: true }
        );
        return { ...res.data, action: 'cancel' };
      } else {
        // Send follow request
        const res = await axios.post(
          `http://localhost:8080/follow/request`,
          { userId },
          { withCredentials: true }
        );
        return { ...res.data, action: 'follow' };
      }
    },
    onSuccess: (data) => {
      if (data.action === 'cancel') {
        setLocalPending(false);
      } else if (data.action === 'follow') {
        setLocalPending(data.status === 'pending');
      }
      onUpdate();
    },
  });

  const getButtonText = () => {
    if (isFollowing) return "Following";
    if (localPending) return "Requested";
    return "Follow";
  };

  const getButtonStyle = () => {
    if (isFollowing) {
      return "bg-gray-200 hover:bg-gray-300 text-gray-700";
    } else if (localPending) {
      return "bg-gray-100 hover:bg-gray-200 text-gray-600";
    }
    return "bg-purple-600 hover:bg-purple-700 text-white";
  };

  return (
    <button
      onClick={() => followMutation.mutate()}
      disabled={followMutation.isPending}
      className={`w-28 px-4 py-2 rounded-md font-medium transition-colors ${getButtonStyle()}`}
    >
      {followMutation.isPending ? "..." : getButtonText()}
    </button>
  );
}