import React, { useState } from "react";
import { useAuth } from "../auth/Authorization";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import groupdefaultAvatar from "../../images/group-default-avatar.png";
import userdefaultAvatar from "../../images/default-avatar.svg";

const getImage = (image, type) => {
  if (!image) return type === "user" ? userdefaultAvatar : groupdefaultAvatar;
  if (image.startsWith("http")) return image;
  console.log(image);
  return `http://localhost:8080${image}`;
};

const fetchPublicGroups = async (userId) => {
  const res = await axios.get(
    `http://localhost:8080/groups/public?user=${userId}`
  );
  return res.data ?? [];
};

const requestJoinGroup = async ({ groupId, userId }) => {
  const res = await axios.post("http://localhost:8080/groups/request-join", {
    group_id: groupId,
    user_id: userId,
  });
  return res.data;
};

const fetchJoinRequestsForCreator = async (userId) => {
  const res = await axios.get(
    `http://localhost:8080/groups/get-join-requests?user_id=${userId}`
  );
  return res.data ?? [];
};

const respondToRequest = async ({ invitationId, action, userId, groupId }) => {
  const res = await axios.post(
    "http://localhost:8080/groups/respond-requests",
    {
      invitation_id: invitationId,
      action,
      user_id: userId,
      group_id: groupId,
    }
  );
  return res.data;
};

