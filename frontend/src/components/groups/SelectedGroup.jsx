import { useState, useRef, useEffect } from "react";
import Group_Events from "./Events";

export default function GroupMainContent({
  selectedGroup,
  search,
  setSearch,
  searchResults,
  invitedUsers,
  handleInvite,
  getImageUrl,
  
}) {
  const [activeTab, setActiveTab] = useState("posts");
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    function handleClickOutside(evt) {
      if (dropdownRef.current && !dropdownRef.current.contains(evt.target)) {
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setSearch]);

  return (
  <div className="flex flex-col h-full w-full">
    {!selectedGroup ? (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
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
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Select a Group
          </h3>
          <p className="text-gray-500 max-w-md">
            Choose a group from the sidebar to view its details, manage
            members, and access group features.
          </p>
        </div>
      </div>
    ) : (
      <div className="flex flex-col flex-1 space-y-4">
        {/* Header + Search */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full flex-none">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-200 border">
              <img
                src={getImageUrl(selectedGroup.image, "group")}
                alt={selectedGroup.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {selectedGroup.title}
              </h1>
              <p className="text-gray-600 text-sm leading-relaxed truncate">
                {selectedGroup.description}
              </p>
              {/* User Search */}
              <div className="relative mt-4" ref={dropdownRef}>
                <input
                  type="text"
                  placeholder="Search users by name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-12 text-sm"
                />
                <svg
                  className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {search && (
                  <div className="absolute z-50 mt-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar">
                    {searchResults.length ? (
                      searchResults.map((user, idx) => (
                        <div key={user.id}>
                          <div className="flex justify-between items-center px-6 py-4 hover:bg-gray-50">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border">
                                <img
                                  src={getImageUrl(user.image, "user")}
                                  alt={user.nickname || user.email}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <span className="font-medium text-gray-900 block truncate">
                                  {user.nickname || user.email}
                                </span>
                                {user.nickname && (
                                  <span className="text-xs text-gray-500 truncate">
                                    {user.email}
                                  </span>
                                )}
                              </div>
                            </div>
                            {invitedUsers.includes(user.id) ? (
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                                ✓ Invited
                              </span>
                            ) : (
                              <button
                                onClick={() => handleInvite(user.id)}
                                className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-xs hover:bg-purple-700"
                              >
                                Invite
                              </button>
                            )}
                          </div>
                          {idx < searchResults.length - 1 && (
                            <div className="border-t border-gray-100 mx-6" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center">
                        <p className="text-gray-500 font-medium">No users found</p>
                        <p className="text-gray-400 text-sm">
                          Try a different search term
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Bar (fixed, not scrollable) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 w-full flex-none">
          <div className="flex gap-2">
            {/* Posts */}
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === "posts"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Posts
            </button>
            {/* Events */}
            <button
              onClick={() => setActiveTab("events")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === "events"
                  ? "bg-green-600 text-white shadow"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Events
            </button>
            {/* Chat */}
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === "chat"
                  ? "bg-purple-600 text-white shadow"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Chat
            </button>
          </div>
        </div>

        {/* Scrollable Content Pane */}
        <div className="flex-1  min-h-[200px]">
          {activeTab === "posts" && "Posts coming soon…"}
          {activeTab === "events" && <Group_Events group_id ={selectedGroup.id} />}
          {activeTab === "chat" && "Group chat coming soon…"}
        </div>
      </div>
    )}
  </div>
);

}
