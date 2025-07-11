import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../auth/Authorization";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

const fetchEvents = async (userId, groupId) => {
  const res = await axios.get(
    `http://localhost:8080/groups/events?user_id=${userId}&group_id=${groupId}`
  );
  return res.data ?? [];
};

const fetchGoingEvents = async (userId, groupId) => {
  const res = await axios.get(
    `http://localhost:8080/groups/going_events?user_id=${userId}&group_id=${groupId}`
  );
  return res.data ?? [];
};

export default function Group_Events({ group_id }) {
  const [showModal, setShowModal] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const { user } = useAuth();
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    datetime: "",
    restrictedAge: "",
    groupid: group_id,
    userid: user.id,
  });

  const queryClient = useQueryClient();

  const { data: events = [], refetch: refetchEvents } = useQuery({
    queryKey: ["group-events", user?.id, group_id],
    queryFn: () => fetchEvents(user.id, group_id),
    enabled: !!user?.id && !!group_id,
  });

  const { data: goingEvents = [], refetch: refetchGoingEvents } = useQuery({
    queryKey: ["going-group-events", user?.id, group_id],
    queryFn: () => fetchGoingEvents(user.id, group_id),
    enabled: !!user?.id && !!group_id,
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        !event.target.classList.contains("slide-arrow-btn")
      ) {
        setPanelOpen(false);
      }
    };
    if (panelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [panelOpen]);

  const createEvent = useMutation({
    mutationFn: async () => {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("datetime", formData.datetime);
      data.append("restrictedAge", formData.restrictedAge);
      data.append("groupid", formData.groupid);
      data.append("userid", formData.userid);

      const response = await axios.post(
        "http://localhost:8080/groups/groups-event",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["group-events", user?.id, group_id]);
      refetchEvents();
      setShowModal(false);
      setFormData({
        title: "",
        description: "",
        datetime: "",
        restrictedAge: "",
        groupid: group_id,
        userid: user.id,
      });
    },
    onError: (err) => {
      console.error("Failed to create event:", err);
    },
  });

const respondToEventMutation = useMutation({
  mutationFn: ({ eventId, response }) =>
    axios.post("http://localhost:8080/groups/event-response", {
      event_id: eventId,
      user_id: user.id,
      group_id: group_id,
      response,
    }),
  onSuccess: () => {
    queryClient.invalidateQueries(["group-events", user?.id, group_id]);
    queryClient.invalidateQueries(["going-group-events", user?.id, group_id]);
    refetchEvents()
    refetchGoingEvents()
  },
  onError: (err) => {
    console.error("Failed to respond to event:", err);
  },
});

const respondToEvent = (eventId, response) => {
  respondToEventMutation.mutate({ eventId, response });
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createEvent.mutate(formData);
  };

  // Only events with NO response
  const notRespondedEvents = events.filter((event) => !event.user_response);

  return (
    <div className="relative min-h-[450px] max-h-[80vh] border border-gray-300 rounded-lg bg-white overflow-hidden">
      {/* Slide-in panel and toggle button */}
      {/* The button is always visible at the top right of the container */}
      <button
        ref={buttonRef}
        className="absolute top-4 right-4 z-30 w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center shadow transition-transform duration-300"
        onClick={() => setPanelOpen((open) => !open)}
        aria-label={panelOpen ? "Hide unresponded events" : "Show unresponded events"}
      >
        <svg
          className={`w-6 h-6 transition-transform duration-300 ${panelOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Slide-in Panel */}
      <div
        ref={panelRef}
        className={`absolute top-0 right-0 h-full w-full max-w-xs bg-white border-l border-gray-300 rounded-l-lg shadow-xl z-20 transition-transform duration-300 ${
          panelOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
        style={{ willChange: "transform" }}
      >
        <div className="p-6 pt-14 h-full overflow-y-auto custom-scrollbar">
          <h2 className="text-lg font-semibold mb-3">📬 Not Responded</h2>
          {notRespondedEvents.length === 0 ? (
            <div className="text-gray-400 text-center mt-10">No pending events</div>
          ) : (
            notRespondedEvents.map((event) => (
              <div
                key={event.id}
                className="bg-gray-100 border border-gray-200 rounded-lg p-3 mb-4 shadow-sm"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">📌 {event.title}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.event_time).toLocaleString()}
                  </span>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => respondToEvent(event.id, "going")}
                      className="px-2 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600"
                    >
                      Going
                    </button>
                    <button
                      onClick={() => respondToEvent(event.id, "not_going")}
                      className="px-2 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600"
                    >
                      Not Going
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Going Events Section (scrollable, minimal padding above & below) */}
      <div className="px-4 py-2 space-y-3 h-[350px] max-h-[60vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-lg font-bold mb-2">🎉 Events You're Going To</h2>
        {goingEvents.length === 0 ? (
          <p className="text-gray-500 text-sm italic">You're not attending any events yet.</p>
        ) : (
          goingEvents.map((event) => (
            <div
              key={event.id}
              className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm transition hover:shadow-md"
            >
              <h3 className="text-md font-semibold">📌 {event.title}</h3>
              <p className="text-sm text-gray-600">{event.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                🕒 {new Date(event.event_time).toLocaleString()} &nbsp;|&nbsp; 🎂 {event.age}+
              </p>
            </div>
          ))
        )}
      </div>

      {/* Floating Create Event Button + Modal (bottom left) */}
      <div className="absolute bottom-4 left-4 z-40 flex flex-col items-end gap-2">
        {showModal && (
          <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80">
            <h2 className="text-lg font-semibold mb-3">Create Event</h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block mb-1 font-medium">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-2 py-1"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-2 py-1"
                  rows="2"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Day/Time</label>
                <input
                  type="datetime-local"
                  name="datetime"
                  value={formData.datetime}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-2 py-1"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Restricted Age</label>
                <input
                  type="number"
                  name="restrictedAge"
                  value={formData.restrictedAge}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-2 py-1"
                  required
                />
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEvent.isPending}
                  className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white"
                >
                  {createEvent.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        )}

        <button
          onClick={() => setShowModal(!showModal)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors duration-200 font-medium shadow-sm"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Create New Event
        </button>
      </div>
    </div>
  );
}
