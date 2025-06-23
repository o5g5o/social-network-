import absoluteCinema from "../images/absolutecinema.jpg";
import media from "../images/media.svg";
import poll from "../images/poll.svg"

export default function SuggestionBox() {
  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <div className="flex items-center gap-3 mb-4">
        <img
          src={absoluteCinema}
          alt="User avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <input
          type="text"
          placeholder="What’s happening?"
          className="bg-gray-100 px-4 py-2 rounded-full w-full text-sm"
        />
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex gap-6">
          <span className="flex items-center gap-2">
            <img src={media} className="w-5 h-5" />
            <span>Images</span>
          </span>
          <span className="flex items-center gap-2">
            <img src={poll}  className="w-5 h-5" />
            <span>Poll</span>
          </span>
        </div>

        <button className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-medium">
          Post
        </button>
      </div>
    </div>
  );
}
