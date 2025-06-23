// App.jsx
import React from "react";
import Post from "./Post"
import SuggestionBox from "./SuggestionBox";
import Sidebar from "./Sidebar";
import absoluteCinema from "../images/absolutecinema.jpg";
import img from "../images/yes.jpg";


function Homepage() {
  const placeholderPosts = [
    {
      username: "Ahmed Aburowais",
      profilePic: absoluteCinema,
      content: "Beautiful",
      image: img,
      time: "2h ago",
      comments: 13,
      likes: 340,
    },
    {
      username: "Ahmed Aburowais",
      profilePic: absoluteCinema,
      content: "Beautiful",
      image: img,
      time: "2h ago",
      comments: 13,
      likes: 340,
    },
    {
      username: "Ahmed Aburowais",
      profilePic: absoluteCinema,
      content: "Beautiful",
      image: img,
      time: "2h ago",
      comments: 13,
      likes: 340,
    },
    {
      username: "Ahmed Aburowais",
      profilePic: absoluteCinema,
      content: "Beautiful",
      image: img,
      time: "2h ago",
      comments: 13,
      likes: 340,
    },
    {
      username: "Ahmed Aburowais",
      profilePic: absoluteCinema,
      content: "Beautiful",
      image: img,
      time: "2h ago",
      comments: 13,
      likes: 340,
    },
    {
      username: "Ahmed Aburowais",
      profilePic: absoluteCinema,
      content: "Beautiful",
      image: img,
      time: "2h ago",
      comments: 13,
      likes: 340,
    },
    {
      username: "Ahmed Aburowais",
      profilePic: absoluteCinema,
      content: "Beautiful",
      image: img,
      time: "2h ago",
      comments: 13,
      likes: 340,
    },
    {
      username: "Ahmed Aburowais",
      profilePic: absoluteCinema,
      content: "Beautiful",
      image: img,
      time: "2h ago",
      comments: 13,
      likes: 340,
    },
    {
      username: "Ahmed Aburowais",
      profilePic: absoluteCinema,
      content: "Beautiful",
      image: img,
      time: "2h ago",
      comments: 13,
      likes: 340,
    },
    {
      username: "Ahmed Aburowais",
      profilePic: absoluteCinema,
      content: "Beautiful",
      image: img,
      time: "2h ago",
      comments: 13,
      likes: 340,
    },
  ];

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
        <div>Profile</div>
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar ) */}
       <Sidebar/>

        {/* Middle Area */}

        <div className="w-[60%] p-4 bg-gray-100">
          <div className="flex justify-between gap-4">
            {/* Posts (70% of middle) */}
            <div className="w-[70%]">
                {/* Suggestion Posts */}
                <SuggestionBox/>
              {/* Posts */}
              {placeholderPosts.map((post, index) => (
                <Post key={index} {...post} />
              ))}
            </div>

            {/* Extra area dont know what this will be yet */}
            <div className="w-[30%] bg-white rounded shadow p-4 hidden xl:block">
            </div>
          </div>
        </div>

        {/* Right Sidebar  */}
        <div className="w-[25%] bg-white p-4 hidden lg:block">
          Right Sidebar
        </div>
      </div>
    </div>
  );
}

export default Homepage;
