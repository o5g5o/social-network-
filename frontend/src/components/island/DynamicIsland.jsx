import { useState } from "react";

/**
 * DynamicIsland – minimal recreation of the expanding / collapsing island.
 * Only the pill buttons + expansion mechanic are wired; inner views are placeholders.
 * Requires TailwindCSS for utility classes.
 */
export default function DynamicIsland() {
  /* -------- state -------- */
  const [isExpanded, setIsExpanded] = useState(false);   // pill vs panel
  const [activeMenu, setActiveMenu] = useState(null);    // 'history' | 'messages' | null

  /* -------- handlers -------- */
  const toggleIsland = () => setIsExpanded(prev => !prev);

  const handleMsgClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setActiveMenu("history");
    } else {
      // collapse everything for this stripped‑down demo
      setIsExpanded(false);
      setActiveMenu(null);
    }
  };

  /* -------- UI -------- */
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* expansion container */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out
                    ${isExpanded ? "max-h-96 mb-3" : "max-h-0 mb-0"}`}
      >
        {/* HISTORY PANEL (placeholder) */}
        <section className={`${activeMenu === "history" ? "block" : "hidden"} bg-white rounded-2xl shadow-xl`}>
          <div className="p-6 text-center text-sm text-gray-500">History view</div>
        </section>

        {/* MESSAGES PANEL (placeholder) */}
        <section className={`${activeMenu === "messages" ? "block" : "hidden"} bg-white rounded-2xl shadow-xl`}>
          <div className="p-6 text-center text-sm text-gray-500">Messages view</div>
        </section>
      </div>

      {/* dynamic island pill */}
      <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md shadow-lg rounded-full px-4 py-2">
        {/* create‑post button (static) */}
        <img src="../static/images/post-create.svg" className="w-5 h-5 cursor-pointer" alt="new post" />

        {/* message button */}
        <img
          src="../static/images/mail-empty.svg"
          className="w-5 h-5 cursor-pointer"
          onClick={handleMsgClick}
          alt="messages"
        />

        {/* logout button (static) */}
        <img src="../static/images/logout.svg" className="w-5 h-5 cursor-pointer" alt="logout" />

        {/* expand / collapse button */}
        <img
          src={isExpanded ? "../static/images/collapse.svg" : "../static/images/expand.svg"}
          className="w-5 h-5 cursor-pointer"
          onClick={toggleIsland}
          alt="toggle"
        />
      </div>
    </div>
  );
}