const PublicGroups = ({ handleJoin, invitations, refetchInvitations }) => {
  const { user } = useAuth();
  const [publicSearch, setPublicSearch] = useState("");
  const queryClient = useQueryClient();
  const [showing, setShowing] = useState("requests");

  const {
    data: groups = [],
    isLoading: loadingGroups,
    refetch: refetchGroups,
  } = useQuery({
    queryKey: ["publicGroups", user?.id],
    queryFn: () => fetchPublicGroups(user.id),
    enabled: !!user,
  });

  const joinMutation = useMutation({
    mutationFn: requestJoinGroup,
    onSuccess: () => {
      alert("Request sent!");
      refetchGroups();
      refetchJoinRequests();
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Failed to request join.");
    },
  });

  const {
    data: joinRequests = [],

    refetch: refetchJoinRequests,
  } = useQuery({
    queryKey: ["joinRequests", user?.id],
    queryFn: () => fetchJoinRequestsForCreator(user.id),
    enabled: !!user,
  });

  const respondMutation = useMutation({
    mutationFn: respondToRequest,
    onSuccess: () => {
      alert("Response saved.");
      refetchJoinRequests();
      refetchGroups();
    },
    onError: () => {
      alert("Failed to process response.");
    },
  });

  const handleResponse = (invitationId, user_id, action, groupId) => {
    respondMutation.mutate({ invitationId, action, userId: user_id, groupId });
  };

  const filteredGroups = groups.filter((g) =>
    g.title.toLowerCase().includes(publicSearch.toLowerCase())
  );

  const handleInvitationAction = async ({ invitationId, groupId }, action) => {
    try {
      await axios.post("http://localhost:8080/groups/respond-invitation", {
        invitation_id: invitationId,
        group_id: groupId,
        user_id: user.id,
        action,
      });
      queryClient.invalidateQueries({ queryKey: ["userGroups", user?.id] });
      refetchInvitations();
    } catch (error) {
      console.error("Failed to respond to invitation", error);
    }
  };
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Half - Discover Groups */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              Discover Groups
            </h2>
          </div>
          <div className="relative">
            <input
              type="text"
              value={publicSearch}
              onChange={(e) => setPublicSearch(e.target.value)}
              placeholder="Search public groups"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-10"
            />
            <svg
              className="absolute right-3 top-2.5 w-4 h-4 text-gray-400"
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
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loadingGroups ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mb-3"></div>
              <p className="text-sm text-gray-500">Loading groups...</p>
            </div>
          ) : (publicSearch === "" ? groups : filteredGroups).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium text-center">
                {publicSearch
                  ? "No matching groups found"
                  : "No public groups available"}
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                {publicSearch
                  ? "Try a different search term"
                  : "Check back later for new groups"}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {(publicSearch === "" ? groups : filteredGroups).map((group) => (
                <div
                  key={group.id}
                  className="bg-gray-50 border border-gray-200 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={getImage(group.image, "group")}
                          alt={group.id}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {group.title}
                        </h3>
                        {group.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      disabled={joinMutation.isLoading}
                      onClick={() => handleJoin(group.id)}
                      className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
                    >
                      {joinMutation.isLoading ? "..." : "Request"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-300"></div>

      {/* Bottom Half - Join Requests / Invitations */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toggle and Title */}
        <div className="px-4 py-4 border-b border-gray-200 ">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  {showing === "requests" ? (
                    // Request icon SVG (user-plus style)
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M18 9a3 3 0 11-6 0 3 3 0 016 0zM2 20h16M2 20a6 6 0 0112 0"
                      />
                    </svg>
                  ) : (
                    // Mail icon SVG
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <h2 className="text-base font-semibold text-gray-900 ">
                {showing === "requests" ? "Requests" : "Invitations"}
              </h2>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setShowing("requests")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  showing === "requests"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Requests
              </button>
              <button
                onClick={() => setShowing("invitations")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  showing === "invitations"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Invitations
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col max-h-64">
          <div className="flex-1 flex flex-col">
            {showing === "requests" ? (
              joinRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 font-medium text-center">
                    No join requests
                  </p>
                  <p className="text-xs text-gray-400 text-center mt-1">
                    Group join requests will appear here
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 p-4">
                  {joinRequests.map((req) => (
                    <div
                      key={req.requestID}
                      className="bg-gray-50 border border-gray-200 p-3 rounded-lg hover:bg-gray-100 transition-colors flex flex-col"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-6 h-6 bg-blue-100 rounded-full overflow-hidden flex items-center justify-center border">
                            <img
                              src={getImage(req.image, "user")}
                              alt={req.nickname}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-900 text-sm">
                              {req.nickname}
                            </span>
                            <p className="text-xs text-gray-600 truncate">
                              wants to join{" "}
                              <span className="font-medium">{req.title}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleResponse(
                                req.id,
                                req.user_id,
                                "accept",
                                req.group_id
                              )
                            }
                            className="text-green-600 hover:text-green-700 transition-colors"
                            title="Accept"
                          >
                            ✔️
                          </button>
                          <button
                            onClick={() =>
                              handleResponse(
                                req.id,
                                req.user_id,
                                "decline",
                                req.group_id
                              )
                            }
                            className="text-red-600 hover:text-red-700 transition-colors"
                            title="Decline"
                          >
                            ✖️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : invitations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium text-center">
                  No invitations
                </p>
                <p className="text-xs text-gray-400 text-center mt-1">
                  Group invitations will appear here
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 p-4">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-gray-50 border border-gray-200 p-3 rounded-lg hover:bg-gray-100 transition-colors flex flex-col"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-6 h-6 border rounded-full overflow-hidden flex items-center justify-center">
                          <img
                            src={getImage(inv.image, "group")}
                            alt={inv.id}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {inv.title}
                          </h3>
                          <p className="text-xs text-gray-600 truncate">
                            From:{" "}
                            <span className="font-medium">
                              {inv.invitor_name}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleInvitationAction(
                              {
                                invitationId: inv.invitation_id,
                                groupId: inv.group_id,
                              },
                              "accept"
                            )
                          }
                          className="text-green-600 hover:text-green-700 transition-colors"
                          title="Accept"
                        >
                          👍
                        </button>
                        <button
                          onClick={() =>
                            handleInvitationAction(
                              {
                                invitationId: inv.invitation_id,
                                groupId: inv.group_id,
                              },
                              "decline"
                            )
                          }
                          className="text-red-600 hover:text-red-700 transition-colors"
                          title="Decline"
                        >
                          👎
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicGroups;
