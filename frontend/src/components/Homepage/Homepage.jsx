import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import axios from "axios";
import Post from "../posts/Post";
import SuggestionBox from "./SuggestionBox";
import Sidebar from "./Sidebar";
import UsersDiscovery from "../users/UsersDiscovery";

function Homepage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["posts", page],
    queryFn: async () => {
      const response = await axios.get(
        `http://localhost:8080/posts?page=${page}&limit=10`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
  });

  const handlePostCreated = () => {
    refetch(); // Refresh posts when a new post is created
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white-100 flex items-center justify-center">
        <div>Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white-100 flex items-center justify-center">
        <div>Error loading posts: {error.message}</div>
      </div>
    );
  }

  const posts = data?.posts || [];

  return (
    <div className="min-h-screen bg-white-100 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-white px-6 py-4 shadow flex items-center justify-between border-b border-gray-50">
        <div className="text-xl font-bold text-black">Social Network</div>
        <input
          type="text"
          placeholder="Search..."
          className="px-3 py-2 border border-gray-300 rounded w-1/3"
        />
        <Link 
          to="/profile" 
          className="text-gray-700 hover:text-purple-600 font-medium"
        >
          Profile
        </Link>
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar ) */}
        <Sidebar />

        {/* Middle Area */}

        <div className="w-[60%] p-4 bg-gray-100">
          <div className="flex justify-between gap-4">
            {/* Posts (70% of middle) */}
            <div className="w-[70%]">
              {/* Suggestion Posts */}
              <SuggestionBox onPostCreated={handlePostCreated} />
              {/* Posts */}
              {posts.length === 0 ? (
                <div className="bg-white p-8 rounded shadow text-center text-gray-500">
                  No posts yet. Be the first to create one!
                </div>
              ) : (
                posts.map((post) => (
                  <Post key={post.id} {...post} onUpdate={refetch}  />
                ))
              )}

              {/* Pagination */}
              {posts.length > 0 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white rounded shadow disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 bg-white rounded shadow">
                    Page {page}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={posts.length < 10}
                    className="px-4 py-2 bg-white rounded shadow disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Extra area dont know what this will be yet */}
            <div className="w-[30%] bg-white rounded shadow p-4 hidden xl:block"></div>
          </div>
        </div>

        {/* Right Sidebar  */}
        <div className="w-[25%] bg-white p-4 hidden lg:block">
          <UsersDiscovery />
        
        </div>
      </div>
    </div>
  );
}

export default Homepage;