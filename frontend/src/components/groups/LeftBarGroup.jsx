import { useAuth } from "../auth/Authorization";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import axios from "axios";
import PublicGroups from "./RightBarGroup";
import groupdefaultAvatar from "../../images/group-default-avatar.png";
import userdefaultAvatar from "../../images/default-avatar.svg";
import GroupMainContent from "./SelectedGroup";

const fetchUserGroups = async (userId) => {
  const { data } = await axios.get(
    `http://localhost:8080/groups/user-groups?user_id=${userId}`
  );
  return data || [];
};

const fetchUserInvitations = async (userId) => {
  const res = await axios.get(
    `http://localhost:8080/groups/user-invitations?user_id=${userId}`
  );
  return res.data ?? [];
};

export const ViewGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupImage, setGroupImage] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [invitedUsers, setInvitedUsers] = useState([]);

  const { data: invitations = [], refetch: refetchInvitations } = useQuery({
    queryKey: ["userInvitations", user?.id],
    queryFn: () => fetchUserInvitations(user.id),
    enabled: !!user?.id,
  });

  const handleInvite = async (targetUserId) => {
    if (!selectedGroup) {
      alert("Please select a group first");
      return;
    }
    try {
      await axios.post("http://localhost:8080/groups/invite-to-group", {
        group_id: selectedGroup.id,
        target_user_id: targetUserId,
        inviter_id: user.id,
      });
      setInvitedUsers((prev) => [...prev, targetUserId]);
      refetchInvitations();
    } catch (err) {
      console.error("Invite error:", err);
      alert("Failed to invite user.");
    }
  };

  const handleGroupCreate = (e) => {
    e.preventDefault();
    if (!groupTitle.trim()) return;

    const formData = new FormData();
    formData.append("title", groupTitle);
    formData.append("description", groupDescription);
    formData.append("creator_id", user.id);
    if (groupImage) formData.append("image", groupImage);

    axios
      .post("http://localhost:8080/groups/creategroups", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        setGroupTitle("");
        setGroupDescription("");
        setGroupImage(null);
        setShowModal(false);
        queryClient.invalidateQueries({ queryKey: ["userGroups", user?.id] });
      })
      .catch((err) => {
        console.error("Group creation failed", err);
        alert("Failed to create group.");
      });
  };

  useEffect(() => {
    if (!user?.id) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(() => {
      if (search.trim()) {
        axios
          .get(
            `http://localhost:8080/groups/search-users?q=${encodeURIComponent(
              search
            )}&user_id=${user.id}&group_id=${selectedGroup?.id}`
          )
          .then((res) => setSearchResults(res.data || []))
          .catch(() => setSearchResults([]));
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [search, user?.id, selectedGroup?.id]);
  console.log(selectedGroup)
  const {
    data: groups = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["userGroups", user?.id],
    queryFn: () => fetchUserGroups(user.id),
    enabled: !!user?.id,
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading groups...</p>
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Groups
            </h3>
            <p className="text-gray-600">{error.message}</p>
          </div>
        </div>
      </div>
    );

  const getImageUrl = (imagePath, type) => {
    if (!imagePath)
      return type === "user" ? userdefaultAvatar : groupdefaultAvatar;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:8080${imagePath}`;
  };

  const handleJoinPublicGroup = async (groupId) => {
    try {
      await axios.post("http://localhost:8080/groups/request-join", {
        group_id: groupId,
        user_id: user.id,
      });
      alert("Request sent!");
      queryClient.invalidateQueries({ queryKey: ["publicGroups", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["joinRequests", user?.id] });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to request join.");
    }
  };

  return (
    <div className="flex bg-gray-0 h-screen overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-80 flex flex-col bg-white border-r border-gray-400 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Your Groups</h2>
          <p className="text-sm text-gray-500">
            Manage and explore your communities
          </p>
        </div>

  <div className="flex-1 bg-white border-r border-gray-300 overflow-y-auto min-h-0 custom-scrollbar">
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">
                No groups joined yet
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Create or join a group to get started
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {groups.map((group, index) => (
                <div key={group.id}>
                  <div
                    onClick={() => {
                      setSelectedGroup(group);
                      console.log(selectedGroup);
                      setInvitedUsers([]);
                      setSearch("");
                    }}
                    className={`cursor-pointer p-4 rounded-xl transition-all duration-200 group hover:bg-gray-50 ${
                      selectedGroup?.id === group.id
                        ? "bg-blue-50 border-2 border-blue-200 shadow-sm"
                        : "border-2 border-transparent hover:border-gray-100"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-md overflow-hidden bg-gray-200 border ${
                          selectedGroup?.id === group.id
                            ? "border-blue-600"
                            : "border-gray-300 group-hover:border-gray-400"
                        }`}
                      >
                        <img
                          src={getImageUrl(group.image, "group")}
                          alt={group.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold truncate text-sm ${
                            selectedGroup?.id === group.id
                              ? "text-blue-900"
                              : "text-gray-900"
                          }`}
                        >
                          {group.title}
                        </h3>
                        {group.description && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {group.description}
                          </p>
                        )}
                      </div>
                      {selectedGroup?.id === group.id && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  {index < groups.length - 1 && (
                    <div className="my-2 border-t-2 border-gray-300 w-full" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Group Button & Inline Popup */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0 relative">
          <button
            onClick={() => setShowModal(!showModal)}
            className="w-full flex items-center justify-center gap-3 bg-purple-600 text-white px-4 py-3 rounded-xl hover:bg-purple-700 transition-colors duration-200 font-medium shadow-sm"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
            Create New Group
          </button>

          {showModal && (
            <div className="absolute bottom-20 left-4 right-4 bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 z-50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Create a Group
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleGroupCreate} className="space-y-4">
                {/* Group Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Group Title
                  </label>
                  <input
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    placeholder="Enter group title"
                    required
                  />
                </div>

                {/* Group Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-16 resize-none text-sm"
                    placeholder="Describe your group"
                  ></textarea>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Group Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setGroupImage(e.target.files[0])}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:rounded-lg file:bg-white file:text-sm file:font-medium hover:file:bg-gray-100"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium text-sm"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </aside>


<main className="flex-1 flex flex-col h-full ">
  <div className="flex-1 flex flex-col h-full w-full px-4 sm:px-8 py-8">
    <GroupMainContent
      selectedGroup={selectedGroup}
      search={search}
      setSearch={setSearch}
      searchResults={searchResults}
      invitedUsers={invitedUsers}
      handleInvite={handleInvite}
      getImageUrl={getImageUrl}
    />
  </div>
</main>


      {/* Right Sidebar */}
      <aside className="w-80 bg-white border-l border-gray-400 shadow-sm ">
        <div className="p-6">
          <PublicGroups
            handleJoin={handleJoinPublicGroup}
            invitations={invitations}
            refetchInvitations={refetchInvitations}
          />
        </div>
      </aside>
    </div>
  );
};
